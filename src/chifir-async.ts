import { BrewGet, BrewCall, BrewGeneric, setupChifir, Ctor, TypeOfHelper, makeAsyncError } from './brew';
import { Chifir, ChifirImpl } from './chifir';

type ChifirAsyncFromBrew<T> = {
    [K in keyof BrewGet<T>]: ChifirAsync<BrewGet<T>[K]>;
} & {
    [K in keyof BrewCall<T>]: (...args: Parameters<BrewCall<T>[K]>) => ChifirAsync<ReturnType<BrewCall<T>[K]>>;
};

function getStack(fn: Function): string {
    const stackCatcher = {} as { stack: string };
    Error.captureStackTrace(stackCatcher, fn);
    const { stack } = stackCatcher;
    return stack.split('\n')[1];
}

class ChifirAsyncImpl<T> {
    constructor(
        public readonly pvalue: PromiseLike<[T, unknown]>,
    ) {
    }

    public prop<K extends keyof T>(key: K): ChifirAsync<T[K]> {
        const stack = getStack(this.prop);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctx]) => {
                return new BrewGeneric(v, ctx, stack).prop(key);
            })
        ) as ChifirAsync<T[K]>;
    }

    public instanceOf<R>(ctor: Ctor<R>): ChifirAsync<R> {
        const stack = getStack(this.instanceOf);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctx]) => {
                return [
                    new BrewGeneric(v, ctx, stack).instanceOf(ctor),
                    ctx,
                ];
            })
        ) as ChifirAsync<R>;
    }

    public typeOf<K extends keyof TypeOfHelper>(expected: K): ChifirAsync<TypeOfHelper[K]> {
        const stack = getStack(this.typeOf);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctx]) => {
                return [
                    new BrewGeneric(v, ctx, stack).typeOf(expected),
                    ctx,
                ];
            })
        ) as ChifirAsync<TypeOfHelper[K]>;
    }

    public get resolves(): PromiseLike<Chifir<T>> {
        const stack = getStack(Object.getOwnPropertyDescriptor(ChifirAsyncImpl.prototype, 'resolves')?.get as Function);
        return this.then(c => c, (reason) => {
            throw makeAsyncError(reason, 'Expected to resolve', stack);
        });
    }

    public rejects(cleanUp?: (value: T) => void): ChifirAsync<unknown> {
        const stack = getStack(this.rejects);
        return new ChifirAsyncImpl(this.pvalue.then(([value, _]) => {
            if (cleanUp) {
                cleanUp(value);
            }
            throw makeAsyncError(undefined, 'Expected to reject', stack);
        }, (reason) => {
            return [reason, undefined];
        })) as ChifirAsync<unknown>;
    }

    public then<TResult1 = Chifir<T>, TResult2 = never>(
        onfulfilled?: ((value: Chifir<T>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        return this.pvalue.then(([value, ctx]) => {
            if (onfulfilled) {
                return onfulfilled(new ChifirImpl(value, ctx) as Chifir<T>);
            }
            return new ChifirImpl(value, ctx) as TResult1;
        }, onrejected);
    }
}

setupChifir(ChifirAsyncImpl.prototype, (key) => {
    return function(this: ChifirAsyncImpl<unknown>) {
        const stack = getStack(Object.getOwnPropertyDescriptor(ChifirAsyncImpl.prototype, key)?.get as Function);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctx]) =>{
                const brew = new BrewGet(v, ctx, stack);
                return [brew[key], ctx];
            })
        );
    };
}, (key) => {
    return function(this: ChifirAsyncImpl<unknown>, ...args: unknown[]) {
        const stack = getStack(Object.getOwnPropertyDescriptor(ChifirImpl.prototype, key)?.value as Function);
        return new ChifirAsyncImpl(
            this.pvalue.then(([v, ctx]) => {
                const brew = new BrewCall(v, ctx, stack);
                return [
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    brew[key](...args),
                    ctx,
                ];
            })
        );
    };
});

type ChifirAsync<T> = ChifirAsyncFromBrew<T> & ChifirAsyncImpl<T>;

export function expectAsync<T>(pvalue: PromiseLike<T>): ChifirAsync<T> {
    return new ChifirAsyncImpl(pvalue.then(v => [v, undefined])) as unknown as ChifirAsync<T>;
}
