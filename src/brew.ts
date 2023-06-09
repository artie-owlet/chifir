import { AssertionError } from 'assert';
import { deepStrictEqual, notDeepStrictEqual } from 'assert/strict';
import { inspect } from 'util';

export type First<T extends unknown[]> = T extends [infer U, ...unknown[]] ? U : never;
export type Rest<T extends unknown[]> = T extends [unknown, ...infer U] ? U : never;

export type Comparable<T> = T extends symbol ? never : T;

export type Ctor<T> = {
    new (...args: any[]): T;
};

export type TypeOfHelper = {
    'undefined': undefined;
    'object': object;
    'boolean': boolean;
    'number': number;
    'bigint': bigint;
    'string': string;
    'symbol': symbol;
    'function': Function;
};

export function prepareError(stackStartFn: Function): AssertionError {
    return new AssertionError({
        message: '',
        stackStartFn,
    });
}

export function makeError(err: AssertionError, message: string, actual: any): AssertionError {
    err.message = `Assertion failed: ${message}\nactual = ${inspect(actual, {
        depth: 1,
        breakLength: Infinity
    })}`;
    err.stack = [
        err.message,
        err.stack?.split('\n').slice(1).join('\n'),
    ].join('\n');
    return err;
}

type BrewSame<B, T, CtxList extends unknown[]> =
    B extends BrewGeneric<unknown, unknown[]> ? BrewGeneric<T, CtxList> :
        B extends BrewCall<unknown, unknown[]> ? BrewCall<T, CtxList> :
            B extends BrewGet<unknown, unknown[]> ? BrewGet<T, CtxList> : never;

class BrewBase<T, CtxList extends unknown[]> {
    public static readonly CHECK_FAILED = Symbol();

    constructor(
        private value: T,
        private ctxList: CtxList,
        private error: AssertionError,
    ) {
    }

    protected brew<U>(value: U, ctxList?: CtxList) {
        return new (this.constructor as Ctor<BrewSame<this, U, CtxList>>)(
            value, ctxList ?? this.ctxList, this.error);
    }

    protected assert<R, C extends unknown[]>(check: (v: T, ctxList: CtxList) => [R, C], scope: Function | string
    ): [R, C] {
        try {
            return check(this.value, this.ctxList);
        } catch (err) {
            if (err === BrewBase.CHECK_FAILED || err instanceof AssertionError) {
                throw this.makeError(typeof scope === 'function' ? `.${scope.name}()` : scope);
            }
            /* c8 ignore next */
            throw err;
            /* c8 ignore next */
        }
    }

    protected is<R extends T>(check: (v: T) => boolean, scope: Function | string): R {
        return this.assert((v, ctxList) => {
            if (!check(v)) {
                throw BrewBase.CHECK_FAILED;
            }
            return [v as R, ctxList];
        }, scope)[0];
    }

    protected isTypeOf<K extends keyof TypeOfHelper>(types: K[]): T & TypeOfHelper[K] {
        return this.assert((v, ctxList) => {
            if (!types.reduce((ok, t) => ok || typeof v === t, false)) {
                throw BrewBase.CHECK_FAILED;
            }
            return [v, ctxList] as [T & TypeOfHelper[K], CtxList];
        }, `Not typeof ${types}`)[0];
    }

    private makeError(message: string): AssertionError {
        return makeError(this.error, message, this.value);
    }
}

export class BrewGet<T, CtxList extends unknown[]> extends BrewBase<T, CtxList> {
    public get exist(): NonNullable<T> {
        return this.is(v => v !== undefined && v !== null, '.exist');
    }
}

export class BrewCall<T, CtxList extends unknown[]> extends BrewBase<T, CtxList>{
    public eq(expected: T): T {
        return this.assert((v, ctxList) => {
            deepStrictEqual(v, expected);
            return [v, ctxList];
        }, this.eq)[0];
    }

    public ne(cmpValue: T): T {
        return this.assert((v, ctxList) => {
            notDeepStrictEqual(v, cmpValue);
            return [v, ctxList];
        }, this.ne)[0];
    }

