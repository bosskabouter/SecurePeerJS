"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSecurePeerServer = exports.createSecureExpressPeerServer = exports.SecurePeerKey = exports.SecureChannel = void 0;
const SecurePeerKey_1 = require("securepeerkey/SecurePeerKey");
Object.defineProperty(exports, "SecurePeerKey", { enumerable: true, get: function () { return SecurePeerKey_1.SecurePeerKey; } });
const SecureChannel_1 = require("securepeerkey/SecureChannel");
Object.defineProperty(exports, "SecureChannel", { enumerable: true, get: function () { return SecureChannel_1.SecureChannel; } });
const peer_1 = require("peer");
/**
 * Returns a secure Express Peer server instance.
 *
 * @param serverKey The SecurePeerKey object used for encryption.
 * @param server An HTTP or HTTPS server instance.
 * @param options Optional configuration options.
 * @returns An Express instance with PeerServerEvents.
 */
function createSecureExpressPeerServer(serverKey, server, options) {
    return initializeSecureServer((0, peer_1.ExpressPeerServer)(server, disableGenerateClientId(options)), serverKey);
}
exports.createSecureExpressPeerServer = createSecureExpressPeerServer;
/**
 * Returns a secure Peer server instance.
 *
 * @param serverKey The SecurePeerKey object used for encryption.
 * @param options Optional configuration options.
 * @param callback An optional callback function to be executed after the server is created.
 * @returns An Express instance with PeerServerEvents.
 */
function createSecurePeerServer(serverKey, options, callback) {
    return initializeSecureServer((0, peer_1.PeerServer)(disableGenerateClientId(options), callback), serverKey);
}
exports.createSecurePeerServer = createSecurePeerServer;
/**
 * Disables the client ID generation option in the configuration object.
 *
 * @param config The configuration object to modify.
 * @returns The modified configuration object.
 */
const disableGenerateClientId = (config) => {
    config = Object.assign(Object.assign({}, config), { generateClientId: undefined });
    console.debug('SecurePeerServer config', config);
    return config;
};
/**
 * Initializes a secure server instance with event handlers.
 *
 * @param peerServer The Peer server instance to modify.
 * @param serverKey The SecurePeerKey object used for encryption.
 * @returns The modified Peer server instance with event handlers.
 */
function initializeSecureServer(peerServer, serverKey) {
    peerServer.on('connection', (client) => {
        handleConnection(client, serverKey);
    });
    peerServer.on('disconnect', handleDisconnect);
    peerServer.on('message', handleMessage);
    const publicKey = serverKey.peerId;
    console.debug(`SecurePeerServer Public Key: ${publicKey}`);
    return peerServer;
}
function handleConnection(client, serverKey) {
    var _a, _b;
    const peerId = client.getId();
    let handshake;
    try {
        handshake = JSON.parse(client.getToken());
    }
    catch (error) {
        (_a = client.getSocket()) === null || _a === void 0 ? void 0 : _a.close();
        console.info('🚩 Closing socket: Invalid handshake', peerId, client.getToken());
        return;
    }
    try {
        client.send(new SecureChannel_1.SecureChannel(serverKey.receiveHandshake(peerId, handshake)).encryptMessage('welcome ' + peerId));
    }
    catch (e) {
        (_b = client.getSocket()) === null || _b === void 0 ? void 0 : _b.close();
        console.info('💢 Closing socket: No secret from handshake', peerId, e.toString());
    }
}
function handleDisconnect(_client) { }
function handleMessage(_client, _message) { }
