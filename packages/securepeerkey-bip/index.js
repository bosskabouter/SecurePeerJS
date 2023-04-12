"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.SecurePeerKeyBip = void 0;
const SecurePeerKey_1 = require("securepeerkey/SecurePeerKey");
const bip39 = __importStar(require("bip39"));
const bip32 = __importStar(require("bip32"));
const ecc = __importStar(require("tiny-secp256k1"));
const KEY_STRENGTH_B = 128;
class SecurePeerKeyBip extends SecurePeerKey_1.SecurePeerKey {
    /**
     * @see create to initialize key
     * @param mnemonic the bip39 key phrase the keys are built upon
     * @param masterKey
     * @param signKeyPair
     * @param boxKeyPair
     */
    constructor(mnemonic, masterKey, securePeerKey) {
        super(securePeerKey.securePeerKeySet);
        this.mnemonic = mnemonic;
        this.masterKey = masterKey;
    }
    /**
     *
     * @param mnemonic
     * @returns
     */
    static createBipKey(mnemonic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mnemonic == null) {
                mnemonic = bip39.generateMnemonic(KEY_STRENGTH_B);
            }
            else if (!bip39.validateMnemonic(mnemonic)) {
                throw Error('Invalid mnemonic backup value: ' + mnemonic);
            }
            const seedBuf = bip39.mnemonicToSeedSync(mnemonic);
            const entropy = bip39.mnemonicToEntropy(mnemonic);
            const normalKey = (yield SecurePeerKey_1.SecurePeerKey.create(entropy));
            const masterKey = bip32.BIP32Factory(ecc).fromSeed(seedBuf);
            return new this(mnemonic, masterKey, normalKey);
        });
    }
}
exports.SecurePeerKeyBip = SecurePeerKeyBip;
