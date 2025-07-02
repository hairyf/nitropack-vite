import type { GlobOptionsWithFileTypesUnset } from 'glob'
import fs from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import process from 'node:process'
import { glob } from 'glob'
import { defineEventHandler, fromNodeMiddleware } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

const NitroReactPlugin = defineNitroPlugin(async (nitroApp) => {
  if (process.env.NITRO_DEV_WORKER_ID) {
    const createViteServer = await import('vite').then(m => m.createServer)
    const vite = await createViteServer({ server: { middlewareMode: true } })
    nitroApp.router.add('/**', fromNodeMiddleware(vite.middlewares))
    return
  }

  const staticFiles = await readFiles('.output/public', { ignore: ['index.html'] })
  const indexesHtml = await fs.readFile(resolve('.output/public/index.html'), 'utf-8')

  nitroApp.router.add('/**', defineEventHandler((event) => {
    const url = event.node.req.url || '/'
    if (staticFiles.includes(url))
      return
    if (extname(url)) {
      event.node.res.statusCode = 404
      return
    }
    return indexesHtml
  }))
})

async function readFiles(directory: string, options?: GlobOptionsWithFileTypesUnset): Promise<string[]> {
  return glob('**/*', { cwd: directory, nodir: true, ...options })
    .then(files => files.map(file => file.replace(/\\/g, '/')).map(file => `/${file}`))
}

export default NitroReactPlugin
