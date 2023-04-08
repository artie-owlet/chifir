import { BrewGet, BrewCall, BrewGeneric, setupChifir, Ctor, TypeOfHelper } from './brew';

type ChifirFromBrew<T> = {
    [K in keyof BrewGet<T>]: Chifir<BrewGet<T>[K]>
} & {
    [K in keyof BrewCall<T>]: (...args: Parameters<BrewCall<T>[K]>) => Chifir<ReturnType<BrewCall<T>[K]>>;
};

export class ChifirImpl<T> {
    constructor(
        public readonly value: T,
        public readonly ctx: unknown,
    ) {
    }

    public prop<K extends keyof T>(key: K): Chifir<T[K]> {
        return new ChifirImpl(
            ...(new BrewGeneric(this.value, this.ctx, this.prop).prop(key))
        ) as Chifir<T[K]>;
    }

    public instanceOf<R>(ctor: Ctor<R>): Chifir<R> {
        return new ChifirImpl(
            new BrewGeneric(this.value, this.ctx, this.instanceOf).instanceOf(ctor),
            this.ctx,
        ) as Chifir<R>;
    }

    public typeOf<K extends keyof TypeOfHelper>(expected: K): Chifir<TypeOfHelper[K]> {
        return new ChifirImpl(
            new BrewGeneric(this.value, this.ctx, this.prop).typeOf(expected),
            this.ctx,
        ) as Chifir<TypeOfHelper[K]>;
    }
}

setupChifir(ChifirImpl.prototype, (key) => {
    return function(this: ChifirImpl<unknown>) {
        const brew = new BrewGet(this.value, this.ctx,
            Object.getOwnPropertyDescriptor(ChifirImpl.prototype, key)?.get as Function);
        return new ChifirImpl(brew[key], this.ctx);
    };
}, (key) => {
    return function(this: ChifirImpl<unknown>, ...args: unknown[]) {
        const brew = new BrewCall(this.value, this.ctx,
            Object.getOwnPropertyDescriptor(ChifirImpl.prototype, key)?.value as Function);
        return new ChifirImpl(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            brew[key](...args),
            this.ctx,
        );
    };
});

export type Chifir<T> = ChifirFromBrew<T> & ChifirImpl<T>;

export function expect<T>(value: T): Chifir<T> {
    return new ChifirImpl(value, undefined) as unknown as Chifir<T>;
}
