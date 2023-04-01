import * as peer from 'peer'
import type express from 'express'
import type https from 'https'
import type http from 'http'

import {
  type Handshake,
  SecureChannel,
  type SecurePeerKey
} from 'securepeerkey'

export function SecureExpressPeerServer (
  serverKey: SecurePeerKey,
  server: https.Server | http.Server,
  options?: Partial<peer.IConfig>
): express.Express & peer.PeerServerEvents {
  return initServer(peer.ExpressPeerServer(server, options), serverKey)
}
export function SecurePeerServer (
  serverKey: SecurePeerKey,
  options?: Partial<peer.IConfig>,
  callback?: (server: https.Server | http.Server) => void
): express.Express & peer.PeerServerEvents {
  return initServer(peer.PeerServer(options, callback), serverKey)
}

function initServer (
  peerServer: express.Express & peer.PeerServerEvents,
  serverKey: SecurePeerKey
): express.Express & peer.PeerServerEvents {
  peerServer.on('connection', (client: peer.IClient) => { connectionHandler(client, serverKey) }
  )
  peerServer.on('disconnect', disconnectHandler)
  peerServer.on('message', messagehandler)
  return peerServer
}

function connectionHandler (client: peer.IClient, serverKey: SecurePeerKey): void {
  const peerId = client.getId()
  console.info('Peer connecting', peerId)
  let handshake: Handshake

  try {
    handshake = JSON.parse(client.getToken())
  } catch (error) {
    console.log(
      '🚩 Closing socket: Invalid handshake',
      peerId,
      client.getToken()
    )
    client.getSocket()?.close()
    return
  }

  // let sharedSecret: undefined | Uint8Array

  serverKey
    .receiveHandshake(peerId, handshake)
    .then(async (sharedSecret) => {
      const sc = new SecureChannel(sharedSecret)
      const welcomeCipher = await sc.encryptMessage('welcome ' + peerId)
      client.send(welcomeCipher)
      // secret not used anymore in further server-peer communication
      //   clientSecrets.set(client, sharedSecret);
      console.info('🪁 Peer connected', peerId)
    })
    .catch((e) => {
      console.log(
        '💢 Closing socket: No secret from handhake: ',
        peerId,
        handshake,
        e.message
      )
      client.getSocket()?.close()
    })
}

function disconnectHandler (_client: peer.IClient): void {}
function messagehandler (_client: peer.IClient, _message: peer.IMessage): void {}
