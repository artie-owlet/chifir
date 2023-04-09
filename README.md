# chifir

[![build](https://github.com/artie-owlet/chifir/actions/workflows/build.yaml/badge.svg)](https://github.com/artie-owlet/chifir/actions/workflows/build.yaml)
[![test](https://github.com/artie-owlet/chifir/actions/workflows/test.yaml/badge.svg)](https://github.com/artie-owlet/chifir/actions/workflows/test.yaml)
[![lint](https://github.com/artie-owlet/chifir/actions/workflows/lint.yaml/badge.svg)](https://github.com/artie-owlet/chifir/actions/workflows/lint.yaml)
[![package-version](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/artie-owlet/efb3c17b62d57a444d7d6a505636ffa2/raw/chifir-package-version.json)](https://www.npmjs.com/package/@artie-owlet/chifir)

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