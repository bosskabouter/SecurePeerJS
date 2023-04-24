import axios from 'axios'
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
/**
 * Client cLass with initialization for the given server config and client key. Enables pushing (and receiving) of encrypted messages through the push server.
 */
export class SecurePusher {
  constructor (private readonly pushSubscription: PushSubscription, private readonly key: SecureCommunicationKey, private readonly serverConfig: PushServerConfig) {}

  async pushMessage (securePushMessages: SecurePushMessage[]): Promise<boolean> {
    const { secureChannel, handshake } = this.key.initiateHandshake(this.serverConfig.publicKey)
    const encryptedPushMessages = secureChannel.encrypt(securePushMessages)
    const webPushRequest: WebPushRequest = { handshake, encryptedPushMessages, senderId: this.key.peerId }
    return await new Promise((resolve, reject) => {
      axios.post(this.serverConfig.host, webPushRequest).then(response => { resolve(response.status === 200) }).catch(reject)
    })
  }

  /**
   * Encode the pushSubscription symmetrically with the server public key so it is safe to share with other contacts. Only the server can get your subscription data.
   * @param subscription E
   * @returns
   */
  shareSubscription (): SymmetricallyEncryptedMessage<PushSubscription> {
    return SecureCommunicationKey.encrypt(this.serverConfig.publicKey, this.pushSubscription)
  }
}
