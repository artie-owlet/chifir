# chifir

![CI](https://github.com/artie-owlet/chifir/actions/workflows/ci.yaml/badge.svg)
![Coverage](https://github.com/artie-owlet/chifir/actions/workflows/coverage.yaml/badge.svg)
![Lint](https://github.com/artie-owlet/chifir/actions/workflows/lint.yaml/badge.svg)

Assertion library for Node.js.

---

## Install

```bash
yarn add -D @artie-owlet/chifir
```

or

```bash
npm install -D @artie-owlet/chifir
```

## Usage

```ts
import { expect } from '@artie-owlet/chifir';

import { testMe, Result } from '../src/api';
import { probablyFail } from '../src/async-api';

describe('Test', () => {
    it('should return Result with foo = bar', () => {
        expect(testMe()).exist
            .instanceOf(Result)
            .prop('foo')
            .eq('bar');
    });

    it('should eventually fail', async () => {
        await expectAsync(probablyFail()).rejects(res => res.clear())
            .instanceOf(Error)
            .prop('message').eq('fail');
    });
})
```

## API

See https://artie-owlet.github.io/chifir/