    public sameAs(expected: T): T {
        return this.is(v => Object.is(v, expected), this.sameAs);
    }

    public lt(cmpValue: Comparable<T>): T {
        return this.is(v => v < cmpValue, this.lt);
    }

    public gt(cmpValue: Comparable<T>): T {
        return this.is(v => v > cmpValue, this.gt);
    }

    public le(cmpValue: Comparable<T>): T {
        return this.is(v => v <= cmpValue, this.le);
    }

    public ge(cmpValue: Comparable<T>): T {
        return this.is(v => v >= cmpValue, this.ge);
    }

    public match(re: RegExp): T & string {
        return this.brew(this.isTypeOf(['string'])).is(v => re.test(v), this.match);
    }

    public throws(...args: unknown[]): unknown {
        return this.brew(this.is<T & Function>(v => typeof v === 'function', 'Not callable'))
            .assert((v, ctxList) => {
                try {
                    v.call(ctxList[0], ...args);
                } catch (err) {
                    return [err, []];
                }
                throw BrewBase.CHECK_FAILED;
            }, this.throws)[0];
    }

    public propThrows(key: keyof T): unknown {
        return this.assert((v) => {
            try {
                v[key];
            } catch (err) {
                return [err, []];
            }
            throw BrewBase.CHECK_FAILED;
        }, this.propThrows)[0];
    }
}

export class BrewGeneric<T, CtxList extends unknown[]> extends BrewBase<T, CtxList> {
    public prop<K extends keyof T>(key: K): [T[K], [T & object, ...CtxList]] {
        return this.brew(this.isTypeOf(['object'])).assert((v, ctxList) => {
            if (!Object.hasOwn(v, key)) {
                throw BrewBase.CHECK_FAILED;
            }
            const ctxListNew = [v, ...ctxList] as [T & object, ...CtxList];
            return [v[key], ctxListNew];
        }, this.prop);
    }

    public context(): [First<CtxList>, Rest<CtxList>] {
        return this.assert((_, ctxList) => {
            if (ctxList.length === 0) {
                throw BrewBase.CHECK_FAILED;
            }
            const [v, ...ctxListNew] = ctxList;
            return [v as First<CtxList>, ctxListNew as Rest<CtxList>];
        }, this.context);
    }

    public instanceOf<R>(ctor: Ctor<R>): T & R {
        return this.assert((v, ctxList) => {
            if (!(v instanceof ctor)) {
                throw BrewBase.CHECK_FAILED;
            }
            return [v, ctxList];
        }, this.instanceOf)[0];
    }

    public typeOf<K extends keyof TypeOfHelper>(expected: K): TypeOfHelper[K] {
        return this.is(v => typeof v === expected, this.typeOf) as TypeOfHelper[K];
    }
}

type BrewGetOwnProps = Exclude<keyof BrewGet<unknown, unknown[]>, keyof BrewBase<unknown, unknown[]>>;
type BrewCallOwnProps = Exclude<keyof BrewCall<unknown, unknown[]>, keyof BrewBase<unknown, unknown[]>>;
export function setupChifir(
    proto: unknown,
    getterFactory: (key: BrewGetOwnProps) => (() => any),
    methodFactory: (key: BrewCallOwnProps) => Function,
): void {
    for (const key in Object.getOwnPropertyDescriptors(BrewGet.prototype)) {
        if (key === 'constructor') {
            continue;
        }
    
        const fn = getterFactory(key as BrewGetOwnProps);
        Object.defineProperty(fn, 'name', {
            value: `get ${key}`,
        });
        Object.defineProperty(proto, key, {
            get: fn,
            set: undefined,
            enumerable: false,
            configurable: true
        });
    }
    
    for (const key in Object.getOwnPropertyDescriptors(BrewCall.prototype)) {
        if (key === 'constructor') {
            continue;
        }
    
        const fn = methodFactory(key as BrewCallOwnProps);
        Object.defineProperty(fn, 'name', {
            value: key,
        });
        Object.defineProperty(proto, key, {
            value: fn,
            writable: true,
            enumerable: false,
            configurable: true
        });
    }
}
