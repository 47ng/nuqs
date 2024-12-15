#!/usr/bin/env node
// @ts-check

import { createRequestHandler } from '@react-router/express'
import compression from 'compression'
import express from 'express'
import os from 'node:os'
import path from 'node:path'
import url from 'node:url'

process.env.NODE_ENV = process.env.NODE_ENV ?? 'production'

run()

async function run() {
  const port = 3007
  const buildPath = path.resolve('build/server/index.js')

  /** @type {import('react-router').ServerBuild } */
  const build = await import(url.pathToFileURL(buildPath).href)

  const onListen = () => {
    const address =
      process.env.HOST ||
      Object.values(os.networkInterfaces())
        .flat()
        .find(ip => String(ip?.family).includes('4') && !ip?.internal)?.address

    if (!address) {
      console.log(`[react-router-v7] http://localhost:${port}`)
    } else {
      console.log(
        `[react-router-v7] http://localhost:${port} (http://${address}:${port})`
      )
    }
  }

  const app = express()
  app.disable('x-powered-by')
  app.use(compression())
  app.use(
    path.posix.join(build.publicPath, 'assets'),
    express.static(path.join(build.assetsBuildDirectory, 'assets'), {
      immutable: true,
      maxAge: '1y'
    })
  )
  app.use(build.publicPath, express.static(build.assetsBuildDirectory))
  app.use(express.static('public', { maxAge: '1h' }))

  app.all(
    '*',
    createRequestHandler({
      build,
      mode: process.env.NODE_ENV
    })
  )

  const server = process.env.HOST
    ? app.listen(port, process.env.HOST, onListen)
    : app.listen(port, onListen)

  ;['SIGTERM', 'SIGINT'].forEach(signal => {
    process.once(signal, () => server?.close(console.error))
  })
}
