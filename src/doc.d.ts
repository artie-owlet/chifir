import { Ctor, TypeOfHelper } from './brew';

/**
 * Assertion wrapper for the value
 * @typeParam T - the testing value type
 */
export declare class Chifir<T> {
    /** @ignore */
    constructor(value: T, ctx: unknown);

    /**
     * Asserts the value is not a null nor an undefined
     */
    exist: Chifir<NonNullable<T>>;

    /**
     * Asserts the value is strictly deep-equal to `expected`
     * @param expected 
     */
    eq(expected: T): Chifir<T>;

    /**
     * Asserts the value is not strictly deep-equal to `cmpValue`
     * @param expected 
     */
    ne(cmpValue: T): Chifir<T>;

    /**
     * Asserts the value and `expected` are the same
     * @param expected
     */
    sameAs(expected: T): Chifir<T>;

    /**
     * Asserts the value is strictly less than `n`
     * @param n
     */
    lt(n: number | bigint): Chifir<T>;

    /**
     * Asserts the value is strictly greater than `n`
     * @param n
     */
    gt(n: number | bigint): Chifir<T>;

    /**
     * Asserts the value is less than or equal to `n`
     * @param n
     */
    le(n: number | bigint): Chifir<T>;

    /**
     * Asserts the value is greater than or equal to `n`
     * @param n
     */
    ge(n: number | bigint): Chifir<T>;

    /**
     * Asserts that calling the value causes an exception to be thrown
     * @param args Arguments passed to the value
     * @returns Chifir wrapper for the thrown value
     */
    throws(...args: unknown[]): Chifir<unknown>;

    /**
     * Asserts that accessing the `key` property causes an exception to be thrown
     * @param key
     * @returns Chifir wrapper for the thrown value
     */
    propThrows(key: keyof T): Chifir<unknown>;

    /**
     * Asserts the value has own property `key`
     * @param key 
     * @returns Chifir wrapper for the property
     */
    prop<K extends keyof T>(key: K): Chifir<T[K]>;

    /**
     * Asserts the value is the instance of class `ctor`
     * @param ctor
     */
    instanceOf<R>(ctor: Ctor<R>): Chifir<R>;

    /**
     * Asserts the value is of the type `expected`
     * @param expected
     */
    typeOf<K extends keyof TypeOfHelper>(expected: K): Chifir<TypeOfHelper[K]>;
}

/**
 * Assertion wrapper for promise
 * @typeParam T - the testing value type
 */
export declare class ChifirAsync<T> {
    /** @ignore */
    constructor(pvalue: PromiseLike<[T, unknown]>);

    /**
     * See {@link Chifir.exist}
     */
    exist: ChifirAsync<NonNullable<T>>;

    /**
     * See {@link Chifir.eq}
     */
    eq(expected: T): ChifirAsync<T>;

    /**
     * See {@link Chifir.ne}
     */
    ne(cmpValue: T): ChifirAsync<T>;

    /**
     * See {@link Chifir.sameAs}
     */
    sameAs(expected: T): ChifirAsync<T>;

    /**
     * See {@link Chifir.lt}
     */
    lt(n: number | bigint): ChifirAsync<T>;

    /**
     * See {@link Chifir.gt}
     */
    gt(n: number | bigint): ChifirAsync<T>;

    /**
     * See {@link Chifir.le}
     */
    le(n: number | bigint): ChifirAsync<T>;

    /**
     * See {@link Chifir.ge}
     */
    ge(n: number | bigint): ChifirAsync<T>;

    /**
     * See {@link Chifir.throws}
     */
    throws(...args: unknown[]): ChifirAsync<unknown>;

    /**
     * See {@link Chifir.propThrows}
     */
    propThrows(key: keyof T): ChifirAsync<unknown>;

    /**
     * See {@link Chifir.prop}
     */
    prop<K extends keyof T>(key: K): ChifirAsync<T[K]>;

    /**
     * See {@link Chifir.instanceOf}
     */
    instanceOf<R>(ctor: Ctor<R>): ChifirAsync<R>;

    /**
     * See {@link Chifir.typeOf}
     */
    typeOf<K extends keyof TypeOfHelper>(expected: K): ChifirAsync<TypeOfHelper[K]>;

    /**
     * Asserts the value resolves
     * @returns Chifir wrapper for the resolved value
     */
    resolves: PromiseLike<Chifir<T>>;

    /**
     * Asserts the value rejects
     * @param cleanUp Handle for the resolved value (if assertion failed)
     * @returns ChifirAsync wrapper for the rejection result
     */
    rejects(cleanUp?: (value: T) => void): ChifirAsync<unknown>;

    then<TResult1 = Chifir<T>, TResult2 = never>(
        onfulfilled?: ((value: Chifir<T>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2>;
}

/**
 * Entry point for assertion
 * @param value
 * @returns Chifir wrapper for `value`
 */
export function expect<T>(value: T): Chifir<T>;

/**
 * Entry point for assertion in async mode
 * @param pvalue
 * @returns ChifirAsync wrapper for `pvalue`
 */
export function expectAsync<T>(pvalue: PromiseLike<T>): ChifirAsync<T>;
