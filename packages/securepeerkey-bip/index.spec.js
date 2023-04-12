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
const _1 = require(".");
const VALID_MNEMONIC = 'plastic seed stadium payment arrange inherit risk spend suspect alone debris very';
const INVALID_MNEMONIC = 'iehdej cldkcl cmmceed cckdc okdc ckm risk spend suspect alone debris very';
describe('BIP Key', () => {
    test('should have valid new key', () => __awaiter(void 0, void 0, void 0, function* () {
        const securePeerKeyBip = yield _1.SecurePeerKeyBip.createBipKey();
        testValidKey(securePeerKeyBip);
        expect(securePeerKeyBip).not.toEqual(_1.SecurePeerKeyBip.createBipKey());
    }));
    test('should restore', () => __awaiter(void 0, void 0, void 0, function* () {
        const SecureChannelKeyBU1 = yield _1.SecurePeerKeyBip.createBipKey(VALID_MNEMONIC);
        const SecureChannelKeyBU2 = yield _1.SecurePeerKeyBip.createBipKey(VALID_MNEMONIC);
        testValidKey(SecureChannelKeyBU1);
        expect(SecureChannelKeyBU1).toEqual(SecureChannelKeyBU2);
        expect(SecureChannelKeyBU1.peerId).toEqual(SecureChannelKeyBU2.peerId);
        expect(SecureChannelKeyBU1.masterKey).toEqual(SecureChannelKeyBU2.masterKey);
        expect(SecureChannelKeyBU1.securePeerKeySet.signKeyPair).toEqual(SecureChannelKeyBU2.securePeerKeySet.signKeyPair);
    }));
    test('Entered wrong mnemonic', () => __awaiter(void 0, void 0, void 0, function* () {
        yield expect(() => __awaiter(void 0, void 0, void 0, function* () {
            yield _1.SecurePeerKeyBip.createBipKey(INVALID_MNEMONIC);
        })).rejects.toThrow('Invalid mnemonic');
    }));
});
function testValidKey(secureChannelKey) {
    if (secureChannelKey == null)
        expect(secureChannelKey).toBeDefined();
    else {
        expect(secureChannelKey.mnemonic).toBeDefined();
        expect(secureChannelKey.mnemonic.split(' ').length).toBe(12);
        expect(secureChannelKey.peerId).toBeDefined();
        expect(secureChannelKey.securePeerKeySet.signKeyPair).toBeDefined();
        expect(secureChannelKey.masterKey).toBeDefined();
    }
}
