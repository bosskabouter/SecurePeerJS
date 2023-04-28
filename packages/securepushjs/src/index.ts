import axios from 'axios'
import EventEmitter from 'eventemitter3'

import { SecureCommunicationKey, type AsymmetricallyEncryptedMessage, type EncryptedHandshake, type SymmetricallyEncryptedMessage } from 'secure-communication-kit'

export * from 'secure-communication-kit'
export * from './sw-init'
/**
 *A
 */
export interface WebPushRequest {
  encryptedPushMessages: AsymmetricallyEncryptedMessage<SecurePushMessage[]>
  handshake: EncryptedHandshake
  senderId: string
}

export interface SecurePushMessage {
  encryptedEndpoint: SymmetricallyEncryptedMessage<PushSubscription>
  encryptedPayload: SymmetricallyEncryptedMessage<NotificationOptions>
}

export interface PushServerConfig {
  host: string
  path: string
  publicKey: string
  vapidKey: string
}

export interface SecurePushEvents {
  receivedMessage: (payload: any, senderId: string) => void
}
/**
 * Client cLass with initialization for the given server config and client key. Enables pushing (and receiving) of encrypted messages through the push server.
 */
export class SecurePusher extends EventEmitter<SecurePushEvents> {
  /**
   * Encode the pushSubscription symmetrically with the server public key so it is safe to share with other contacts. Only the server can get your subscription data.
   */
  readonly sharedSubscription
  /**
   * URL to SecurePush relay server
   */
  private readonly postURI

  /**
   *
   * @param pushSubscription
   * @param key
   * @param serverConfig
   * @see SecurePusher.register
   */
  private constructor (private readonly pushSubscription: PushSubscription, private readonly key: SecureCommunicationKey, private readonly serverConfig: PushServerConfig) {
    super()
    this.postURI = `${serverConfig.host}${serverConfig.path}/push`
    this.sharedSubscription = SecureCommunicationKey.encrypt(this.serverConfig.publicKey, this.pushSubscription)
  }

  /**
   * Gets the service worker and asks for a push subscription.
   * @param secureKey
   * @param serverConfig
   * @returns
   */
  static async register (secureKey: SecureCommunicationKey, serverConfig: PushServerConfig): Promise<SecurePusher | undefined> {
    const serviceWorkerRegistration: ServiceWorkerRegistration | undefined = await navigator.serviceWorker.getRegistration()

    if (serviceWorkerRegistration !== undefined) {
      SecurePusher.listenIncoming(serviceWorkerRegistration)
      const subs = await serviceWorkerRegistration.pushManager.subscribe({ applicationServerKey: serverConfig.vapidKey, userVisibleOnly: true })
      if (subs !== undefined) {
        await postCommunicationKey(secureKey)
        return new this(subs, secureKey, serverConfig)
      }
    }
  }

  private static listenIncoming (registration: ServiceWorkerRegistration): void {
    console.info('first')
    registration.addEventListener('push', function (event) {
      console.log('Push notification received:', event)
      // const title = 'Push Notification'
      // event.waitUntil(self.registration.showNotification(title, options))
    }, { capture: false, passive: false })

    // registration.addEventListener('push', (pushEvent) => {
    //   console.info(event)
    //   // if (event.data !== undefined && event.data.type === 'SKIP_WAITING') { self.skipWaiting().catch(console.error) }
    // })
  }

  async pushText (msg: NotificationOptions, peerId: string, shareSubscription: SymmetricallyEncryptedMessage<PushSubscription>): Promise<boolean> {
    const spm: SecurePushMessage = {
      encryptedEndpoint: shareSubscription,
      encryptedPayload: SecureCommunicationKey.encrypt(peerId, msg)
    }
    return await this.pushMessages([spm])
  }

  async pushMessages (securePushMessages: SecurePushMessage[]): Promise<boolean> {
    const { secureChannel, handshake } = this.key.initiateHandshake(this.serverConfig.publicKey)
    const encryptedPushMessages = secureChannel.encrypt(securePushMessages)
    const webPushRequest: WebPushRequest = { handshake, encryptedPushMessages, senderId: this.key.peerId }
    return await new Promise((resolve, reject) => {
      axios.post(this.postURI, webPushRequest).then(response => { resolve(response.status === 200) }).catch(reject)
    })
  }
}
async function postCommunicationKey (key: SecureCommunicationKey): Promise<void> {
  navigator.serviceWorker.controller?.postMessage({ type: 'UPDATE_KEY', key: key.toJSON() })
}
