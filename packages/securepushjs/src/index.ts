import axios from 'axios'
import { SecureCommunicationKey, type SymmetricallyEncryptedMessage } from 'secure-communication-kit'

export * from 'secure-communication-kit'
export * from './sw-init'
/**
 *A 
 */
export interface WebPushRequest {
  encryptedPushSubscription: SymmetricallyEncryptedMessage
  encryptedPayload: string
}

export interface SecurePushMessage extends NotificationOptions {
  encryptedEndpoint: SymmetricallyEncryptedMessage
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

  async pushMessage (securePushMessage: SecurePushMessage): Promise<boolean> {
    this.key.initiateHandshake(this.serverConfig.publicKey)
    return await new Promise((resolve, reject) => {
      axios.post(this.serverConfig.host, { securePushMessage }).then(response => { resolve(response.status === 200) }).catch(reject)
    })
  }

  /**
   * Encode the pushSubscription symmetrically with the server public key so it is safe to share with other contacts. Only the server can get your subscription data.
   * @param subscription E
   * @returns
   */
  getSharedSubscription (): SymmetricallyEncryptedMessage {
    return SecureCommunicationKey.encryptWithRelay(this.serverConfig.publicKey, JSON.stringify(this.pushSubscription))
  }
}
