
import type { Server as HttpsServer } from 'https'
import type { Server as HttpServer } from 'http'
import type { Express } from 'express'
import type { IClient, IConfig, PeerServerEvents } from 'peer'

import { PeerServer, ExpressPeerServer } from 'peer'
import { type SecureCommunicationKey } from 'secure-communication-kit'

export * from 'secure-communication-kit'
/**
 * Returns a secure Express Peer server instance.
 *
 * @param serverKey The SecureCommunicationKey object used for encryption.
 * @param server An HTTP or HTTPS server instance.
 * @param options Optional configuration options. See peerJS options
 * @see PeerServer
 * @returns An Express instance with SecurePeerServerEvents.
 */
export function ExpressSecurePeerServer (
  serverKey: SecureCommunicationKey,
  server: HttpsServer | HttpServer,
  options?: Partial<IConfig>
): Express & PeerServerEvents {
  return initialize(
    ExpressPeerServer(server, // disableGenerateClientId
      options),
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
export function SecurePeerServer (
  serverKey: SecureCommunicationKey,
  options?: Partial<IConfig>,
  callback?: (server: HttpsServer | HttpServer) => void
): Express & PeerServerEvents {
  return initialize(
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
  return {
    ...config//,
    // generateClientId: (): string => { return  }
  }
}

/**
 * Adds a connection handler that verifies the token from connecting peers for a valid EncryptedHandshake
 *
 * @see EncryptedHandshake
 * @param peerServer The Peer server instance to modify.
 * @param serverKey The SecureCommunicationKey object used for encryption.
 * @returns The modified Peer server instance with event handlers.
 */
function initialize (
  peerServer: Express & PeerServerEvents,
  serverKey: SecureCommunicationKey
): Express & PeerServerEvents {
  peerServer.on('connection', (client: IClient) => {
    console.debug('new connection from', client.getId())
    const peerId = client.getId()
    try {
      client.send(serverKey.receiveHandshake(peerId, JSON.parse(client.getToken())).encrypt(`welcome ${peerId}`))
    } catch (error) {
      // client.send('receiveHandshake error:' + (error as string))
      client.getSocket()?.close()
      console.warn('error', error)
      // peerServer.emit('invalid-handshake', peerId)
    }
  })

  peerServer.on('error', (e) => { console.warn(e) })
  // peerServer.on('connection', (c) => { console.debug(c) })
  // peerServer.on('message', (m) => { console.debug(m) })
  // peerServer.on('disconnect', (c) => { console.debug(c) })

  return peerServer
}
