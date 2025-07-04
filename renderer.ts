// @ts-nocheck
import { readAsset } from '#nitro-internal-virtual/public-assets'
import { defineEventHandler } from 'h3'
import { defineNitroPlugin } from 'nitropack/dist/runtime/internal/plugin'

export default defineNitroPlugin((nitro) => {
  const handler = defineEventHandler(() => readAsset('/index.html'))
  nitro.router.use('/**', handler)
})
