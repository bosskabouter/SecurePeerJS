import * as bip39 from 'bip39'
import * as bip32 from 'bip32'
import * as ecc from 'tiny-secp256k1'
import { SecureCommunicationKey } from 'secure-communication-kit'

const KEY_STRENGTH_B = 128

export class SecurePeerKeyBip extends SecureCommunicationKey {
  /**
   *
   * @param mnemonic
   * @returns
   */
  public static override async create (
    mnemonic?: string
  ): Promise<SecurePeerKeyBip> {
    if (mnemonic == null) { mnemonic = bip39.generateMnemonic(KEY_STRENGTH_B) } else if (!bip39.validateMnemonic(mnemonic)) { throw Error('Invalid mnemonic backup value: ' + mnemonic) }
    const seedBuf = bip39.mnemonicToSeedSync(mnemonic)
    const entropy = bip39.mnemonicToEntropy(mnemonic)

    const normalKey = (await SecureCommunicationKey.create(entropy))
    const masterKey = bip32.BIP32Factory(ecc).fromSeed(seedBuf)

    return new this(
      mnemonic,
      masterKey,
      normalKey
    )
  }

  /**
   * @see create to initialize key
   * @param mnemonic the bip39 key phrase the keys are built upon
   * @param masterKey
   * @param signKeyPair
   * @param boxKeyPair
   */
  private constructor (
    public readonly mnemonic: string,
    public masterKey: bip32.BIP32Interface,
    securePeerKey: SecureCommunicationKey
  ) {
    super(securePeerKey.keySet)
  }
}
