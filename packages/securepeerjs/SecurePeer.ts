import Peer, { type PeerJSOption, type PeerConnectOption, type DataConnection } from 'peerjs'
import { type Handshake } from 'securepeerkey'
import { SecureChannel } from 'securepeerkey/SecureChannel'
import { type SecurePeerKey } from 'securepeerkey/SecurePeerKey'
import { SecureLayer } from './SecureLayer'

/**
 * A SecurePeer guarantees its identity and  establish encrypted communication over trusted connections.
 */
export class SecurePeer extends Peer {
  constructor (private readonly key: SecurePeerKey, options?: PeerJSOption, public readonly serverPublicKey?: string) {
    super(key.peerId, (serverPublicKey != null)
      ? { ...options, token: JSON.stringify(key.initiateHandshake(serverPublicKey).handshake) }
      : options)
    let serverInit: {
      sharedSecret: Uint8Array
      handshake: Handshake
    }
    super.on('open', (id) => { this.handleOpenServer(id, serverInit.sharedSecret) })
    super.on('connection', this.handleConnection)
    super.on('error', console.error)
  }

  /**
   * Creates a new Connection to the peer using given options. A handshake is initiated to establish a common shared secret.
   * @param peerId
   * @param options
   * @returns
   */
  connectSecurely (peerId: string, options?: PeerConnectOption): SecureLayer {
    const initiatedHandShake = this.key.initiateHandshake(peerId)
    options = { ...options, metadata: initiatedHandShake.handshake }
    const conn = super.connect(peerId, options)
    const secureLayer = new SecureLayer(new SecureChannel(initiatedHandShake.sharedSecret), conn)
    return secureLayer
  }

  /**
   * Handler for new incoming DataConnections. A SecurePeer closes the socket from any dataConnection with invalid handshake.
   * @param dataConnection
   */
  private handleConnection (dataConnection: DataConnection): void {
    try {
      dataConnection.metadata.secureLayer = new SecureLayer(
        new SecureChannel(this.key.receiveHandshake(dataConnection.peer, dataConnection.metadata)), dataConnection)
    } catch (e: unknown) {
      dataConnection.close()
      console.warn('Invalid handshake from connection', e)
      super.emit('error', new Error('Invalid handshake'))
    }
  }

  /**
   * Handler for opening connection to peerServer. Makes sure the id passed by the server is indeed the request SecurePeer.peerId
   * @param serverAssignedId
   * @param _sharedSecret
   */
  private handleOpenServer (serverAssignedId: string, _sharedSecret: Uint8Array): void {
    if (serverAssignedId !== this.key.peerId) { throw Error('server assigned different ID') }
    void this.isServerSecure().then(isSecure => {
      console.debug(isSecure ? '🔏 [secure server]' : '🔒 [generic server]')
    })
  }

  /**
   * Tests if the current connecting server accepts any random client.
   * @returns
   */
  async isServerSecure (): Promise<boolean> {
    const insecurePeer = new Peer(`${Math.round(Math.random() * 1000000000)}`, super.options)
    return await new Promise(resolve => {
      insecurePeer.on('disconnected', (): void => {
        clearTimeout(connectionTimeout)
        resolve(true)
      })
      const connectionTimeout = setTimeout(() => {
        // server should have disconnected if it were secured
        resolve(false)
        insecurePeer.destroy()
      }, 5000)
    })
  }
}