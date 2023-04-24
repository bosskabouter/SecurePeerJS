import cors, { type CorsOptions } from 'cors'
import express from 'express'
import PublicApi from './v1/public'
import type { IConfig } from '../config'
import type * as webpush from 'web-push'
import * as publicContent from '../../app.json'
import { type SecureCommunicationKey } from 'secure-communication-kit'

export const Api = ({
  vapid,
  key,
  config,
  corsOptions
}: {
  vapid: {
    keys: webpush.VapidKeys
    subject: string }
  key: SecureCommunicationKey
  config: IConfig
  corsOptions: CorsOptions
}): express.Router => {
  const app = express.Router()
  app.use(cors(corsOptions))

  app.get('/', (_, res) => {
    res.send(publicContent)
  })

  app.use('/', PublicApi({ vapid, key, config }))

  return app
}
