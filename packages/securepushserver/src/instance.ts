import express from 'express'
import { type IConfig } from './config'

import { Api } from './api'
import { type SecureCommunicationKey } from '.'

export const createInstance = ({
  key,
  app,
  options
}: {
  key: SecureCommunicationKey
  app: express.Application
  options: IConfig
}): void => {
  const config: IConfig = { ...options, secureKey: key }
  const api = Api({ config, corsOptions: options.corsOptions })
  app.use(express.json())
  app.use(options.path, api)
  /**
   * The destination endpoint, encrypted for the server by its owner.
   * @param encryptedEndpoint
   * @returns
   */

  app.emit('started', {})
}
