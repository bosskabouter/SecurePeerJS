import cors, { type CorsOptions } from 'cors'
import express from 'express'
import PublicApi from './v1/public'
import type { IConfig } from '../config'

import * as publicContent from '../../app.json'

export const Api = ({
  config,
  corsOptions
}: {
  config: IConfig
  corsOptions: CorsOptions
}): express.Router => {
  const app = express.Router()
  app.use(cors(corsOptions))

  app.get('/', (_, res) => {
    res.send(publicContent)
  })

  app.use('/', PublicApi({ config }))

  return app
}
