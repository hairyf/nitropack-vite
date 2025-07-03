# nitropack-vite

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

A Vite plugin that seamlessly integrates Nitro for server-side rendering, API routes, and full-stack development in a single unified framework.

## Features

- 🚀 **Zero Configuration** - No configuration required to integrate [Vite](https://github.com/vitejs/vite) and [Nitro](https://github.com/unjs/nitro)
- 🔄 **Hot Module Replacement** - Fast development with HMR for both client and server
- 🛠️ **API Routes** - Create server endpoints with [Nitro's powerful event handlers](https://nitro.build/guide/routing#event-handlers)
- 📄 **Unstorage** - [Nitro KV storage](https://nitro.build/guide/storage) adapts to various storage scenarios
- 🔍️ **Unimport** - Default support for [Unimport](https://github.com/unjs/unimport), applied to both client and server simultaneously
- 🌐 **Universal Fetch** - Use `$fetch` on both client and server
- 🔌 **Plugin System** - Extend functionality with [Vite](https://github.com/vitejs/vite) and [Nitro](https://github.com/unjs/nitro) plugins
- 📦 **Production Ready** - Suitable for any supplier, such as [Vercel](https://vercel.com), [Netlify](https://www.netlify.com), [Cloudflare Workers](https://workers.cloudflare.com), and more

## Install

```bash
pnpm add nitropack-vite -D
pnpm add ofetch -S
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

      // Additional automatic imports will take effect on the all page and server
      // see - https://github.com/unjs/unimport
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
  // Additional Nitro-specific configuration can be added here
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

And you can customize the $fetch instance:

```ts
// Customize $fetch with additional options
import type { $Fetch } from 'nitropack'
import { createFetch } from 'ofetch'
globalThis.$fetch = createFetch({
  baseURL: 'http://...',
  headers: { 'x-custom-header': 'value' },
  retry: 3
}) as $Fetch
```

## Deployment

The built application can be deployed to various platforms:

```bash
# Build for production
pnpm build

# Preview the production build
pnpm preview
```

## Vercel

You need to edit vercel.json and select nitro when selecting project deployment

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm build",
  "outputDirectory": ".output",
  "devCommand": "pnpm dev"
}
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
