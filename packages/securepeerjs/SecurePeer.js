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
exports.SecurePeer = void 0;
const peerjs_1 = __importDefault(require("peerjs"));
const SecureChannel_1 = require("securepeerkey/SecureChannel");
const SecureLayer_1 = require("./SecureLayer");
/**
 * A SecurePeer guarantees its identity and  establish encrypted communication over trusted connections.
 */
class SecurePeer extends peerjs_1.default {
    constructor(key, options, serverPublicKey) {
        super(key.peerId, (serverPublicKey != null)
            ? Object.assign(Object.assign({}, options), { token: JSON.stringify(key.initiateHandshake(serverPublicKey).handshake) }) : options);
        this.key = key;
        this.serverPublicKey = serverPublicKey;
        let serverInit;
        super.on('open', (id) => { this.handleOpenServer(id, serverInit.sharedSecret); });
        super.on('connection', this.handleConnection);
        super.on('error', console.error);
    }
    /**
     * Creates a new Connection to the peer using given options. A handshake is initiated to establish a common shared secret.
     * @param peerId
     * @param options
     * @returns
     */
    connectSecurely(peerId, options) {
        const initiatedHandShake = this.key.initiateHandshake(peerId);
        options = Object.assign(Object.assign({}, options), { metadata: initiatedHandShake.handshake });
        const conn = super.connect(peerId, options);
        const secureLayer = new SecureLayer_1.SecureLayer(new SecureChannel_1.SecureChannel(initiatedHandShake.sharedSecret), conn);
        return secureLayer;
    }
    /**
     * Handler for new incoming DataConnections. A SecurePeer closes the socket from any dataConnection with invalid handshake.
     * @param dataConnection
     */
    handleConnection(dataConnection) {
        try {
            dataConnection.metadata.secureLayer = new SecureLayer_1.SecureLayer(new SecureChannel_1.SecureChannel(this.key.receiveHandshake(dataConnection.peer, dataConnection.metadata)), dataConnection);
        }
        catch (e) {
            dataConnection.close();
            console.warn('Invalid handshake from connection', e);
            super.emit('error', new Error('Invalid handshake'));
        }
    }
    /**
     * Handler for opening connection to peerServer. Makes sure the id passed by the server is indeed the request SecurePeer.peerId
     * @param serverAssignedId
     * @param _sharedSecret
     */
    handleOpenServer(serverAssignedId, _sharedSecret) {
        if (serverAssignedId !== this.key.peerId) {
            throw Error('server assigned different ID');
        }
        void this.isServerSecure().then(isSecure => {
            console.debug(isSecure ? '🔏 [secure server]' : '🔒 [generic server]');
        });
    }
    /**
     * Tests if the current connecting server accepts any random client.
     * @returns
     */
    isServerSecure() {
        const _super = Object.create(null, {
            options: { get: () => super.options }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const insecurePeer = new peerjs_1.default(`${Math.round(Math.random() * 1000000000)}`, _super.options);
            return yield new Promise(resolve => {
                insecurePeer.on('disconnected', () => {
                    clearTimeout(connectionTimeout);
                    resolve(true);
                });
                const connectionTimeout = setTimeout(() => {
                    // server should have disconnected if it were secured
                    resolve(false);
                    insecurePeer.destroy();
                }, 5000);
            });
        });
    }
}
exports.SecurePeer = SecurePeer;
