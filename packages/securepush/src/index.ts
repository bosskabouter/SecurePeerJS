/* eslint-disable @typescript-eslint/dot-notation */

import * as webpush from 'web-push'
import type { Express } from 'express'
import express from 'express'

import dotenv from 'dotenv'
import { env } from 'process'
import { type WebPushRequest, type SymmetricallyEncryptedMessage, type SecureCommunicationKey } from 'securepushjs'
dotenv.config()

const HTTP_ERROR_PUSH_TOO_BIG = 507
const HTTP_ERROR_PUSH_SERVICE_ERROR_BAD_GATEWAY = 502

const PUSH_MAX_BYTES = 4 * 1024

const VAPID_SUBJECT = env['VAPID_SUBJECT'] ?? 'mailto:push@volatalk.org'

// WEB-PUSH VAPID KEYS; `npm run vapid`
const VAPID_PUBKEY = process.env['VAPID_PUBKEY'] ??
'BChZg2Ky1uKIDRdYWapWKZXZ19VvFedmK0bjqir9kMsyUK42cguvoAr4Pau4yQr2aY4IWGIsr3W1lWK5okZ6O84'

const VAPID_PRIVATEKEY =
  env['VAPID_PRIVATEKEY'] ??
  'CvQGYBs-AzSHF55J7mqTR8VE7l-qwiBiSslqeaMfx8o'

export class SecurePush {
  constructor (app: Express, private readonly key: SecureCommunicationKey) {
    app.use(express.json())

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBKEY, VAPID_PRIVATEKEY)

    /**
     * Push request handler
     */
    app.post('/send', (request, response) => {
      let body: WebPushRequest
      try {
        console.debug('request.body', request.complete, request.body)

        body = (request.body) as WebPushRequest
      } catch (error) {
        console.warn('Error parsing WebPushRequest', request.body, error)
        return
      } // receiver's subscription is unknown to sender
      let subscription: webpush.PushSubscription | undefined
      try {
        subscription = this.extractPushSubscription(body.encryptedPushSubscription)
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

      console.debug(`Push request size: ${payloadByteSize}`)
      if (payloadByteSize >= PUSH_MAX_BYTES) {
        console.warn(
          `Message too big. Refusing push. ${payloadByteSize}kb`
        )
        response.sendStatus(HTTP_ERROR_PUSH_TOO_BIG)
        return
      }

      console.debug('payload, subscription', payload, subscription)
      try {
        webpush
          .sendNotification(subscription, payload)
          .then((sendResult) => {
            console.debug('Pushed message: result=>', sendResult)
            response.send(JSON.stringify(sendResult))
          })
          .catch((err) => {
            console.error('Problem pushing', err)
            response.statusCode = HTTP_ERROR_PUSH_SERVICE_ERROR_BAD_GATEWAY
            response.send(JSON.stringify(err))
          })
      } catch (error) {
        console.error('Problem pushing', error)
        response.statusCode = HTTP_ERROR_PUSH_SERVICE_ERROR_BAD_GATEWAY
        response.send(JSON.stringify(error))
      }
    })

    // Blob needed to measure request size
    // const { Blob } = require("buffer");
    app.get('/test', (_request, response) => {
      console.info('Push request GET received')
      // response.statusCode = HTTP_ERROR_PUSH_SERVICE_ERROR_Bad_Gateway;
      response.send('<FORM method=\'POST\'  ><INPUT TYPE=\'SUBMIT\' value=\'Post Test Push\'/></FORM>')
      // response.send("ok")
    })
  }

  /**
   * The destination endpoint, encrypted for the server by its owner.
   * @param encryptedEndpoint
   * @returns
   */
  extractPushSubscription (encryptedEndpoint: SymmetricallyEncryptedMessage): webpush.PushSubscription | undefined {
    const endpoint = this.key.decryptFromRelay(encryptedEndpoint)
    return JSON.parse(endpoint)
  }
}
