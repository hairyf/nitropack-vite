import type { Fn, PromiseType } from '@hairy/utils'
import type { LoadConfigOptions, Nitro, NitroDevServer } from 'nitropack'
import type { PresetNameInput } from 'nitropack/presets'
import type { UnimportPluginOptions } from 'unimport/unplugin'
import type { PluginOption } from 'vite'
import process from 'node:process'
import { isArray, whenever } from '@hairy/utils'
import { consola } from 'consola'
import { toNodeListener } from 'h3'
import type { NodeListener } from 'h3'
import { build, copyPublicAssets, createDevServer, createNitro as createNitroInstance, prepare, prerender, scanHandlers } from 'nitropack'
import Unimport from 'unimport/unplugin'
import { getMagicString } from 'unimport'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

  clientDist?: string
}
const hmrKeyRep = /^runtimeConfig\.|routeRules\./

async function generateRenderer(html: string): Promise<void> {
  const renderer = `import { defineEventHandler } from 'h3';
export default defineEventHandler(async (event) => {
  return \`${html}\`
})`
  await fs.writeFile(path.join(__dirname, '../', 'renderer.mjs'), renderer)
}
export default async function Nitro(options: NitroOptions = {}): Promise<PluginOption[]> {
  const srcDir = whenever(options.srcDir, path.resolve) || `${process.cwd()}/src`
  const outDir = whenever(options.clientDist, path.resolve) || `${process.cwd()}/dist`
  let loadedFetchID: string | undefined
  let handlers: PromiseType<ReturnType<typeof scanHandlers>> = []
  let listener: NodeListener | undefined
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
        srcDir,
        dev: true,
        preset: 'nitro-dev',
        _cli: { command: 'dev' },
      },
      {
        watch: true,
        c12: {
          async onUpdate({ getDiff, newConfig }) {
            const diff = getDiff()
            if (diff.length === 0)
              return
            consola.info(`Nitro config updated:\n${diff.map(entry => `  ${entry.toString()}`).join('\n')}`)
            await (diff.every(e => hmrKeyRep.test(e.key)) ? nitro.updateConfig(newConfig.config || {}) : reloadNitro())
          },
        },
      },
    )

    nitro.hooks.hookOnce('restart', reloadNitro as Fn)
    server = createDevServer(nitro)
    handlers = await scanHandlers(nitro)
    listener = toNodeListener(server.app)
    await prepare(nitro)
    await build(nitro)
    return nitro
  }

  async function createNitro(dist: string): Promise<Nitro> {
    await generateRenderer(await fs.readFile(path.join(dist, 'index.html'), 'utf-8'))

    const nitro = await createNitroInstance(
      {
        srcDir,
        dev: false,
        minify: options.minify,
        preset: options.preset,
        publicAssets: [
          {
            dir: path.relative(srcDir, dist),
            baseURL: '/',
          },
        ],
        renderer: `nitropack-vite/renderer`,
      },
      {
        compatibilityDate: options.compatibilityDate as LoadConfigOptions['compatibilityDate'],
      },
    )

    return nitro
  }

  function filter(url: string): boolean {
    return handlers.map(h => h.route).some((route) => {
      if (!route.includes(':'))
        return url.startsWith(route)
      const routePattern = route.replace(/:[^/]+/g, '[^/]+')
      const regex = new RegExp(`^${routePattern}(?:/.*)?$`)
      return regex.test(url)
    })
  }

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
        config.build.outDir ??= outDir
      },
      async configResolved() {
        if (process.env.NODE_ENV === 'development')
          await reloadNitro()
      },
      async configureServer(server) {
        server.middlewares.use(async (req, res, next) => filter(req.originalUrl || req.url || '')
          ? listener?.(req, res)
          : next())
      },
      async closeBundle() {
        nitro = await createNitro(outDir)
        await prepare(nitro)
        await copyPublicAssets(nitro)
        await prerender(nitro)
        await build(nitro)
        await nitro.close()
      },
      resolveId(source) {
        if (source === 'virtual:$fetch')
          return '\0virtual:$fetch'
      },
      load(id) {
        if (id === '\0virtual:$fetch')
          return `import { createFetch } from 'ofetch';globalThis.$fetch = createFetch({})`
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
