import {
    BrewGet, BrewCall, BrewGeneric, setupChifir,
    First, Rest,
    Ctor, TypeOfHelper,
    prepareError, makeError,
} from './brew';
import { ChifirAsync, ChifirAsyncImpl } from './chifir-async';

type ChifirFromBrew<T, CtxList extends unknown[]> = {
    [K in keyof BrewGet<T, CtxList>]: Chifir<BrewGet<T, CtxList>[K], CtxList>
} & {
    [K in keyof BrewCall<T, CtxList>]:
        (...args: Parameters<BrewCall<T, CtxList>[K]>) => Chifir<ReturnType<BrewCall<T, CtxList>[K]>, CtxList>;
};

export type StrictAwaited<T> =
    T extends null | undefined ? never :
        (T extends object & { then(onfulfilled: infer F, ...args: unknown[]): any } ?
            (F extends ((value: infer V, ...args: unknown[]) => any) ? Awaited<V> : never) : never);

class ChifirImpl<T, CtxList extends unknown[]> {
    constructor(
        public readonly value: T,
        public readonly ctxList: CtxList,
    ) {
    }

    public prop<K extends keyof T>(key: K): Chifir<T[K], [T & object, ...CtxList]> {
        return new ChifirImpl(
            ...(new BrewGeneric(this.value, this.ctxList, prepareError(this.prop)).prop(key))
        ) as Chifir<T[K], [T & object, ...CtxList]>;
    }

    public context(): Chifir<First<CtxList>, Rest<CtxList>> {
        return new ChifirImpl(
            ...(new BrewGeneric(this.value, this.ctxList, prepareError(this.context)).context())
        ) as Chifir<First<CtxList>, Rest<CtxList>>;
    }

    public instanceOf<R>(ctor: Ctor<R>): Chifir<T & R, CtxList> {
        return new ChifirImpl(
            new BrewGeneric(this.value, this.ctxList, prepareError(this.instanceOf)).instanceOf(ctor),
            this.ctxList,
        ) as Chifir<T & R, CtxList>;
    }

    public typeOf<K extends keyof TypeOfHelper>(expected: K): Chifir<TypeOfHelper[K], CtxList> {
        return new ChifirImpl(
            new BrewGeneric(this.value, this.ctxList, prepareError(this.prop)).typeOf(expected),
            this.ctxList,
        ) as Chifir<TypeOfHelper[K], CtxList>;
    }

    public get eventually(): ChifirAsync<StrictAwaited<T>, []> {
        if (!(typeof this.value === 'object' && this.value !== null &&
            'then' in this.value && typeof this.value.then === 'function')) {
            throw makeError(
                prepareError(Object.getOwnPropertyDescriptor(ChifirImpl.prototype, 'eventually')?.get as Function),
                'Not PromiseLike', this.value);
        }
        const pvalue = this.value as PromiseLike<StrictAwaited<T>>;
        return new ChifirAsyncImpl(pvalue.then(v => [v, []])) as ChifirAsync<StrictAwaited<T>, []>;
    }
}

setupChifir(ChifirImpl.prototype, (key) => {
    return function(this: ChifirImpl<unknown, unknown[]>) {
        const brew = new BrewGet(this.value, this.ctxList, prepareError(
            Object.getOwnPropertyDescriptor(ChifirImpl.prototype, key)?.get as Function
        ));
        return new ChifirImpl(brew[key], this.ctxList);
    };
}, (key) => {
    return function(this: ChifirImpl<unknown, unknown[]>, ...args: unknown[]) {
        const brew = new BrewCall(this.value, this.ctxList, prepareError(
            Object.getOwnPropertyDescriptor(ChifirImpl.prototype, key)?.value as Function
        ));
        return new ChifirImpl(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            brew[key](...args),
            this.ctxList,
        );
    };
});

type Chifir<T, CtxList extends unknown[]> = ChifirFromBrew<T, CtxList> & ChifirImpl<T, CtxList>;

export function expect<T>(value: T): Chifir<T, []> {
    return new ChifirImpl(value, []) as unknown as Chifir<T, []>;
}
