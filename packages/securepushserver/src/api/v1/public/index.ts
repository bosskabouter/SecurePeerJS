import express from 'express'
import type { IConfig } from '../../../config'

/* eslint-disable @typescript-eslint/dot-notation */
import * as webpush from 'web-push'
import dotenv from 'dotenv'
import { env } from 'process'
import { type SecureCommunicationKey, type SymmetricallyEncryptedMessage } from 'secure-communication-kit'
import { type WebPushRequest } from 'securepushjs'
dotenv.config()
const HTTP_ERROR_PUSH_TOO_BIG = 507
const HTTP_ERROR_PUSH_SERVICE_ERROR_BAD_GATEWAY = 502

const PUSH_MAX_BYTES = 4 * 1024

const VAPID_SUBJECT = env['VAPID_SUBJECT'] ?? 'mailto:push@volatalk.org'

// WEB-PUSH VAPID KEYS; `npm run vapid`
const VAPID_PUBKEY = process.env['VAPID_PUBKEY'] ??
'BChZg2Ky1uKIDRdYWapWKZXZ19VvFedmK0bjqir9kMsyUK42cguvoAr4Pau4yQr2aY4IWGIsr3W1lWK5okZ6O84'

const VAPID_PRIVATEKEY =
env['VAPID_PRIVATEKEY'] ?? 'CvQGYBs-AzSHF55J7mqTR8VE7l-qwiBiSslqeaMfx8o'
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBKEY, VAPID_PRIVATEKEY)

export default ({
  config
}: {
  config: IConfig
}): express.Router => {
  const app = express.Router()
  app.post('/send', (request, response) => {
    let body: WebPushRequest
    const key = config.secureKey
    if (key === null) {
      console.warn('No key')
      return
    }
    try {
      body = (request.body) as WebPushRequest
    } catch (error) {
      console.warn('Error parsing WebPushRequest', request.body, error)
      return
    } // receiver's subscription is unknown to sender
    let subscription: webpush.PushSubscription | undefined
    try {
      subscription = extractPushSubscription(body.encryptedPushSubscription, key)
    } catch (error) {
      console.warn('Error ', error)
      return
    }

    if (subscription == null) {
      console.warn('No subscription found in encoded relay endpoint')
      return
    }
    const payload: string = body.encryptedPayload

    const payloadByteSize = Buffer.from(payload).length

    if (payloadByteSize >= PUSH_MAX_BYTES) {
      console.warn(`Message too big. Refusing push. ${payloadByteSize}kb`
      )
      response.sendStatus(HTTP_ERROR_PUSH_TOO_BIG)
      return
    }

    console.info(webpush.sendNotification)
    void send(subscription, payload, response)
  })

  // Blob needed to measure request size
  // const { Blob } = require("buffer");
  app.get('/test', (_request, response) => {
    // response.statusCode = HTTP_ERROR_PUSH_SERVICE_ERROR_Bad_Gateway;
    response.send('<FORM method=\'POST\' action=`/send` ><INPUT TYPE=\'SUBMIT\' value=\'Post Test Push!\'/></FORM>')
    // response.send("ok")
  })

  return app
}

async function send (subscription: any, payload: any, response: any): Promise<void> {
  try {
    const result = await webpush
      .sendNotification(subscription, payload, { TTL: 1000 * 60 })

    response.send(JSON.stringify(result))
  } catch (error) {
    console.error('Problem pushing', error)
    response.statusCode = HTTP_ERROR_PUSH_SERVICE_ERROR_BAD_GATEWAY
    response.send(JSON.stringify(error))
  }
}
function extractPushSubscription (encryptedEndpoint: SymmetricallyEncryptedMessage, key: SecureCommunicationKey): webpush.PushSubscription | undefined {
  const endpoint = key.decryptFromRelay(encryptedEndpoint)
  return JSON.parse(endpoint)
}
