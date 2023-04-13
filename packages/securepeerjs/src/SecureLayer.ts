import EventEmitter from 'eventemitter3'
import { type DataConnection } from 'peerjs'
import { type EncryptedMessage } from 'securepeerkey'
import { type SecureChannel } from 'securepeerkey/src/SecureChannel'
interface SecurePeerEvents {
  decrypted:(string)
  connected: (secureLayer: SecureLayer) => void
}

/**
 * Wraps the dataConnection with the secureChannel. The SecureLayer is automatically instantiated after a successful handshake and added to the connection.metadata.secureLayer to pass it on in the event chain for peer.on('connection').
 */
export class SecureLayer extends EventEmitter<SecurePeerEvents> {
  constructor (
    private readonly secureChannel: SecureChannel,
    readonly dataConnection: DataConnection
  ) {
    super()

    this.dataConnection.on('open', () => {
      this.dataConnection.on('data', (data) => {
        try {
          this.emit('decrypted', this.secureChannel.decryptMessage(JSON.parse(data as string) as EncryptedMessage))
        } catch (error) { console.error(error) }
      })
    })
  }

  /**
   * Sends the data over a secureChannel
   * @param data
   * @param chunked
   */
  send (data: string, chunked?: boolean | undefined): void {
    this.dataConnection.send(JSON.stringify(this.secureChannel.encryptMessage(data)), chunked)
  }
}
