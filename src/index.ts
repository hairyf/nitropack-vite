import type { Plugin } from 'vite'
import fs from 'node:fs/promises'
import process from 'node:process'
import { build, copyPublicAssets, createNitro, prepare, prerender } from 'nitropack'

export default function Nitro(): Plugin {
  return {
    name: 'vite-plugin-nitro',
    buildEnd: async () => {
      const nitro = await createNitro({
        rootDir: process.cwd(),
        dev: false,
        publicAssets: [
          {
            dir: `${process.cwd()}/.nitro/static`,
            baseURL: '/',
          },
        ],
      })
      await prepare(nitro)
      await copyPublicAssets(nitro)
      await prerender(nitro)
      await build(nitro)
      await nitro.close()
      await fs.mkdir('.output/server/node_modules/vite/misc', { recursive: true })
      await fs.writeFile('.output/server/node_modules/vite/misc/true.js', 'export default true')
    },
    config(config) {
      config.build ??= {}
      config.build.outDir = './.nitro/static'
    },
  }
}
