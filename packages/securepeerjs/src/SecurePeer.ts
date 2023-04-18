import Peer, { type PeerJSOption, type PeerConnectOption, type DataConnection, type MediaConnection } from 'peerjs'
import { type Handshake, type SecurePeerKey } from 'securepeerkey'
import { SecureChannel } from 'securepeerkey'
import { SecureLayer } from './SecureLayer'

/**
 * A SecurePeer has a guaranteed verified identity and establishes encrypted P2P communication over trusted connections.
 */
export class SecurePeer extends Peer {
  constructor (private readonly key: SecurePeerKey, options?: PeerJSOption, public readonly serverPublicKey?: string) {
    let serverSharedSecret: Uint8Array

    if (serverPublicKey !== null && serverPublicKey !== undefined) {
      // expect a secure server
      const serverInit: {
        sharedSecret: Uint8Array
        handshake: Handshake
      } = key.initiateHandshake(serverPublicKey)
      options = (serverPublicKey != null)
        ? { ...options, token: JSON.stringify(serverInit.handshake) }
        : options
      serverSharedSecret = serverInit.sharedSecret
    }

    super(key.peerId, options)
    super.on('open', (id) => { this.handleOpenServer(id, serverSharedSecret) })
    super.on('connection', this.handleDataConnection)
    super.on('call', this.handleMediaConnection)
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
   * Handler for new incoming DataConnections. A SecurePeer closes the socket from any dataConnection with invalid handshake. If valid, a new `SecureLayer` is placed in `dataConnection.metadata.secureLayer`
   * @param dataConnection
   */
  private handleDataConnection (dataConnection: DataConnection): void {
    const secureChannel = this.validateConnection(dataConnection)
    secureChannel !== undefined && (dataConnection.metadata.secureLayer = new SecureLayer(
      secureChannel, dataConnection))
  }

  /**
   * Handler for new incoming MediaConnections. A SecurePeer closes the socket from any mediaConnection with invalid handshake.
   * @param dataConnection
   */
  private handleMediaConnection (mediaConnection: MediaConnection): void {
    this.validateConnection(mediaConnection)
  }

  /**
 * Validates all (data and media) incoming connections for a valid handshake in metadata. Connection is closed if not found ur invalid.
 * @param con
 * @returns
 */
  private validateConnection (con: MediaConnection | DataConnection): SecureChannel | undefined {
    try {
      return new SecureChannel(this.key.receiveHandshake(con.peer, con.metadata))
    } catch (e: unknown) {
      con.close()
      console.warn('Invalid handshake from connection', e, con)
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
