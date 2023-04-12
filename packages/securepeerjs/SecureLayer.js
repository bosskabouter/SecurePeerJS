"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureLayer = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
/**
 * Wraps the dataConnection with the secureChannel. The SecureLayer is automatically instantiated after a successful handshake and added to the connection.metadata.secureLayer to pass it on in the event chain for peer.on('connection').
 */
class SecureLayer extends eventemitter3_1.default {
    constructor(secureChannel, dataConnection) {
        super();
        this.secureChannel = secureChannel;
        this.dataConnection = dataConnection;
        this.dataConnection.on('open', () => {
            this.dataConnection.on('data', (data) => {
                try {
                    this.emit('decrypted', this.secureChannel.decryptMessage(JSON.parse(data)));
                }
                catch (error) {
                    console.error(error);
                }
            });
        });
    }
    /**
     * Sends the data over a secureChannel
     * @param data
     * @param chunked
     */
    send(data, chunked) {
        this.dataConnection.send(JSON.stringify(this.secureChannel.encryptMessage(data)), chunked);
    }
}
exports.SecureLayer = SecureLayer;
