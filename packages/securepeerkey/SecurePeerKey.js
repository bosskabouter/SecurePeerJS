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
exports.SecurePeerKey = void 0;
const libsodium_wrappers_1 = __importDefault(require("libsodium-wrappers"));
/**
 * Key pair used for secure communication between two peers.
 */
class SecurePeerKey {
    /**
       * @see create to initialize key
       */
    constructor(securePeerKeySet) {
        this.securePeerKeySet = securePeerKeySet;
    }
    /**
       *
       * @param seed value to derive the key from. Can be a) a Uint8Array with seed for crypto_sign_seed_keypair, b) any string password to  derive the seed value from using crypto_generichash. Caution: this can results in a weak keyset if string doesn't contain enough entropy.
       * @returns Instance of the SecureChannelKey class
       */
    static create(seed) {
        return __awaiter(this, void 0, void 0, function* () {
            yield libsodium_wrappers_1.default.ready;
            // if seed is just a simple string password, convert it to full 32 byte seed value
            if (typeof seed === 'string') {
                seed = libsodium_wrappers_1.default.crypto_generichash(32, seed);
            }
            const signKeyPair = (seed != null)
                ? libsodium_wrappers_1.default.crypto_sign_seed_keypair(seed)
                : libsodium_wrappers_1.default.crypto_sign_keypair();
            const boxKeyPair = (seed != null)
                ? libsodium_wrappers_1.default.crypto_box_seed_keypair(seed)
                : libsodium_wrappers_1.default.crypto_box_keypair();
            return new this({ signKeyPair, boxKeyPair });
        });
    }
    /**
       * @returns Public identifier of this peer, based on the base64 value of public box key (asymmetric encryption key - x25519). Used to initiate a secure channel and establish a shared secret through hybrid encryption/verification.
       */
    get peerId() {
        return libsodium_wrappers_1.default.to_hex(this.securePeerKeySet.boxKeyPair.publicKey);
    }
    /**
       *
       * @param peerId Destination Peer ID to initiate a new secure channel with. This public box key is used in the hybrid encryption/verification handshake to establish a shared secret.
       * @returns a shared secret (to be kept secret :), together with the handshake to send to the other peer in order for him to establish the same shared secret on his side.
       */
    initiateHandshake(peerId) {
        const nonce = libsodium_wrappers_1.default.randombytes_buf(libsodium_wrappers_1.default.crypto_box_NONCEBYTES);
        const sharedSecret = libsodium_wrappers_1.default.crypto_secretstream_xchacha20poly1305_keygen();
        const encSharedSecret = libsodium_wrappers_1.default.crypto_box_easy(sharedSecret, nonce, libsodium_wrappers_1.default.from_hex(peerId), // pubkey
        this.securePeerKeySet.boxKeyPair.privateKey);
        // The initiator signs the handshake message with his private signing key
        const handshakeMessage = {
            sharedSecret: libsodium_wrappers_1.default.to_base64(encSharedSecret),
            nonce: libsodium_wrappers_1.default.to_base64(nonce)
        };
        const signedMessageBytes = libsodium_wrappers_1.default.from_string(JSON.stringify(handshakeMessage));
        const signature = libsodium_wrappers_1.default.crypto_sign_detached(signedMessageBytes, this.securePeerKeySet.signKeyPair.privateKey);
        const handshake = {
            message: libsodium_wrappers_1.default.to_base64(signedMessageBytes),
            publicSignKey: libsodium_wrappers_1.default.to_base64(this.securePeerKeySet.signKeyPair.publicKey),
            signature: libsodium_wrappers_1.default.to_base64(signature)
        };
        return { sharedSecret, handshake };
    }
    /**
       * Established the same shared secret as the sending peerId, using given encrypted handshake message.
       * @param peerId
       * @param handshake
       * @returns the shared secret key
       * @throws Error if anything prevented from establishing shared secret from handshake
       */
    receiveHandshake(peerId, handshake) {
        {
            const signature = libsodium_wrappers_1.default.from_base64(handshake.signature);
            const verified = libsodium_wrappers_1.default.crypto_sign_verify_detached(signature, libsodium_wrappers_1.default.from_base64(handshake.message), libsodium_wrappers_1.default.from_base64(handshake.publicSignKey));
            if (!verified)
                throw Error('Invalid signature!');
        }
        const message = JSON.parse(libsodium_wrappers_1.default.to_string(libsodium_wrappers_1.default.from_base64(handshake.message)));
        const nonce = libsodium_wrappers_1.default.from_base64(message.nonce);
        const sharedSecret = libsodium_wrappers_1.default.from_base64(message.sharedSecret);
        // The receiver uses their private box key to decrypt the shared key
        const sharedKeyBytes = libsodium_wrappers_1.default.crypto_box_open_easy(sharedSecret, nonce, libsodium_wrappers_1.default.from_hex(peerId), this.securePeerKeySet.boxKeyPair.privateKey);
        return sharedKeyBytes;
    }
}
exports.SecurePeerKey = SecurePeerKey;
