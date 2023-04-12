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
const SecureChannel_1 = require("./SecureChannel");
const SecurePeerKey_1 = require("./SecurePeerKey");
describe('SecureKey from seed string', () => {
    const justAseedString = 'JuStAsEeD';
    test('should create equal keys from same seed string', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = yield SecurePeerKey_1.SecurePeerKey.create(justAseedString);
        expect(key).toBeDefined();
        const key2 = yield SecurePeerKey_1.SecurePeerKey.create(justAseedString);
        expect(key2).toBeDefined();
        expect(key).toEqual(key2);
    }));
    test('should create different keys from different seed string', () => __awaiter(void 0, void 0, void 0, function* () {
        const key = yield SecurePeerKey_1.SecurePeerKey.create(justAseedString);
        expect(key).toBeDefined();
        const key2 = yield SecurePeerKey_1.SecurePeerKey.create(justAseedString + justAseedString);
        expect(key2).toBeDefined();
        expect(key).not.toEqual(key2);
    }));
});
describe('SecureChannel after valid handshake', () => {
    const message = 'A message Bla blah';
    let secureChannel;
    let sharedSecret;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        const key1 = yield SecurePeerKey_1.SecurePeerKey.create();
        const key2 = yield SecurePeerKey_1.SecurePeerKey.create();
        const handshake = key1.initiateHandshake(key2.peerId);
        sharedSecret = handshake.sharedSecret;
        secureChannel = new SecureChannel_1.SecureChannel(sharedSecret);
        expect(secureChannel).toBeDefined();
    }));
    it('should EncryptedMessage from message', () => __awaiter(void 0, void 0, void 0, function* () {
        const encryptedMessage = secureChannel.encryptMessage(message);
        expect(encryptedMessage).toBeDefined();
        expect(encryptedMessage).toBeDefined();
        expect(encryptedMessage).not.toEqual(message);
    }));
    describe('Decrypt EncryptedMessage', () => {
        let encryptedMessage;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            encryptedMessage = secureChannel.encryptMessage(message);
        }));
        it('should decryptMessage', () => __awaiter(void 0, void 0, void 0, function* () {
            const decryptedMessage = secureChannel.decryptMessage(encryptedMessage);
            expect(decryptedMessage).toBeDefined();
            expect(decryptedMessage).toEqual(message);
        }));
        it('should reject: tempered shared secret', () => __awaiter(void 0, void 0, void 0, function* () {
            const secureChannel2 = new SecureChannel_1.SecureChannel(new Uint8Array(Array.from(sharedSecret).reverse()));
            yield expect(() => __awaiter(void 0, void 0, void 0, function* () { return secureChannel2.decryptMessage(encryptedMessage); })).rejects.toThrow(/wrong secret key for the given ciphertext/);
        }));
    });
});
describe('Handshake', () => {
    let sender;
    let receiver;
    let scSender;
    let scReceiver;
    let initiated;
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        sender = yield SecurePeerKey_1.SecurePeerKey.create();
        receiver = yield SecurePeerKey_1.SecurePeerKey.create();
        expect(sender).toBeDefined();
        expect(receiver).toBeDefined();
        initiated = sender.initiateHandshake(receiver.peerId);
        expect(initiated).toBeDefined();
        scSender = new SecureChannel_1.SecureChannel(initiated.sharedSecret);
        expect(scSender).toBeDefined();
        const sharedSecret = receiver.receiveHandshake(sender.peerId, initiated.handshake);
        expect(sharedSecret).toBeDefined();
        scReceiver = new SecureChannel_1.SecureChannel(sharedSecret);
        expect(scReceiver).toBeDefined();
    }));
    test('should share Secret', () => {
        const sharedSecret = receiver.receiveHandshake(sender.peerId, initiated.handshake);
        expect(sharedSecret).toEqual(initiated.sharedSecret);
        const decrypted = new SecureChannel_1.SecureChannel(initiated.sharedSecret).decryptMessage(new SecureChannel_1.SecureChannel(sharedSecret).encryptMessage('Hello'));
        expect(decrypted).toEqual('Hello');
    });
    describe('Should Reject:', () => {
        let fakeKey;
        let fakeHandshake;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            fakeKey = yield SecurePeerKey_1.SecurePeerKey.create();
            fakeHandshake = fakeKey.initiateHandshake(receiver.peerId);
        }));
        test('tempered Signature', () => {
            initiated.handshake.signature = fakeHandshake.handshake.signature;
            void expect(() => __awaiter(void 0, void 0, void 0, function* () {
                return receiver.receiveHandshake(sender.peerId, initiated.handshake);
            })).rejects.toThrow(/Invalid signature/);
        });
        test('tempered public SignKey', () => __awaiter(void 0, void 0, void 0, function* () {
            initiated.handshake.publicSignKey = fakeHandshake.handshake.publicSignKey;
            yield expect(() => __awaiter(void 0, void 0, void 0, function* () {
                return receiver.receiveHandshake(sender.peerId, initiated.handshake);
            })).rejects.toThrow(/Invalid signature/);
        }));
        test('tempered messageBytes', () => __awaiter(void 0, void 0, void 0, function* () {
            initiated.handshake.message = fakeHandshake.handshake.message;
            yield expect(() => __awaiter(void 0, void 0, void 0, function* () {
                return receiver.receiveHandshake(sender.peerId, initiated.handshake);
            })).rejects.toThrow(/Invalid signature/);
        }));
        test('tempered public peerId', () => __awaiter(void 0, void 0, void 0, function* () {
            const fakePubId = fakeKey.peerId;
            yield expect(() => __awaiter(void 0, void 0, void 0, function* () { return receiver.receiveHandshake(fakePubId, initiated.handshake); })).rejects.toThrow(/incorrect key pair for the given ciphertext/);
        }));
        test('tempered everything', () => __awaiter(void 0, void 0, void 0, function* () {
            yield expect(() => __awaiter(void 0, void 0, void 0, function* () {
                return receiver.receiveHandshake(sender.peerId, fakeHandshake.handshake);
            })).rejects.toThrow(/incorrect key pair for the given ciphertext/);
        }));
    });
});
