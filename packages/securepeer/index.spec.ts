import request from 'supertest'
import { type PeerServerEvents, type IClient } from 'peer'
import { createSecureExpressPeerServer, SecurePeerKey, SecureChannel, createSecurePeerServer } from './'
import express, { type Express } from 'express'
import { type EncryptedMessage, type Handshake } from 'securepeerkey'
import { type IncomingMessage, type Server, type ServerResponse } from 'http'
import { jest } from '@jest/globals'
const TEST_PORT = 2000 + Math.floor(Math.random() * 5000)

describe('SecurePeerServer', () => {
  test('Start Peerserver', async () => {
    const serverKey: SecurePeerKey = await SecurePeerKey.create()
    // const peerServer = SecurePeerServer(serverKey, { port: TEST_PORT + 1 })
    expect(serverKey).toBeDefined()
    // expect(peerServer).toBeDefined()
  })
})
describe('SecureExpressPeerServer', () => {
  let app: Express
  let client: IClient

  let serverKey: SecurePeerKey
  let clientKey: SecurePeerKey
  let peerServer: (express.Express & PeerServerEvents) | null
  let initiatedHandshake: { sharedSecret: Uint8Array, handshake: Handshake }

  let server: Server<typeof IncomingMessage, typeof ServerResponse>
  beforeAll((done) => {
    app = express()
    // jest.useFakeTimers()
    void Promise.all([SecurePeerKey.create(), SecurePeerKey.create()]).then(
      async ([serverKeyResult, clientKeyResult]) => {
        serverKey = serverKeyResult
        clientKey = clientKeyResult

        server = app.listen(TEST_PORT, () => {
          console.log(`App listening on port ${TEST_PORT}`)

          peerServer = createSecureExpressPeerServer(serverKey, server, {
            path: '/myApp',
            port: TEST_PORT
          })
          if (peerServer === null) throw Error('Peer NULL')

          const sps = createSecurePeerServer(serverKey, { port: TEST_PORT + 1 })
          expect(sps).toBeDefined()

          app.use('/myApp', peerServer)

          done()
        })
      }
    )
  })

  afterAll((done) => {
    client?.getSocket()?.close()
    peerServer?.emit('disconnect', client)

    // server.closeAllConnections()
    server.unref()
    jest.resetModules()

    server.close(done)
  }, 10000)

  test('responds with 200 status and expected header', async () => {
    const response = await request(peerServer).get('/myApp')
    expect(response.ok).toBeTruthy()
  }, 200)

  test('should initiate handshake', async () => {
    initiatedHandshake = clientKey.initiateHandshake(
      serverKey.peerId
    )
    expect(initiatedHandshake).toBeDefined()
  }, 200)
  test('responds with 200 status and peerjs header', async () => {
    const response = await request(peerServer).get('/myApp/')
    expect(response.body.description).toMatch(
      /A server side element to broker connections between PeerJS clients./
    )
  })

  test('peer with valid welcome', async () => {
    const token: string = JSON.stringify(initiatedHandshake.handshake)
    // expect a welcome message to be sent, encrypted with the shared secret
    const sendMock = jest.fn(async (encryptedWelcome: EncryptedMessage) => {
      expect(encryptedWelcome).toBeDefined()
      const decryptedWelcome = new SecureChannel(initiatedHandshake.sharedSecret)
        .decryptMessage(encryptedWelcome)

      expect(decryptedWelcome).toBeDefined()
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      expect(decryptedWelcome).toEqual(`welcome ${clientKey.peerId}`)
    })

    const closeSocketMock = jest.fn(() => null)
    client = {
      getId: () => {
        return clientKey.peerId
      },
      getToken: () => {
        return token
      },
      getSocket: () => ({
        close: closeSocketMock
      }),
      send: sendMock
    } as unknown as IClient
    const emitted = peerServer?.emit('connection', client)

    expect(emitted).toBeTruthy()
    expect(closeSocketMock).not.toBeCalled()

    await new Promise(resolve => setImmediate(resolve).unref())

    expect(sendMock).toHaveBeenCalled()
  })

  test('peer with malformed handshake - close socket', async () => {
    const closeMock = jest.fn(() => null)
    const fakeClient: IClient = {
      getId: () => {
        return clientKey.peerId
      },
      getToken: () => {
        return 'fake-token'
      },
      getSocket: jest.fn(() => ({
        close: closeMock
      }))
    } as unknown as IClient

    const emitted = peerServer?.emit('connection', fakeClient)
    expect(emitted).toBeTruthy()

    expect(closeMock).toBeCalled()
  })

  test('peer with missing handshake - close socket', () => {
    const closeMock = jest.fn(() => null)
    const fakeClient: IClient = {
      getId: () => {
        return '11111'
      },
      getToken: () => {
        return ''
      }, // Empty token to simulate missing handshake
      getSocket: jest.fn(() => ({
        close: closeMock
      }))
    } as unknown as IClient

    const emitted = peerServer?.emit('connection', fakeClient)
    expect(emitted).toBeTruthy()

    expect(closeMock).toBeCalled()
  })

  test('peer with tempered token - close socket', async () => {
    const key = await SecurePeerKey.create()

    const { handshake } = key.initiateHandshake(serverKey.peerId)

    // use servers pubkey as our encryption pubkey
    handshake.publicSignKey = serverKey.peerId
    const token: string = JSON.stringify(handshake)
    const mockToken = (): string => {
      return token
    }

    const closeMock = jest.fn(() => null)
    const sendMock = jest.fn((arg: string) => {
      expect(arg).not.toBeDefined()
    })
    const fakeClient: IClient = {
      getId: () => {
        return key.peerId
      },
      getToken: mockToken, // Invalid token to simulate invalid handshake
      getSocket: () => ({
        close: closeMock
      }),
      send: sendMock
    } as unknown as IClient

    const emitted = peerServer?.emit('connection', fakeClient)
    expect(emitted).toBeTruthy()

    // Wait for the sendMock function to be called asynchronously
    // await new Promise((resolve) => setTimeout(resolve, 100))
    await new Promise(resolve => setImmediate(resolve).unref())
    expect(closeMock).toBeCalled()
  })

  // const TIMEOUT_EXPIRE_HANDSHAKE = 2000;
  // test(
  //   "peer with expired handshake - close socket",
  //   async () => {
  //     const closeMock = jest.fn(() => null);
  //     const sendMock = jest.fn((arg) => {
  //       //todo implement replay attack prevention
  //       // expect(arg).not.toBeDefined();
  //     });
  //     const key = await SecureChannelKey.create();
  //     const { handshake } = await key.initiateHandshake(serverKey.getPeerId()); // Set handshake expiration to 1 second
  //     await new Promise((resolve) =>
  //       setTimeout(resolve, TIMEOUT_EXPIRE_HANDSHAKE)
  //     ); // Wait for handshake to expire

  //     const token: string = JSON.stringify(handshake);
  //     const fakeClient: IClient = {
  //       getId: () => {
  //         return key.getPeerId();
  //       },
  //       getToken: () => {
  //         return token;
  //       },
  //       getSocket: jest.fn(() => ({
  //         close: closeMock,
  //       })),
  //       send: sendMock,
  //     } as unknown as IClient;

  //     const emitted = peerServer.emit("connection", fakeClient);

  //     expect(emitted).toBeTruthy();

  //     //wait for server response
  //     await new Promise((resolve) => setTimeout(resolve, 100));
  //     //todo: Implement replay attack
  //     // expect(closeMock).toBeCalled();
  //     // expect(sendMock).not.toBeCalled();
  //   },
  //   TIMEOUT_EXPIRE_HANDSHAKE + 1000
  // );
})
