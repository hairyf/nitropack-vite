# nitropack-vite

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
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
import Nitro from 'nitropack-vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Nitro()
  ]
})
```

- `nitro.config.ts`

```ts
export default defineNitroConfig({
  // NitroPack options
  plugins: [
    'node_modules/nitropack-vite/nitro.ts'
  ]
})
```

- `package.json`

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "nitro dev",
    "prepare": "nitro prepare",
    "preview": "node .output/server/index.mjs"
  }
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
