import { AssertionError } from 'assert';
import { expect } from '../src';

function expectFail(expectWrapper: () => void): ReturnType<typeof expect<AssertionError>> {
    return expect(expectWrapper).throws()
        .instanceOf(AssertionError);
}

describe('expect()', () => {
    const TEST_OBJECT = [ { a : 13 }, 'test' ];
    const TEST_OBJECT_COPY = [ { a : 13 }, 'test' ];
    const TEST_OBJECT_WRONG = [ { a : 14 }, 'test' ];
    
    describe('.exist', () => {
        it('should pass if the value is neither null nor undefined', () => {
            expect({}).exist;
        });

        it('should fail if the value is null', () => {
            expectFail(() => expect(null).exist);
        });

        it('should fail if the value is undefined', () => {
            expectFail(() => expect(undefined).exist);
        });
    });

    describe('.eq()', () => {
        it('should pass on equal primitives', () => {
            expect(13).eq(13);
        });

        it('should pass on strictly deep equal objects', () => {
            expect(TEST_OBJECT).eq(TEST_OBJECT_COPY);
        });

        it('should fail on unequal primitives', () => {
            expectFail(() => expect(13).eq(14));
        });

        it('should fail on strictly deep unequal objects', () => {
            expectFail(() => expect(TEST_OBJECT).eq(TEST_OBJECT_WRONG));
        });
    });

    describe('.ne()', () => {
        it('should pass on unequal primitives', () => {
            expect(13).ne(14);
        });

        it('should pass on strictly deep unequal objects', () => {
            expect(TEST_OBJECT).ne(TEST_OBJECT_WRONG);
        });

        it('should fail on equal primitives', () => {
            expectFail(() => expect(13).ne(13));
        });

        it('should fail on strictly deep equal objects', () => {
            expectFail(() => expect(TEST_OBJECT).ne(TEST_OBJECT_COPY));
        });
    });

    describe('.sameAs()', () => {
        it('should pass on equal primitives', () => {
            expect(13).sameAs(13);
        });

        it('should pass on the same object', () => {
            expect(TEST_OBJECT).sameAs(TEST_OBJECT);
        });

        it('should fail on unequal primitives', () => {
            expectFail(() => expect(13).sameAs(14));
        });

        it('should fail on strictly deep equal objects', () => {
            expectFail(() => expect(TEST_OBJECT).sameAs(TEST_OBJECT_COPY));
        });

        it('should fail on strictly deep unequal objects', () => {
            expectFail(() => expect(TEST_OBJECT).sameAs(TEST_OBJECT_WRONG));
        });
    });

    describe('.lt()', () => {
        it('should pass if "actual < expected"', () => {
            expect(13).lt(14);
        });

        it('should fail if "actual = expected"', () => {
            expectFail(() => expect(13).lt(13));
        });

        it('should fail if "actual > expected"', () => {
            expectFail(() => expect(13).lt(12));
        });
    });

    describe('.gt()', () => {
        it('should pass if "actual < expected"', () => {
            expect(13).gt(12);
        });

        it('should fail if "actual = expected"', () => {
            expectFail(() => expect(13).gt(13));
        });

        it('should fail if "actual > expected"', () => {
            expectFail(() => expect(13).gt(14));
        });
    });

    describe('.le()', () => {
        it('should pass if "actual < expected"', () => {
            expect(13).le(14);
        });

        it('should pass if "actual = expected"', () => {
            expect(13).le(13);
        });

        it('should fail if "actual > expected"', () => {
            expectFail(() => expect(13).le(12));
        });
    });

    describe('.ge()', () => {
        it('should pass if "actual < expected"', () => {
            expect(13).ge(12);
        });

        it('should pass if "actual = expected"', () => {
            expect(13).ge(13);
        });

        it('should fail if "actual > expected"', () => {
            expectFail(() => expect(13).ge(14));
        });
    });

    describe('match()', () => {
        it('should pass if the value matches regexp', () => {
            expect('abracadabra').match(/(ab|ac|ad)/);
        });

        it('should fail if the value does not match regexp', () => {
            expectFail(() => expect('abracadabra').match(/abc/));
        });

        it('should fail if the value is not a string', () => {
            expectFail(() => expect(12345).match(/123/));
        });
    });

    describe('.throws()', () => {
        it('should pass if the value throws', () => {
            function testThrow(): never {
                throw new Error('test error');
            }
            expect(testThrow).throws();
        });

        it('should provide arguments', () => {
            function testThrowArgs(msg: string, code: number): never {
                throw new Error(`${msg} ${code}`);
            }
            expect(testThrowArgs).throws('fail', 13)
                .instanceOf(Error)
                .prop('message')
                .eq('fail 13');
        });

        it('should catch non-Error value', () => {
            function testThrowNonError(): never {
                throw 'fail';
            }
            expect(testThrowNonError).throws()
                .eq('fail');
        });

        it('should fail if the value does not throw', () => {
            function testNoThrow(): string {
                return 'ok';
            }
            expectFail(() => expect(testNoThrow).throws());
        });

        it('should fail if the value is not callable', () => {
            expectFail(() => expect({}).throws())
                .prop('message').eq('Expected to be callable');
        });
    });

    describe('.propThrows()', () => {
        class Test {
            public get bad(): string {
                throw new Error('bad');
            }
            public get good(): string {
                return 'ok';
            }
        }

        it('should pass if the property throws', () => {
            expect(new Test()).propThrows('bad');
        });

        it('should catch thrown value', () => {
            expect(new Test()).propThrows('bad')
                .instanceOf(Error).prop('message').eq('bad');
        });

        it('should fail if the property does not throw', () => {
            expectFail(() => expect(new Test()).propThrows('good'));
        });
    });

    describe('.prop()', () => {
        it('should return Chifir for the provided property', () => {
            expect({ a: 13 }).prop('a').eq(13);
        });

        it('should return Chifir for undefined property', () => {
            expect({ a: undefined }).prop('a').eq(undefined);
        });

        it('should fail if the property was not set', () => {
            expectFail(() => expect({} as { a: unknown }).prop('a'));
        });

        it('should fail if the value is not an object', () => {
            expectFail(() => expect('test' as unknown as { a: unknown }).prop('a'));
        });
    });

    describe('.context()', () => {
        it('should return Chifir for the context of the value', () => {
            class Test {
                constructor(
                    public foo: string,
                ) {}
            }
            expect(new Test('bar')).prop('foo')
                .context()
                .instanceOf(Test);
        });

        it('should fail if the value has no context', () => {
            expectFail(() => expect('no context').context())
                .prop('message').eq('The value has no context');
        });
    });

    describe('.instanceOf()', () => {
        class Test {}

        it('should pass if the value is an instance of the provided ctor', () => {
            expect(new Test()).instanceOf(Test);
        });

        it('should fail if the value is not an instance of the provided ctor', () => {
            expectFail(() => expect({}).instanceOf(Test));
        });
    });

    describe('.typeOf()', () => {
        it('should pass if the value is of the provided type', () => {
            expect(13).typeOf('number');
        });

        it('should pass if the value is of a different type', () => {
            expectFail(() => expect(13).typeOf('string'));
        });
    });
});
