"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const _1 = require("./");
const express_1 = __importDefault(require("express"));
const globals_1 = require("@jest/globals");
const TEST_PORT = 2000 + Math.floor(Math.random() * 5000);
describe('SecurePeerServer', () => {
    test('Start Peerserver', () => __awaiter(void 0, void 0, void 0, function* () {
        const serverKey = yield _1.SecurePeerKey.create();
        // const peerServer = SecurePeerServer(serverKey, { port: TEST_PORT + 1 })
        expect(serverKey).toBeDefined();
        // expect(peerServer).toBeDefined()
    }));
});
describe('SecureExpressPeerServer', () => {
    let app;
    let client;
    let serverKey;
    let clientKey;
    let peerServer;
    let initiatedHandshake;
    let server;
    beforeAll((done) => {
        app = (0, express_1.default)();
        // jest.useFakeTimers()
        void Promise.all([_1.SecurePeerKey.create(), _1.SecurePeerKey.create()]).then(([serverKeyResult, clientKeyResult]) => __awaiter(void 0, void 0, void 0, function* () {
            serverKey = serverKeyResult;
            clientKey = clientKeyResult;
            server = app.listen(TEST_PORT, () => {
                console.log(`App listening on port ${TEST_PORT}`);
                peerServer = (0, _1.createSecureExpressPeerServer)(serverKey, server, {
                    path: '/myApp',
                    port: TEST_PORT
                });
                if (peerServer === null)
                    throw Error('Peer NULL');
                const sps = (0, _1.createSecurePeerServer)(serverKey, { port: TEST_PORT + 1 });
                expect(sps).toBeDefined();
                app.use('/myApp', peerServer);
                done();
            });
        }));
    });
    afterAll((done) => {
        var _a;
        (_a = client === null || client === void 0 ? void 0 : client.getSocket()) === null || _a === void 0 ? void 0 : _a.close();
        peerServer === null || peerServer === void 0 ? void 0 : peerServer.emit('disconnect', client);
        // server.closeAllConnections()
        server.unref();
        globals_1.jest.resetModules();
        server.close(done);
    }, 10000);
    test('responds with 200 status and expected header', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(peerServer).get('/myApp');
        expect(response.ok).toBeTruthy();
    }), 200);
    test('should initiate handshake', () => __awaiter(void 0, void 0, void 0, function* () {
        initiatedHandshake = clientKey.initiateHandshake(serverKey.peerId);
        expect(initiatedHandshake).toBeDefined();
    }), 200);
    test('responds with 200 status and peerjs header', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(peerServer).get('/myApp/');
        expect(response.body.description).toMatch(/A server side element to broker connections between PeerJS clients./);
    }));
    test('peer with valid welcome', () => __awaiter(void 0, void 0, void 0, function* () {
        const token = JSON.stringify(initiatedHandshake.handshake);
        // expect a welcome message to be sent, encrypted with the shared secret
        const sendMock = globals_1.jest.fn((encryptedWelcome) => __awaiter(void 0, void 0, void 0, function* () {
            expect(encryptedWelcome).toBeDefined();
            const decryptedWelcome = new _1.SecureChannel(initiatedHandshake.sharedSecret)
                .decryptMessage(encryptedWelcome);
            expect(decryptedWelcome).toBeDefined();
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            expect(decryptedWelcome).toEqual(`welcome ${clientKey.peerId}`);
        }));
        const closeSocketMock = globals_1.jest.fn(() => null);
        client = {
            getId: () => {
                return clientKey.peerId;
            },
            getToken: () => {
                return token;
            },
            getSocket: () => ({
                close: closeSocketMock
            }),
            send: sendMock
        };
        const emitted = peerServer === null || peerServer === void 0 ? void 0 : peerServer.emit('connection', client);
        expect(emitted).toBeTruthy();
        expect(closeSocketMock).not.toBeCalled();
        yield new Promise(resolve => setImmediate(resolve).unref());
        expect(sendMock).toHaveBeenCalled();
    }));
    test('peer with malformed handshake - close socket', () => __awaiter(void 0, void 0, void 0, function* () {
        const closeMock = globals_1.jest.fn(() => null);
        const fakeClient = {
            getId: () => {
                return clientKey.peerId;
            },
            getToken: () => {
                return 'fake-token';
            },
            getSocket: globals_1.jest.fn(() => ({
                close: closeMock
            }))
        };
        const emitted = peerServer === null || peerServer === void 0 ? void 0 : peerServer.emit('connection', fakeClient);
        expect(emitted).toBeTruthy();
        expect(closeMock).toBeCalled();
    }));
    test('peer with missing handshake - close socket', () => {
        const closeMock = globals_1.jest.fn(() => null);
        const fakeClient = {
            getId: () => {
                return '11111';
            },
            getToken: () => {
                return '';
            },
            getSocket: globals_1.jest.fn(() => ({
                close: closeMock
            }))
        };
        const emitted = peerServer === null || peerServer === void 0 ? void 0 : peerServer.emit('connection', fakeClient);
        expect(emitted).toBeTruthy();
        expect(closeMock).toBeCalled();
    });
    test('peer with tempered token - close socket', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = yield _1.SecurePeerKey.create();
        const { handshake } = key.initiateHandshake(serverKey.peerId);
        // use servers pubkey as our encryption pubkey
        handshake.publicSignKey = serverKey.peerId;
        const token = JSON.stringify(handshake);
        const mockToken = () => {
            return token;
        };
        const closeMock = globals_1.jest.fn(() => null);
        const sendMock = globals_1.jest.fn((arg) => {
            expect(arg).not.toBeDefined();
        });
        const fakeClient = {
            getId: () => {
                return key.peerId;
            },
            getToken: mockToken,
            getSocket: () => ({
                close: closeMock
            }),
            send: sendMock
        };
        const emitted = peerServer === null || peerServer === void 0 ? void 0 : peerServer.emit('connection', fakeClient);
        expect(emitted).toBeTruthy();
        // Wait for the sendMock function to be called asynchronously
        // await new Promise((resolve) => setTimeout(resolve, 100))
        yield new Promise(resolve => setImmediate(resolve).unref());
        expect(closeMock).toBeCalled();
    }));
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
});
