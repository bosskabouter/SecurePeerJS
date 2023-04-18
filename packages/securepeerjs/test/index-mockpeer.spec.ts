import { Peer } from 'peerjs'
import { type DataConnection, type PeerConnectOption } from 'peerjs'

import { jest } from '@jest/globals'
import { type SpiedFunction } from 'jest-mock'
import { SecurePeer } from '../src/SecurePeer'
import { SecureCommunicationKey } from '../src'
describe('SecurePeerJS', () => {
  let connectMock: SpiedFunction<(peer: string, options?: PeerConnectOption | undefined) => DataConnection>

  let key1: SecureCommunicationKey, key2: SecureCommunicationKey
  let peer1: SecurePeer, peer2: SecurePeer

  beforeAll((done) => {
    connectMock = jest.spyOn(Peer.prototype, 'connect').mockImplementation((peer: string, options?: PeerConnectOption) => {
      return {
        close: jest.fn(),
        send: jest.fn(),
        open: true,
        on: jest.fn(),
        peer: key2.peerId
      } as unknown as DataConnection
    })

    // peer1 = new SecurePeer(key1)
    void Promise.all([SecureCommunicationKey.create(), SecureCommunicationKey.create()]).then((r) => {
      peer1 = new SecurePeer(key1 = r[0])
      expect(key1.peerId).toBeDefined()
      peer2 = new SecurePeer(key2 = r[1])
      expect(peer1).toBeDefined()
      expect(peer2).toBeDefined()

      peer2.on('open', (id: string) => {
        console.info('peer connected', peer2, id)
      })
      done()
    })
  })

  afterEach(() => {
    peer1.disconnect()
    connectMock.mockRestore()
  })

  beforeEach((done) => {
    done()
    // if (peer1.disconnected) {
    //   // If the peer is already connected, pass the test
    //   expect(peer1.disconnected).toBe(false)
    //   console.info('Client connected 1', peer1.id)

    //   done()
    // } else {
    // If the peer is not connected, wait for it to connect or timeout after 5 seconds

    // peer1.on('error', (e) => {
    //   expect(e).toBeNull()
    //   console.info('Client errored', e)
    //   done()
    // })
  }
  // }
  )

  afterAll(() => {
    peer1.disconnect()
    peer1.destroy()
    peer2.disconnect()
    peer2.destroy()
  })

  test('PeerJS test', async () => {
    // Mock the PeerJS library
    expect(key2.peerId).toBeDefined()
    peer2.on('connection', con => { expect(con).toBeDefined() })

    const secureLayer12 = peer1.connectSecurely(key2.peerId)

    expect(secureLayer12).toBeDefined()
    secureLayer12.send('Data to encrypt')
    // Set up a promise to wait for the connection event
  })
})
