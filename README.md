# Env

Structured way to fetch environment variables

## Installation

```sh
npm install --save @atsjj/env
```

## Usage

```typescript
import { NodeEnv } from '@atsjj/env';

export const env = new NodeEnv({
  prefix: 'some',
  namespace: 'project',
  target: 'development'
});

env.optional('url', 'http://some.tld/');
```
