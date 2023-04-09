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

function an(word: string): string {
    return ['a', 'e', 'i', 'o', 'u'].includes(word.charAt(0)) ? `an ${word}` : `a ${word}`;
}

function orList(words: string[]): string {
    if (words.length <= 2) {
        return words.join(' or ');
    }
    /* c8 ignore start */
    const last = words.pop() as string;
    return [words.join(', '), last].join(', or ');
}
/* c8 ignore stop */

export function makeAsyncError(actual: unknown, message: string, stack: string): AssertionError {
    const err = new AssertionError({
        message,
        actual,
    });
    err.stack = `${message}\n${stack}`;
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
        private stackStartFn: Function | string,
    ) {
    }

    protected brew<U>(value: U, ctxList?: CtxList) {
        return new (this.constructor as Ctor<BrewSame<this, U, CtxList>>)(
            value, ctxList ?? this.ctxList, this.stackStartFn);
    }

    protected assert<R, C extends unknown[]>(check: (v: T, ctxList: CtxList) => [R, C], message: string): [R, C] {
        try {
            return check(this.value, this.ctxList);
        } catch (err) {
            if (err === BrewBase.CHECK_FAILED || err instanceof AssertionError) {
                throw this.makeError(message);
            }
            /* c8 ignore next */
            throw err;
            /* c8 ignore next */
        }
    }

    protected is<R extends T>(check: (v: T) => boolean, message: string): R {
        return this.assert((v, ctxList) => {
            if (!check(v)) {
                throw BrewBase.CHECK_FAILED;
            }
            return [v as R, ctxList];
        }, message)[0];
    }

    protected isTypeOf<K extends keyof TypeOfHelper>(types: K[]): T & TypeOfHelper[K] {
        return this.assert((v, ctxList) => {
            if (!types.reduce((ok, t) => ok || typeof v === t, false)) {
                throw BrewBase.CHECK_FAILED;
            }
            return [v, ctxList] as [T & TypeOfHelper[K], CtxList];
        }, `Expected to be ${orList(types.map(t => an(t)))}`)[0];
    }

    private makeError(message: string): AssertionError {
        if (typeof this.stackStartFn === 'function') {
            return new AssertionError({
                message,
                actual: this.value,
                stackStartFn: this.stackStartFn,
            });
        } else {
            return makeAsyncError(this.value, message, this.stackStartFn);
        }
    }
}

export class BrewGet<T, CtxList extends unknown[]> extends BrewBase<T, CtxList> {
    public get exist(): NonNullable<T> {
        return this.is(v => v !== undefined && v !== null, 'Expected to be not null nor undefined');
    }
}

export class BrewCall<T, CtxList extends unknown[]> extends BrewBase<T, CtxList>{
    public eq(expected: T): T {
        return this.assert((v, ctxList) => {
            deepStrictEqual(v, expected);
            return [v, ctxList];
        }, `Expected to be equal to ${inspect(expected)}`)[0];
    }

    public ne(cmpValue: T): T {
        return this.assert((v, ctxList) => {
            notDeepStrictEqual(v, cmpValue);
            return [v, ctxList];
        }, `Expected to be not equal to ${inspect(cmpValue)}`)[0];
    }

    public sameAs(expected: T): T {
        return this.is(v => Object.is(v, expected), `Expected to be the same as ${inspect(expected)}`);
    }

    public lt(cmpValue: Comparable<T>): T {
        return this.is(v => v < cmpValue, `Expected to be strictly less than ${inspect(cmpValue)}`);
    }

    public gt(cmpValue: Comparable<T>): T {
        return this.is(v => v > cmpValue, `Expected to be strictly greater than ${inspect(cmpValue)}`);
    }

    public le(cmpValue: Comparable<T>): T {
        return this.is(v => v <= cmpValue, `Expected to be less than or equal to ${inspect(cmpValue)}`);
    }

    public ge(cmpValue: Comparable<T>): T {
        return this.is(v => v >= cmpValue, `Expected to be greater than or equal to ${inspect(cmpValue)}`);
    }

    public match(re: RegExp): T & string {
        return this.brew(this.isTypeOf(['string'])).is(v => re.test(v), `Expected to match ${re}`);
    }

    public throws(...args: unknown[]): unknown {
        return this.brew(this.is<T & Function>(v => typeof v === 'function', 'Expected to be callable'))
            .assert((v, ctxList) => {
                try {
                    v.call(ctxList[0], ...args);
                } catch (err) {
                    return [err, []];
                }
                throw BrewBase.CHECK_FAILED;
            }, 'Expected to throw')[0];
    }

    public propThrows(key: keyof T): unknown {
        return this.assert((v) => {
            try {
                v[key];
            } catch (err) {
                return [err, []];
            }
            throw BrewBase.CHECK_FAILED;
        }, `Expected to throw on accessing the ${inspect(key)} property`)[0];
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
        }, `Expected to have the ${inspect(key)} property`);
    }

    public context(): [First<CtxList>, Rest<CtxList>] {
        return this.assert((_, ctxList) => {
            if (ctxList.length === 0) {
                throw BrewBase.CHECK_FAILED;
            }
            const [v, ...ctxListNew] = ctxList;
            return [v as First<CtxList>, ctxListNew as Rest<CtxList>];
        }, 'The value has no context');
    }

    public instanceOf<R>(ctor: Ctor<R>): T & R {
        return this.assert((v, ctxList) => {
            if (!(v instanceof ctor)) {
                throw BrewBase.CHECK_FAILED;
            }
            return [v, ctxList];
        }, `Expected to be an instance of ${ctor.name}`)[0];
    }

    public typeOf<K extends keyof TypeOfHelper>(expected: K): TypeOfHelper[K] {
        return this.is(v => typeof v === expected, `Expected to be ${an(expected)}`) as TypeOfHelper[K];
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
