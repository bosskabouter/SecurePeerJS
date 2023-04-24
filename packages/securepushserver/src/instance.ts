import express from 'express'

import type * as webpush from 'web-push'
import { type IConfig } from './config'

import { Api } from './api'
import { type SecureCommunicationKey } from '.'

export const createInstance = ({
  vapid,
  key,
  app,
  options
}: { vapid: {
  keys: webpush.VapidKeys
  subject: string }
key: SecureCommunicationKey
app: express.Application
options: IConfig
}): void => {
  const config: IConfig = { ...options }
  const api = Api({ vapid, key, config, corsOptions: options.corsOptions })
  app.use(express.json())
  app.use(options.path, api)
  /**
   * The destination endpoint, encrypted for the server by its owner.
   * @param encryptedEndpoint
   * @returns
   */

  app.emit('started', {})
}
