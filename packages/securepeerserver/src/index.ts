
import type { Server as HttpsServer } from 'https'
import type { Server as HttpServer } from 'http'
import type { Express } from 'express'
import type { IClient, IConfig, IMessage, PeerServerEvents } from 'peer'

import { PeerServer, ExpressPeerServer } from 'peer'
import { type EncryptedHandshake, type SecureCommunicationKey } from 'secure-communication-kit'

export * from 'secure-communication-kit'
/**
 * Returns a secure Express Peer server instance.
 *
 * @param serverKey The SecureCommunicationKey object used for encryption.
 * @param server An HTTP or HTTPS server instance.
 * @param options Optional configuration options.
 * @returns An Express instance with PeerServerEvents.
 */
export function createSecureExpressPeerServer (
  serverKey: SecureCommunicationKey,
  server: HttpsServer | HttpServer,
  options?: Partial<IConfig>
): Express & PeerServerEvents {
  return initializeSecureServer(
    ExpressPeerServer(server, disableGenerateClientId(options)),
    serverKey
  )
}

/**
 * Returns a secure Peer server instance.
 *
 * @param serverKey The SecureCommunicationKey object used for encryption.
 * @param options Optional configuration options.
 * @param callback An optional callback function to be executed after the server is created.
 * @returns An Express instance with PeerServerEvents.
 */
export function createSecurePeerServer (
  serverKey: SecureCommunicationKey,
  options?: Partial<IConfig>,
  callback?: (server: HttpsServer | HttpServer) => void
): Express & PeerServerEvents {
  return initializeSecureServer(
    PeerServer(disableGenerateClientId(options), callback),
    serverKey
  )
}

/**
 * Disables the client ID generation option in the configuration object.
 *
 * @param config The configuration object to modify.
 * @returns The modified configuration object.
 */
const disableGenerateClientId = (config?: Partial<IConfig>): Partial<IConfig> => {
  config = {
    ...config,
    generateClientId: () => ''
  }
  console.debug('SecurePeerServer config', config)
  return config
}

/**
 * Initializes a secure server instance with event handlers.
 *
 * @param peerServer The Peer server instance to modify.
 * @param serverKey The SecureCommunicationKey object used for encryption.
 * @returns The modified Peer server instance with event handlers.
 */
function initializeSecureServer (
  peerServer: Express & PeerServerEvents,
  serverKey: SecureCommunicationKey
): Express & PeerServerEvents {
  peerServer.on('connection', (client: IClient) => {
    handleConnection(client, serverKey)
  })
  peerServer.on('disconnect', handleDisconnect)
  peerServer.on('message', handleMessage)
  const publicKey: string = serverKey.peerId
  console.debug(`SecurePeerServer Public Key: ${publicKey}`)
  return peerServer
}

function handleConnection (client: IClient, serverKey: SecureCommunicationKey): void {
  const peerId = client.getId()
  let handshake: EncryptedHandshake

  try {
    handshake = JSON.parse(client.getToken())
  } catch (error) {
    client.getSocket()?.close()
    console.info(
      '🚩 Closing socket: Invalid handshake',
      peerId,
      client.getToken()
    )
    return
  }
  try {
    client.send(serverKey.receiveHandshake(peerId, handshake).encrypt('welcome ' + peerId))
  } catch (e: any) {
    client.getSocket()?.close()
    console.info(
      '💢 Closing socket: No secret from handshake',
      peerId,
      e.toString())
  }
}

function handleDisconnect (_client: IClient): void {}
function handleMessage (_client: IClient, _message: IMessage): void {}
