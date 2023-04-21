import express, { type Express } from 'express'
import http from 'node:http'
import https from 'node:https'

import { createInstance } from './instance'
import type { IConfig } from './config'
import defaultConfig from './config'
import { type SecureCommunicationKey } from 'secure-communication-kit'
export * from 'secure-communication-kit'
function createExpressPushServer (key: SecureCommunicationKey,
  server: https.Server | http.Server,
  options?: Partial<IConfig>
): Express {
  const app = express()

  const newOptions: IConfig = {
    ...defaultConfig,
    ...options,
    secureKey: key
  }

  if (newOptions.proxied !== undefined) {
    app.set(
      'trust proxy',
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      newOptions.proxied === 'false' ? false : !!newOptions.proxied
    )
  }

  app.on('mount', () => {
    if (server === undefined || server === null) {
      throw new Error(
        'Server is not passed to constructor - ' + "can't start PeerServer"
      )
    }

    createInstance({ key, app, options: newOptions })
  })

  return app as Express
}

function createPushServer (key: SecureCommunicationKey,
  options: Partial<IConfig> = {},
  callback?: (server: https.Server | http.Server) => void
): Express {
  const app = express()

  let newOptions: IConfig = {
    ...defaultConfig,
    ...options
  }

  const port = newOptions.port
  const host = newOptions.host

  let server: https.Server | http.Server

  const { ssl, ...restOptions } = newOptions
  if ((ssl != null) && (Object.keys(ssl).length > 0)) {
    server = https.createServer(ssl, app)

    newOptions = restOptions
  } else {
    server = http.createServer(app)
  }

  const securepush = createExpressPushServer(key, server, newOptions)
  app.use(securepush)

  server.listen(port, host, () => callback?.(server))

  return securepush
}

export { createExpressPushServer, createPushServer }
