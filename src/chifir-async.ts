import {
    BrewGet, BrewCall, BrewGeneric, setupChifir,
    First, Rest,
    Ctor, TypeOfHelper,
    makeAsyncError,
} from './brew';
import { Chifir, ChifirImpl } from './chifir';

type ChifirAsyncFromBrew<T, CtxList extends unknown[]> = {
    [K in keyof BrewGet<T, CtxList>]: ChifirAsync<BrewGet<T, CtxList>[K], CtxList>;
} & {
    [K in keyof BrewCall<T, CtxList>]:
        (...args: Parameters<BrewCall<T, CtxList>[K]>) => ChifirAsync<ReturnType<BrewCall<T, CtxList>[K]>, CtxList>;
};

function getStack(fn: Function): string {
    const stackCatcher = {} as { stack: string };
    Error.captureStackTrace(stackCatcher, fn);
    const { stack } = stackCatcher;
    return stack.split('\n')[1];
}

class ChifirAsyncImpl<T, CtxList extends unknown[]> {
    constructor(
        public readonly pvalue: PromiseLike<[T, CtxList]>,
    ) {
    }

    public prop<K extends keyof T>(key: K): ChifirAsync<T[K], [T & object, ...CtxList]> {
        const stack = getStack(this.prop);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                return new BrewGeneric(v, ctxList, stack).prop(key);
            })
        ) as ChifirAsync<T[K], [T & object, ...CtxList]>;
    }

    public context(): ChifirAsync<First<CtxList>, Rest<CtxList>> {
        const stack = getStack(this.context);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                return new BrewGeneric(v, ctxList, stack).context();
            })
        ) as ChifirAsync<First<CtxList>, Rest<CtxList>>;
    }

    public instanceOf<R>(ctor: Ctor<R>): ChifirAsync<R, CtxList> {
        const stack = getStack(this.instanceOf);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                return [
                    new BrewGeneric(v, ctxList, stack).instanceOf(ctor),
                    ctxList,
                ];
            })
        ) as ChifirAsync<R, CtxList>;
    }

    public typeOf<K extends keyof TypeOfHelper>(expected: K): ChifirAsync<TypeOfHelper[K], CtxList> {
        const stack = getStack(this.typeOf);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                return [
                    new BrewGeneric(v, ctxList, stack).typeOf(expected),
                    ctxList,
                ];
            })
        ) as ChifirAsync<TypeOfHelper[K], CtxList>;
    }

    public get resolves(): PromiseLike<Chifir<T, CtxList>> {
        const stack = getStack(Object.getOwnPropertyDescriptor(ChifirAsyncImpl.prototype, 'resolves')?.get as Function);
        return this.then(c => c, (reason) => {
            throw makeAsyncError(reason, 'Expected to resolve', stack);
        });
    }

    public rejects(cleanUp?: (value: T) => void): ChifirAsync<unknown, []> {
        const stack = getStack(this.rejects);
        return new ChifirAsyncImpl(this.pvalue.then(([value, _]) => {
            if (cleanUp) {
                cleanUp(value);
            }
            throw makeAsyncError(undefined, 'Expected to reject', stack);
        }, (reason) => {
            return [reason, []];
        })) as ChifirAsync<unknown, []>;
    }

    public then<TResult1 = Chifir<T, CtxList>, TResult2 = never>(
        onfulfilled?: ((value: Chifir<T, CtxList>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        return this.pvalue.then(([value, ctxList]) => {
            if (onfulfilled) {
                return onfulfilled(new ChifirImpl(value, ctxList) as Chifir<T, CtxList>);
            }
            return new ChifirImpl(value, ctxList) as TResult1;
        }, onrejected);
    }
}

setupChifir(ChifirAsyncImpl.prototype, (key) => {
    return function(this: ChifirAsyncImpl<unknown, unknown[]>) {
        const stack = getStack(Object.getOwnPropertyDescriptor(ChifirAsyncImpl.prototype, key)?.get as Function);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) =>{
                const brew = new BrewGet(v, ctxList, stack);
                return [brew[key], ctxList];
            })
        );
    };
}, (key) => {
    return function(this: ChifirAsyncImpl<unknown, unknown[]>, ...args: unknown[]) {
        const stack = getStack(Object.getOwnPropertyDescriptor(ChifirImpl.prototype, key)?.value as Function);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctxList]) => {
                const brew = new BrewCall(v, ctxList, stack);
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

type ChifirAsync<T, CtxList extends unknown[]> = ChifirAsyncFromBrew<T, CtxList> & ChifirAsyncImpl<T, CtxList>;

export function expectAsync<T>(pvalue: PromiseLike<T>): ChifirAsync<T, []> {
    return new ChifirAsyncImpl(pvalue.then(v => [v, []])) as unknown as ChifirAsync<T, []>;
}
