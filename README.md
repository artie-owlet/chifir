# chifir

[![build](https://github.com/artie-owlet/chifir/actions/workflows/build.yaml/badge.svg)](https://github.com/artie-owlet/chifir/actions/workflows/build.yaml)
[![test](https://github.com/artie-owlet/chifir/actions/workflows/test.yaml/badge.svg)](https://github.com/artie-owlet/chifir/actions/workflows/test.yaml)
[![lint](https://github.com/artie-owlet/chifir/actions/workflows/lint.yaml/badge.svg)](https://github.com/artie-owlet/chifir/actions/workflows/lint.yaml)
[![NPM version](https://img.shields.io/npm/v/@artie-owlet/chifir?color=33cd56&logo=npm)](https://www.npmjs.com/package/@artie-owlet/chifir)

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
