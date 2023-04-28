import Peer, { type PeerJSOption, type PeerConnectOption, type DataConnection, type MediaConnection } from 'peerjs'
import { SecureLayer } from './SecureLayer'
import { type SecureChannel, type SecureCommunicationKey } from '.'

/**
 * A SecurePeer has a guaranteed verified identity and establishes encrypted P2P communication over trusted connections.
 */
export class SecurePeer extends Peer {
  /**
   * Creates a SecurePeer with given key. It connects to a peerserver, just like a normal peer. If a serverPublicKey is given, it will use it to initiate a secure handshake. If no serverPublicKey is given, it will connect to any normal peerserver.
   * @param key of the peer
   * @param options normal peerjs connection options. token will be used to pass the secure
   *  @see PeerJSOption
   * @param serverPublicKey optional key to initiate a secure handshake with. If none was given, the peer can connect to any normal peerserver and its identity cannot be guaranteed (other then not being able to communicate with other securePeers)
   */
  constructor (private readonly key: SecureCommunicationKey, public readonly serverPublicKey?: string, options?: PeerJSOption) {
    let secret: Uint8Array
    if (serverPublicKey !== null && serverPublicKey !== undefined) {
      // expect a secure server to handshake
      const serverInit = key.initiateHandshake(serverPublicKey)
      options = { ...options, token: JSON.stringify(serverInit.handshake) }
      secret = serverInit.secureChannel.sharedSecret
    }

    super(key.peerId, options)

    super.on('open', (id) => { this.handleOpenServer(id, secret) })
    super.on('connection', this.handleDataConnection)
    super.on('call', this.validateConnection)
    super.on('error', console.error)
  }

  /**
   * Creates a new Connection to the peer using given options. A handshake is initiated to establish a common shared secret.
   * @param peerId
   * @param options CAUTION: metadata is replaced with handshake
   * @returns
   */
  // override connect (peerId: string, options?: PeerConnectOption): DataConnection {
  //   const initiatedHandShake = this.key.initiateHandshake(peerId)
  //   const conn = super.connect(peerId, { ...options, metadata: initiatedHandShake.handshake })
  //   conn.metadata.secureLayer = new SecureLayer(initiatedHandShake.secureChannel, conn)
  //   return conn
  // }

  connectSecurely (peerId: string, options?: PeerConnectOption): SecureLayer {
    const initiatedHandShake = this.key.initiateHandshake(peerId)
    const conn = super.connect(peerId, { ...options, metadata: initiatedHandShake.handshake })
    return new SecureLayer(initiatedHandShake.secureChannel, conn)
  }

  /**
   * Handler for new incoming DataConnections. A SecurePeer closes the socket from any dataConnection without a valid handshake. A new `SecureLayer` used to communicate with the other peer is placed in `dataConnection.metadata.secureLayer`
   * @param dataConnection the unencrypted incoming dataConnection
   */
  private handleDataConnection (dataConnection: DataConnection): void {
    const secureChannel = this.validateConnection(dataConnection)
    if (secureChannel !== undefined) {
      dataConnection.metadata.secureLayer = new SecureLayer(
        secureChannel, dataConnection)
    }
  }

  /**
 * Validates all (data and media) incoming connections for a valid handshake in metadata. Connection is closed if not found or invalid.
 * @param connection
 * @returns undefined if con.metadata doesn't contain a valid EncryptedHandshake
 * @see EncryptedHandshake
 */
  private validateConnection (connection: MediaConnection | DataConnection): SecureChannel | undefined {
    try {
      return this.key.receiveHandshake(connection.peer, connection.metadata)
    } catch (e: unknown) {
      connection.close()
      console.warn('Invalid handshake from connection:', e, connection)
      super.emit('error', new Error('Invalid handshake'))
    }
  }

  /**
   * Handler for opening connection to peerServer. Makes sure the id passed by the server is indeed the request SecurePeer.peerId
   * @param serverAssignedId
   * @param _sharedSecret
   */
  private handleOpenServer (serverAssignedId: string, sharedSecret: Uint8Array): void {
    if (serverAssignedId !== this.key.peerId) { throw Error('server assigned different ID') }
  }

  /**
   * Tests if the current connecting server accepts a normal (non-secure) peer client.
   * @returns true if the tested connection was closed.
   */
  public async isServerSecure (): Promise<boolean> {
    const insecurePeer = new Peer(`${Math.round(Math.random() * 1000000000)}`, {
      ...super.options, debug: 0, logFunction (logLevel, ...rest) { }
    })
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
