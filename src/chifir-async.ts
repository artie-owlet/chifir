import {
    BrewGet, BrewCall, BrewGeneric, setupChifir,
    First, Rest,
    Ctor, TypeOfHelper,
    prepareError, makeError,
} from './brew';

type ChifirAsyncFromBrew<T, CtxList extends unknown[]> = {
    [K in keyof BrewGet<T, CtxList>]: ChifirAsync<BrewGet<T, CtxList>[K], CtxList>;
} & {
    [K in keyof BrewCall<T, CtxList>]:
        (...args: Parameters<BrewCall<T, CtxList>[K]>) => ChifirAsync<ReturnType<BrewCall<T, CtxList>[K]>, CtxList>;
};

export class ChifirAsyncImpl<T, CtxList extends unknown[]> {
    constructor(
        public readonly pvalue: PromiseLike<[T, CtxList]>,
    ) {
    }

    public prop<K extends keyof T>(key: K): ChifirAsync<T[K], [T & object, ...CtxList]> {
        const err = prepareError(this.prop);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                return new BrewGeneric(v, ctxList, err).prop(key);
            })
        ) as ChifirAsync<T[K], [T & object, ...CtxList]>;
    }

    public context(): ChifirAsync<First<CtxList>, Rest<CtxList>> {
        const err = prepareError(this.context);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                return new BrewGeneric(v, ctxList, err).context();
            })
        ) as ChifirAsync<First<CtxList>, Rest<CtxList>>;
    }

    public instanceOf<R>(ctor: Ctor<R>): ChifirAsync<T & R, CtxList> {
        const err = prepareError(this.instanceOf);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                return [
                    new BrewGeneric(v, ctxList, err).instanceOf(ctor),
                    ctxList,
                ];
            })
        ) as ChifirAsync<T & R, CtxList>;
    }

    public typeOf<K extends keyof TypeOfHelper>(expected: K): ChifirAsync<TypeOfHelper[K], CtxList> {
        const err = prepareError(this.typeOf);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                return [
                    new BrewGeneric(v, ctxList, err).typeOf(expected),
                    ctxList,
                ];
            })
        ) as ChifirAsync<TypeOfHelper[K], CtxList>;
    }

    public rejects(cleanUp?: (value: T) => void): ChifirAsync<unknown, []> {
        const err = prepareError(this.rejects);
        return new ChifirAsyncImpl(this.pvalue.then(([value, _]) => {
            if (cleanUp) {
                cleanUp(value);
            }
            throw makeError(err, '.reject()', undefined);
        }, (reason) => {
            return [reason, []];
        })) as ChifirAsync<unknown, []>;
    }

    public get value(): PromiseLike<T> {
        return this.pvalue.then(p => p[0]);
    }

    public then<TResult1 = void, TResult2 = never>(
        onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        return this.pvalue.then(() => {
            if (onfulfilled) {
                return onfulfilled();
            }
            /* c8 ignore next */
            return undefined as TResult1;
        }, onrejected);
    }
}

setupChifir(ChifirAsyncImpl.prototype, (key) => {
    return function(this: ChifirAsyncImpl<unknown, unknown[]>) {
        const err = prepareError(Object.getOwnPropertyDescriptor(ChifirAsyncImpl.prototype, key)?.get as Function);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) =>{
                const brew = new BrewGet(v, ctxList, err);
                return [brew[key], ctxList];
            })
        );
    };
}, (key) => {
    return function(this: ChifirAsyncImpl<unknown, unknown[]>, ...args: unknown[]) {
        const err = prepareError(Object.getOwnPropertyDescriptor(ChifirAsyncImpl.prototype, key)?.value as Function);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                const brew = new BrewCall(v, ctxList, err);
                return [
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    brew[key](...args),
                    ctxList,
                ];
            })
        );
    };
});

export type ChifirAsync<T, CtxList extends unknown[]> = ChifirAsyncFromBrew<T, CtxList> & ChifirAsyncImpl<T, CtxList>;
