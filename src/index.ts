import type { PromiseType } from '@hairy/utils'
import type { Nitro, NitroDevServer } from 'nitropack'
import type { PresetNameInput } from 'nitropack/presets'
import type { UnimportPluginOptions } from 'unimport/unplugin'
import type { PluginOption } from 'vite'
import fs from 'node:fs/promises'
import process from 'node:process'
import { isArray } from '@hairy/utils'
import { consola } from 'consola'
import { toNodeListener } from 'h3'
import { build, copyPublicAssets, createDevServer, createNitro as createNitroInstance, prepare, prerender, scanHandlers } from 'nitropack'
import Unimport from 'unimport/unplugin'
import { getMagicString } from 'unimport'

export interface NitroOptions {
  /**
   * The source directory for the application.
   *
   * @default './src'
   */
  srcDir?: string
  /**
   * Additional automatic imports will take effect on the all page and server - https://github.com/unjs/unimport
   */
  imports?: UnimportPluginOptions | false
  /**
   * Is it compressed during construction
   *
   * @default false
   */
  minify?: boolean
  preset?: PresetNameInput
  compatibilityDate?: string
}
const hmrKeyRep = /^runtimeConfig\.|routeRules\./

export default async function Nitro(options: NitroOptions = {}): Promise<PluginOption[]> {
  let handlers: PromiseType<ReturnType<typeof scanHandlers>> = []
  let server: NitroDevServer | undefined
  let nitro: Nitro

  async function reloadNitro(): Promise<Nitro> {
    if (nitro) {
      consola.info('Restarting dev server...')
      if ('unwatch' in nitro.options._c12) {
        await nitro.options._c12.unwatch()
      }
      await nitro.close()
    }
    nitro = await createNitroInstance(
      {
        srcDir: options.srcDir || './src',
        dev: true,
        preset: 'nitro-dev',
        _cli: { command: 'dev' },
      },
      {
        watch: true,
        c12: {
          async onUpdate({ getDiff, newConfig }) {
            const diff = getDiff()
            if (diff.length === 0) {
              return
            }
            consola.info(`Nitro config updated:\n${diff.map(entry => `  ${entry.toString()}`).join('\n')}`)
            await (diff.every(e => hmrKeyRep.test(e.key)) ? nitro.updateConfig(newConfig.config || {}) : reloadNitro())
          },
        },
      },
    )

    // @ts-expect-error
    nitro.hooks.hookOnce('restart', reloadNitro)
    server = createDevServer(nitro)
    handlers = await scanHandlers(nitro)
    await prepare(nitro)
    await build(nitro)
    return nitro
  }

  async function createNitro(): Promise<Nitro> {
    const nitro = await createNitroInstance(
      {
        srcDir: options.srcDir || './src',
        dev: false,
        minify: options.minify,
        preset: options.preset,
        publicAssets: [
          {
            dir: `${process.cwd()}/.nitro/static`,
            baseURL: '/',
          },
        ],
      },
      {
        // @ts-expect-error
        compatibilityDate: options.compatibilityDate,
      },
    )
    return nitro
  }
  let loadedFetchID: string | undefined

  const plugins: PluginOption[] = [
    {
      name: 'nitro-plugin',
      config(config) {
        config.server ??= {}
        config.server.watch ??= {}
        config.server.watch.ignored ??= []
        config.server.watch.ignored = isArray(config.server.watch.ignored)
          ? [...config.server.watch.ignored, /\.nitro\/types\/tsconfig.json/]
          : [config.server.watch.ignored, /\.nitro\/types\/tsconfig.json/].filter(Boolean)

        config.build ??= {}
        config.build.outDir = './.nitro/static'
      },
      async configResolved() {
        nitro = process.env.NODE_ENV === 'development'
          ? await reloadNitro()
          : await createNitro()
      },
      async configureServer(viteServer) {
        viteServer.middlewares.use(async (req, res, next) => {
          const url = req.originalUrl || req.url || ''
          const listener = server ? toNodeListener(server.app) : undefined

          const isNitroRoute = handlers.map(h => h.route).some((route) => {
            if (route.includes(':')) {
              const routePattern = route.replace(/:[^/]+/g, '[^/]+')
              const regex = new RegExp(`^${routePattern}(?:/.*)?$`)
              return regex.test(url)
            }
            else {
              return url.startsWith(route)
            }
          })

          if (isNitroRoute) {
            listener?.(req, res)
            return
          }

          next()
        })
      },
      async buildEnd() {
        await prepare(nitro)
        await copyPublicAssets(nitro)
        await prerender(nitro)
        await build(nitro)
        await nitro.close()
        await fs.mkdir('.output/server/node_modules/vite/misc', { recursive: true })
        await fs.writeFile('.output/server/node_modules/vite/misc/true.js', 'export default true')
      },
      resolveId(source) {
        if (source === 'virtual:$fetch')
          return '\0virtual:$fetch'
      },
      load(id) {
        if (id === '\0virtual:$fetch')
          return `import { createFetch } from 'ofetch';window.$fetch = createFetch({})`
      },
      transform(code, id) {
        if (id.includes('.html') || id.includes('.vite/deps'))
          return

        if (loadedFetchID && loadedFetchID !== id)
          return

        // main entry
        loadedFetchID = id

        const s = getMagicString(code)
        s.prepend(`import 'virtual:$fetch';\n`)
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true }),
        }
      },
    },
    options.imports && Unimport.vite(options.imports),
  ]

  return plugins
}
