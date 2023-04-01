import request from 'supertest'
import { type PeerServerEvents, type IClient } from 'peer'
import { SecureExpressPeerServer } from '../src'
import express, { type Express } from 'express'
import { SecurePeerKey, SecureChannel, type Handshake } from 'securepeerkey'
import { type Server } from 'http'

describe('GET /signal', () => {
  let app: Express
  let server: Server

  let serverKey: SecurePeerKey
  let clientKey: SecurePeerKey
  let peerServer: express.Express & PeerServerEvents
  let initiatedHandshake: { sharedSecret: Uint8Array, handshake: Handshake }

  beforeAll((done) => {
    app = express()
    const port = 2000 + Math.floor(Math.random() * 5000)
    server = app.listen(port, () => {
      console.log(`Server started on port ${port}`)
    })

    void Promise.all([SecurePeerKey.create(), SecurePeerKey.create()]).then(
      async ([serverKeyResult, clientKeyResult]) => {
        serverKey = serverKeyResult
        clientKey = clientKeyResult
        peerServer = SecureExpressPeerServer(serverKey, server, {
          path: '/myApp'
        })
        app.use('/peerjs', peerServer)
        initiatedHandshake = await clientKey.initiateHandshake(
          serverKey.getPeerId()
        )
        done()
      }
    )
  })

  afterAll((done) => {
    server.close(() => {
      console.log('Server closed')
      done()
    })
  })

  test('responds with 200 status and expected header', async () => {
    const response = await request(peerServer).get('/myApp')
    expect(response.ok).toBeTruthy()
  })

  test('responds with 200 status and peerjs header', async () => {
    const response = await request(peerServer).get('/myApp/')
    expect(response.body.description).toMatch(
      /A server side element to broker connections between PeerJS clients./
    )
  })

  test('peer with valid handshake', async () => {
    const token: string = JSON.stringify(initiatedHandshake.handshake)
    // expect a welcome message to be sent, encrypted with the shared secret
    const sendMock = jest.fn((arg) => {
      expect(arg).toBeDefined()
      void new SecureChannel(initiatedHandshake.sharedSecret)
        .decryptMessage(arg)
        .then((decryptedMessage) => {
          expect(decryptedMessage).toBeDefined()
          expect(decryptedMessage).toEqual(`welcome ${clientKey.getPeerId()}`)
        })
    })

    const closeSocketMock = jest.fn(() => null)
    const client: IClient = {
      getId: () => {
        return clientKey.getPeerId()
      },
      getToken: () => {
        return token
      },
      getSocket: () => ({
        close: closeSocketMock
      }),
      send: sendMock
    } as unknown as IClient
    const emitted = peerServer.emit('connection', client)
    expect(emitted).toBeTruthy()
    expect(closeSocketMock).not.toBeCalled()

    // Wait for the sendMock function to be called asynchronously
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(sendMock).toHaveBeenCalled()
  }, 300)

  it('peer with malformed handshake - close socket', async () => {
    const closeMock = jest.fn(() => null)
    const fakeClient: IClient = {
      getId: () => {
        return clientKey.getPeerId()
      },
      getToken: () => {
        return '2iu'
      },
      getSocket: jest.fn(() => ({
        close: closeMock
      }))
    } as unknown as IClient

    const emitted = peerServer.emit('connection', fakeClient)
    expect(emitted).toBeTruthy()

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(closeMock).toBeCalled()
  }, 300)

  it('peer with missing handshake - close socket', async () => {
    const closeMock = jest.fn(() => null)
    const fakeClient: IClient = {
      getId: () => {
        return '234234234234'
      },
      getToken: () => {
        return ''
      }, // Empty token to simulate missing handshake
      getSocket: jest.fn(() => ({
        close: closeMock
      }))
    } as unknown as IClient

    const emitted = peerServer.emit('connection', fakeClient)
    expect(emitted).toBeTruthy()

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(closeMock).toBeCalled()
  }, 300)

  test('peer with invalid handshake - close socket', async () => {
    const closeMock = jest.fn(() => null)
    const fakeClient: IClient = {
      getId: () => {
        return '2iu'
      },
      getToken: () => {
        return 'invalid'
      }, // Invalid token to simulate invalid handshake
      getSocket: jest.fn(() => ({
        close: closeMock
      }))
    } as unknown as IClient

    const emitted = peerServer.emit('connection', fakeClient)
    expect(emitted).toBeTruthy()

    // Wait for the sendMock function to be called asynchronously
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(closeMock).toBeCalled()
  }, 300)

  it('peer with tempered token - close socket', async () => {
    const key = await SecurePeerKey.create()

    const { handshake } = await key.initiateHandshake(serverKey.getPeerId())

    // use servers pubkey as our encryption pubkey
    handshake.publicSignKey = serverKey.getPeerId()
    const token: string = JSON.stringify(handshake)
    const mockToken = (): string => {
      return token
    }

    const closeMock = jest.fn(() => null)
    const sendMock = jest.fn((arg) => {
      expect(arg).not.toBeDefined()
    })
    const fakeClient: IClient = {
      getId: () => {
        return key.getPeerId()
      },
      getToken: mockToken, // Invalid token to simulate invalid handshake
      getSocket: () => ({
        close: closeMock
      }),
      send: sendMock
    } as unknown as IClient

    const emitted = peerServer.emit('connection', fakeClient)
    expect(emitted).toBeTruthy()

    // Wait for the sendMock function to be called asynchronously
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(closeMock).toBeCalled()
  }, 300)

  // const TIMEOUT_EXPIRE_HANDSHAKE = 2000;
  // it(
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
