# nitropack-vite

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

NitroPack Vite is a Vite plugin that integrates NitroPack for server-side rendering and static site generation.

## Install

```bash
pnpm add nitropack-vite -D
```

## Configure

- `vite.config.ts`

```ts
import React from '@vitejs/plugin-react'
import Nitro from 'nitropack-vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    React(),
    // Nitro Options
    Nitro({
      // The source directory for the application.
      // srcDir - default: './src'

      // Additional automatic imports will take effect on the all page and server - https://github.com/unjs/unimport
      // imports - default: null

      // Is it compressed during construction
      // minify - default: false
    })
  ]
})
```

- `nitro.config.ts`

```ts
// your nitro config
export default defineNitroConfig({
  // Do not use plugins with the same configuration here (srcDir, imports, minify)
})
```

- `package.json`

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "prepare": "nitro prepare",
    "preview": "node .output/server/index.mjs"
  }
}
```

## Usage

```sh
pnpm run dev
```

print:

```
VITE v7.0.0  ready in 1275 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
✔ Nitro Server built in 451ms
```

Add an API route, for example `src/routes/hello.ts`

```ts
export default defineEventHandler((event) => {
  return 'Hello World'
})
```

> nitropack-vite will automatically handle the relationship between routes and page routes without the need for additional configuration.

Visit http://localhost:5173/hello, and you will see the response "Hello World".

Use `$fetch` to make API requests on the page.

```tsx
// App.tsx
function App() {
  useEffect(() => {
    $fetch('/hello').then((response) => {
      console.log(response) // "Hello World"
    })
  }, [])
  return null
}
```

And you can custom $fetch instance:

```ts
// or you can custom $fetch
import type { $Fetch } from 'nitropack'
import { createFetch } from 'ofetch'
globalThis.$fetch = createFetch({ baseURL: 'http://...' }) as $Fetch
```

## License

[MIT](./LICENSE) License © [Hairyf](https://github.com/haityf)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nitropack-vite?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/nitropack-vite
[npm-downloads-src]: https://img.shields.io/npm/dm/nitropack-vite?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/nitropack-vite
[bundle-src]: https://img.shields.io/bundlephobia/minzip/nitropack-vite?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=nitropack-vite
[license-src]: https://img.shields.io/github/license/hairyf/nitropack-vite.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/hairyf/nitropack-vite/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/nitropack-vite
