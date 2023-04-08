import { AssertionError } from 'assert';
import { deepStrictEqual, notDeepStrictEqual } from 'assert/strict';
import { inspect } from 'util';

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

type BrewSame<B, T> =
    B extends BrewGeneric<unknown> ? BrewGeneric<T> :
        B extends BrewCall<unknown> ? BrewCall<T> :
            B extends BrewGet<unknown> ? BrewGet<T> :
                B extends BrewBase<unknown> ? BrewBase<T> : never;


export function makeAsyncError(actual: unknown, message: string, stack: string): AssertionError {
    const err = new AssertionError({
        message,
        actual,
    });
    err.stack = `${message}\n${stack}`;
    return err;
}

class BrewBase<T> {
    public static readonly CHECK_FAILED = Symbol();

    constructor(
        private value: T,
        private ctx: unknown,
        private stackStartFn: Function | string,
    ) {
    }

    protected brew<U>(value: U) {
        return new (this.constructor as Ctor<BrewSame<this, U>>)(value, this.ctx, this.stackStartFn);
    }

    protected assert<R, C>(check: (v: T, ctx: unknown) => [R, C], message: string): [R, C] {
        try {
            return check(this.value, this.ctx);
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
        return this.assert((v, ctx) => {
            if (!check(v)) {
                throw BrewBase.CHECK_FAILED;
            }
            return [v as R, ctx];
        }, message)[0];
    }

    protected assertNumeric(): T & (number | bigint) {
        return this.assert((v, ctx) => {
            if (typeof v !== 'number' && typeof v !== 'bigint') {
                throw BrewBase.CHECK_FAILED;
            }
            return [v, ctx];
        }, 'Expected to be a number or a bigint')[0];
    }

    protected assertObject(): T & object {
        return this.assert((v, ctx) => {
            if (v === null || typeof v !== 'object') {
                throw BrewBase.CHECK_FAILED;
            }
            return [v, ctx];
        }, 'Expected to be an object')[0];
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

export class BrewGet<T> extends BrewBase<T> {
    public get exist(): NonNullable<T> {
        return this.is(v => v !== undefined && v !== null, 'Expected to be not null nor undefined');
    }
}

export class BrewCall<T> extends BrewBase<T>{
    public eq(expected: T): T {
        return this.assert((v, ctx) => {
            deepStrictEqual(v, expected);
            return [v, ctx];
        }, `Expected to be equal to ${inspect(expected)}`)[0];
    }

    public ne(cmpValue: T): T {
        return this.assert((v, ctx) => {
            notDeepStrictEqual(v, cmpValue);
            return [v, ctx];
        }, `Expected to be not equal to ${inspect(cmpValue)}`)[0];
    }

    public sameAs(expected: T): T {
        return this.is(v => Object.is(v, expected), `Expected to be the same as ${inspect(expected)}`);
    }

    public lt(n: number | bigint): T {
        return this.brew(this.assertNumeric()).is(v => v < n, `Expected to be strictly less than ${n}`);
    }

    public gt(n: number | bigint): T {
        return this.brew(this.assertNumeric()).is(v => v > n, `Expected to be strictly greater than ${n}`);
    }

    public le(n: number | bigint): T {
        return this.brew(this.assertNumeric()).is(v => v <= n, `Expected to be less than or equal to ${n}`);
    }

    public ge(n: number | bigint): T {
        return this.brew(this.assertNumeric()).is(v => v >= n, `Expected to be greater than or equal to ${n}`);
    }

    public throws(...args: unknown[]): unknown {
        return this.brew(this.is<T & Function>(v => typeof v === 'function', 'Expected to be callable'))
            .assert((v, ctx) => {
                try {
                    v.call(ctx, ...args);
                } catch (err) {
                    return [err, undefined];
                }
                throw BrewBase.CHECK_FAILED;
            }, 'Expected to throw')[0];
    }

    public propThrows(key: keyof T): unknown {
        return this.assert((v) => {
            try {
                v[key];
            } catch (err) {
                return [err, undefined];
            }
            throw BrewBase.CHECK_FAILED;
        }, `Expected to throw on accessing the ${inspect(key)} property`)[0];
    }
}

export class BrewGeneric<T> extends BrewBase<T> {
    public prop<K extends keyof T>(key: K): [T[K], T] {
        return this.brew(this.assertObject()).assert((v) => {
            if (!Object.hasOwn(v, key)) {
                throw BrewBase.CHECK_FAILED;
            }
            return [v[key], v];
        }, `Expected to have the ${inspect(key)} property`);
    }

    public instanceOf<R>(ctor: Ctor<R>): R {
        return this.assert((v, ctx) => {
            if (!(v instanceof ctor)) {
                throw BrewBase.CHECK_FAILED;
            }
            return [v as R, ctx];
        }, `Expected to be instance of ${ctor.name}`)[0];
    }

    public typeOf<K extends keyof TypeOfHelper>(expected: K): TypeOfHelper[K] {
        return this.is(v => typeof v === expected, `Expected to be type of ${expected}`) as TypeOfHelper[K];
    }
}

type BrewGetOwnProps = Exclude<keyof BrewGet<unknown>, keyof BrewBase<unknown>>;
type BrewCallOwnProps = Exclude<keyof BrewCall<unknown>, keyof BrewBase<unknown>>;
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
