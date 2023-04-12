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
Object.defineProperty(exports, "__esModule", { value: true });
const peerjs_1 = require("peerjs");
const globals_1 = require("@jest/globals");
const SecurePeerKey_1 = require("securepeerkey/SecurePeerKey");
const SecurePeer_1 = require("./SecurePeer");
describe('SecurePeerJS', () => {
    let connectMock;
    let key1, key2;
    let peer1, peer2;
    beforeAll((done) => {
        connectMock = globals_1.jest.spyOn(peerjs_1.Peer.prototype, 'connect').mockImplementation((peer, options) => {
            return {
                close: globals_1.jest.fn(),
                send: globals_1.jest.fn(),
                open: true,
                on: globals_1.jest.fn(),
                peer: key2.peerId
            };
        });
        // peer1 = new SecurePeer(key1)
        void Promise.all([SecurePeerKey_1.SecurePeerKey.create(), SecurePeerKey_1.SecurePeerKey.create()]).then((r) => {
            peer1 = new SecurePeer_1.SecurePeer(key1 = r[0]);
            expect(key1.peerId).toBeDefined();
            peer2 = new SecurePeer_1.SecurePeer(key2 = r[1]);
            expect(peer1).toBeDefined();
            expect(peer2).toBeDefined();
            peer2.on('open', (id) => {
                console.info('peer connected', peer2, id);
            });
            done();
        });
    });
    afterEach(() => {
        peer1.disconnect();
        connectMock.mockRestore();
    });
    beforeEach((done) => {
        done();
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
    );
    afterAll(() => {
        peer1.disconnect();
        peer1.destroy();
        peer2.disconnect();
        peer2.destroy();
    });
    test('PeerJS test', () => __awaiter(void 0, void 0, void 0, function* () {
        // Mock the PeerJS library
        expect(key2.peerId).toBeDefined();
        peer2.on('connection', con => { expect(con).toBeDefined(); });
        const secureLayer12 = peer1.connectSecurely(key2.peerId);
        expect(secureLayer12).toBeDefined();
        secureLayer12.send('Data to encrypt');
        // Set up a promise to wait for the connection event
    }));
});
