import { First, Rest, Comparable, Ctor, TypeOfHelper } from './brew';

/**
 * Assertion wrapper for the value
 * @typeParam T The testing value type
 */
export declare class Chifir<T, CtxList extends unknown []> {
    /** @ignore */
    constructor(value: T, ctxList: CtxList);

    /**
     * Asserts the value is neither null nor undefined
     */
    exist: Chifir<NonNullable<T>, CtxList>;

    /**
     * Asserts the value is strictly deep-equal to `expected`
     * @param expected 
     */
    eq(expected: T): Chifir<T, CtxList>;

    /**
     * Asserts the value is not strictly deep-equal to `cmpValue`
     * @param expected 
     */
    ne(cmpValue: T): Chifir<T, CtxList>;

    /**
     * Asserts the value and `expected` are the same
     * @param expected
     */
    sameAs(expected: T): Chifir<T, CtxList>;

    /**
     * Asserts the value is strictly less than `n`
     * @param n
     */
    lt(cmpValue: Comparable<T>): Chifir<T, CtxList>;

    /**
     * Asserts the value is strictly greater than `n`
     * @param n
     */
    gt(cmpValue: Comparable<T>): Chifir<T, CtxList>;

    /**
     * Asserts the value is less than or equal to `n`
     * @param n
     */
    le(cmpValue: Comparable<T>): Chifir<T, CtxList>;

    /**
     * Asserts the value is greater than or equal to `n`
     * @param n
     */
    ge(cmpValue: Comparable<T>): Chifir<T, CtxList>;

    /**
     * Asserts that calling the value causes an exception to be thrown
     * @param args Arguments passed to the value
     * @returns Chifir wrapper for the thrown value
     */
    throws(...args: unknown[]): Chifir<unknown, []>;

    /**
     * Asserts that accessing the `key` property causes an exception to be thrown
     * @param key
     * @returns Chifir wrapper for the thrown value
     */
    propThrows(key: keyof T): Chifir<unknown, []>;

    /**
     * Asserts the value has own property `key`
     * @param key 
     * @returns Chifir wrapper for the property
     */
    prop<K extends keyof T>(key: K): Chifir<T[K], [T & object, ...CtxList]>;

    /**
     * Returns Chifir wrapper for the context of the value acquired after calling {@link Chifir.prop | prop()}.
     * ```ts
     * expect(person()).prop('name').eq('John')
     *     .context().prop('surname').eq('Doe');
     * ```
     */
    context(): Chifir<First<CtxList>, Rest<CtxList>>;

    /**
     * Asserts the value is the instance of class `ctor`
     * @param ctor
     */
    instanceOf<R>(ctor: Ctor<R>): Chifir<T & R, CtxList>;

    /**
     * Asserts the value is of the type `expected`
     * @param expected
     */
    typeOf<K extends keyof TypeOfHelper>(expected: K): Chifir<TypeOfHelper[K], CtxList>;
}

/**
 * Assertion wrapper for promise
 * @typeParam T The testing value type
 */
export declare class ChifirAsync<T, CtxList extends unknown []> {
    /** @ignore */
    constructor(pvalue: PromiseLike<[T, CtxList]>);

    /**
     * See {@link Chifir.exist | Chifir.exist}
     */
    exist: ChifirAsync<NonNullable<T>, CtxList>;

    /**
     * See {@link Chifir.eq | Chifir.eq}
     */
    eq(expected: T): ChifirAsync<T, CtxList>;

    /**
     * See {@link Chifir.ne | Chifir.ne}
     */
    ne(cmpValue: T): ChifirAsync<T, CtxList>;

    /**
     * See {@link Chifir.sameAs | Chifir.sameAs}
     */
    sameAs(expected: T): ChifirAsync<T, CtxList>;

    /**
     * See {@link Chifir.lt | Chifir.lt}
     */
    lt(cmpValue: Comparable<T>): ChifirAsync<T, CtxList>;

    /**
     * See {@link Chifir.gt | Chifir.gt}
     */
    gt(cmpValue: Comparable<T>): ChifirAsync<T, CtxList>;

    /**
     * See {@link Chifir.le | Chifir.le}
     */
    le(cmpValue: Comparable<T>): ChifirAsync<T, CtxList>;

    /**
     * See {@link Chifir.ge | Chifir.ge}
     */
    ge(cmpValue: Comparable<T>): ChifirAsync<T, CtxList>;

    /**
     * See {@link Chifir.throws | Chifir.throws}
     */
    throws(...args: unknown[]): ChifirAsync<unknown, []>;

    /**
     * See {@link Chifir.propThrows | Chifir.propThrows}
     */
    propThrows(key: keyof T): ChifirAsync<unknown, []>;

    /**
     * See {@link Chifir.prop | Chifir.prop}
     */
    prop<K extends keyof T>(key: K): ChifirAsync<T[K], [T & object, ...CtxList]>;

    /**
     * See {@link Chifir.context | Chifir.context}
     */
    context(): ChifirAsync<First<CtxList>, Rest<CtxList>>;

    /**
     * See {@link Chifir.instanceOf | Chifir.instanceOf}
     */
    instanceOf<R>(ctor: Ctor<R>): ChifirAsync<T & R, CtxList>;

    /**
     * See {@link Chifir.typeOf | Chifir.typeOf}
     */
    typeOf<K extends keyof TypeOfHelper>(expected: K): ChifirAsync<TypeOfHelper[K], CtxList>;

    /**
     * Asserts the value resolves
     * @returns Chifir wrapper for the resolved value
     */
    resolves: PromiseLike<Chifir<T, CtxList>>;

    /**
     * Asserts the value rejects
     * @param cleanUp Handle for the resolved value (if assertion failed)
     * @returns ChifirAsync wrapper for the rejection result
     */
    rejects(cleanUp?: (value: T) => void): ChifirAsync<unknown, []>;

    then<TResult1 = Chifir<T, CtxList>, TResult2 = never>(
        onfulfilled?: ((value: Chifir<T, CtxList>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): PromiseLike<TResult1 | TResult2>;
}

/**
 * Entry point for assertion
 * @param value
 * @returns Chifir wrapper for `value`
 */
export function expect<T>(value: T): Chifir<T, []>;

/**
 * Entry point for assertion in async mode
 * @param pvalue
 * @returns ChifirAsync wrapper for `pvalue`
 */
export function expectAsync<T>(pvalue: PromiseLike<T>): ChifirAsync<T, []>;
