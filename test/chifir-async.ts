import { AssertionError } from 'assert';
import { setImmediate } from 'timers/promises';
import { expect, expectAsync } from '../src';

type ChifirAsync<T> = ReturnType<typeof expectAsync<T>>;

function expectFail(res: PromiseLike<unknown>): ChifirAsync<AssertionError> {
    return expectAsync(res).rejects()
        .instanceOf(AssertionError);
}

async function toAsync<T>(v: T): Promise<T> {
    await setImmediate();
    return v;
}

describe('expectAsync', () => {
    describe('.prop()', () => {
        it('should return ChifirAsync for the provided property', async () => {
            await expectAsync(toAsync({ a: 13 })).prop('a').eq(13);
        });
    });

    describe('.instanceOf()', () => {
        class Test {}
        it('should pass if the value is an instance of the provided ctor', async () => {
            await expectAsync(toAsync(new Test())).instanceOf(Test);
        });
    });

    describe('.typeOf()', () => {
        it('should pass if the value is of the provided type', async () => {
            await expectAsync(toAsync(13)).typeOf('number');
        });
    });

    async function testRejects(): Promise<never> {
        await setImmediate();
        throw new Error('fail');
    }

    describe('.resolves', () => {
        it('should pass if the value resolves', async () => {
            const ch = await expectAsync(toAsync(13)).resolves;
            ch.eq(13);
        });

        it('should fail if the value rejects', async () => {
            await expectFail(expectAsync(testRejects()).resolves)
                .prop('message').eq('Expected to resolve');
        });
    });

    describe('.rejects()', () => {
        it('should pass if the value rejects', async () => {
            await expectAsync(testRejects()).rejects();
        });

        it('should catch rejection reason', async () => {
            await expectAsync(testRejects()).rejects()
                .instanceOf(Error).prop('message').eq('fail');
        });

        it('should fail if the value resolves', async () => {
            await expectFail(expectAsync(toAsync(13)).rejects())
                .prop('message').eq('Expected to reject');
        });

        it('should cleanup resolved value on failure', async () => {
            const awaited = {
                clean: false,
            };
            async function testResolves(): Promise<typeof awaited> {
                await setImmediate();
                return awaited;
            }
            await expectFail(expectAsync(testResolves()).rejects(v => v.clean = true));
            expect(awaited.clean).eq(true);
        });
    });

    describe('.exist', () => {
        it('should pass if the value is not null nor undefined', async () => {
            await expectAsync(toAsync({})).exist;
        });

        it('should fail if the value is null', async () => {
            await expectFail(expectAsync(toAsync(null)).exist);
        });
    });

    describe('.then()', () => {
        it('should resolve to Chifir', async () => {
            const ch = await expectAsync(toAsync(13)).then();
            ch.eq(13);
        });
    });
});
