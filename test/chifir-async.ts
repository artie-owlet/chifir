import { AssertionError } from 'assert';
import { setImmediate } from 'timers/promises';
import { expect } from '../src';

function expectFail(res: PromiseLike<void>) {
    return expect(res).eventually.rejects()
        .instanceOf(AssertionError);
}

async function toAsync<T>(v: T): Promise<T> {
    await setImmediate();
    return v;
}

describe('expect().eventually', () => {
    it('should fail if the value is not PromiseLike', () => {
        function probablyAsync(v: number, isAsync: boolean) {
            return isAsync ? toAsync(v) : v;
        }
        expect(() => expect(probablyAsync(13, false)).eventually.eq(13)).throws()
            .instanceOf(AssertionError);
    });

    describe('.prop()', () => {
        it('should return ChifirAsync for the provided property', async () => {
            await expect(toAsync({ a: 13 })).eventually.prop('a').eq(13);
        });
    });

    describe('.context()', () => {
        it('should return ChifirAsync for the context of the value', async () => {
            class Test {
                constructor(
                    public foo: string,
                ) {}
            }
            await expect(toAsync(new Test('bar'))).eventually.prop('foo')
                .context()
                .instanceOf(Test);
        });
    });

    describe('.instanceOf()', () => {
        class Test {}
        it('should pass if the value is an instance of the provided ctor', async () => {
            await expect(toAsync(new Test())).eventually.instanceOf(Test);
        });
    });

    describe('.typeOf()', () => {
        it('should pass if the value is of the provided type', async () => {
            await expect(toAsync(13)).eventually.typeOf('number');
        });
    });

    async function testRejects(): Promise<never> {
        await setImmediate();
        throw new Error('fail');
    }

    describe('.rejects()', () => {
        it('should pass if the value rejects', async () => {
            await expect(testRejects()).eventually.rejects();
        });

        it('should catch rejection reason', async () => {
            await expect(testRejects()).eventually.rejects()
                .instanceOf(Error).prop('message').eq('fail');
        });

        it('should fail if the value resolves', async () => {
            await expectFail(expect(toAsync(13)).eventually.rejects());
        });

        it('should cleanup resolved value on failure', async () => {
            const awaited = {
                clean: false,
            };
            async function testResolves(): Promise<typeof awaited> {
                await setImmediate();
                return awaited;
            }
            await expectFail(expect(testResolves()).eventually.rejects(v => v.clean = true));
            expect(awaited.clean).eq(true);
        });
    });

    describe('.exist', () => {
        it('should pass if the value is neither null nor undefined', async () => {
            await expect(toAsync({})).eventually.exist;
        });

        it('should fail if the value is null', async () => {
            await expectFail(expect(toAsync(null)).eventually.exist);
        });
    });

    describe('.value', () => {
        it('should return the fulfilled value', async () => {
            const value = await expect(toAsync(13)).eventually.value;
            expect(value).eq(13);
        });
    });
});
