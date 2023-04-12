"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureChannel = void 0;
const libsodium_wrappers_1 = __importDefault(require("libsodium-wrappers"));
/**
 * Once a shared secret has been established in between two participants during handshake, a secure channel is able to encrypt and decrypt messages using this shared common secret
 */
class SecureChannel {
    /**
       *
       * @param sharedSecret
       */
    constructor(sharedSecret) {
        this.sharedSecret = sharedSecret;
    }
    encryptMessage(message) {
        // Generate a new random nonce for each message
        const nonce = libsodium_wrappers_1.default.randombytes_buf(libsodium_wrappers_1.default.crypto_secretbox_NONCEBYTES);
        // Encrypt the message with the shared secret and nonce
        const cipherText = libsodium_wrappers_1.default.crypto_secretbox_easy(libsodium_wrappers_1.default.from_string(message), nonce, this.sharedSecret);
        return {
            nonce: libsodium_wrappers_1.default.to_base64(nonce),
            cipher: libsodium_wrappers_1.default.to_base64(cipherText)
        };
    }
    decryptMessage(encryptedMessage) {
        // Decrypt the message with the shared secret and nonce
        const decryptedBytes = libsodium_wrappers_1.default.crypto_secretbox_open_easy(libsodium_wrappers_1.default.from_base64(encryptedMessage.cipher), libsodium_wrappers_1.default.from_base64(encryptedMessage.nonce), this.sharedSecret);
        return libsodium_wrappers_1.default.to_string(decryptedBytes);
    }
}
exports.SecureChannel = SecureChannel;
