import { BipSecureChannelKey } from '../src'

const VALID_MNEMONIC =
  'plastic seed stadium payment arrange inherit risk spend suspect alone debris very'
const INVALID_MNEMONIC =
  'iehdej cldkcl cmmceed cckdc okdc ckm risk spend suspect alone debris very'

describe('SecureChannelKey', () => {
  describe('create new User', () => {
    it('should have valid new key', async () => {
      const SecureChannelKeyNewUser = await BipSecureChannelKey.createBip32()
      testValidKey(SecureChannelKeyNewUser)
      expect(SecureChannelKeyNewUser).not.toEqual(
        BipSecureChannelKey.createBip32()
      )
    })
  })

  describe('create from Mnemonic Backup', () => {
    it('should restore', async () => {
      const SecureChannelKeyBU1 = await BipSecureChannelKey.createBip32(
        VALID_MNEMONIC
      )
      const SecureChannelKeyBU2 = await BipSecureChannelKey.createBip32(
        VALID_MNEMONIC
      )
      testValidKey(SecureChannelKeyBU1)
      expect(SecureChannelKeyBU1).toEqual(SecureChannelKeyBU2)
      expect(SecureChannelKeyBU1.getPeerId()).toEqual(
        SecureChannelKeyBU2.getPeerId()
      )
      expect(SecureChannelKeyBU1.masterKey).toEqual(
        SecureChannelKeyBU2.masterKey
      )
      expect(SecureChannelKeyBU1.signKeyPair).toEqual(
        SecureChannelKeyBU2.signKeyPair
      )
    })
  })

  it('Entered wrong mnemonic', async () => {
    await expect(async () => {
      await BipSecureChannelKey.createBip32(INVALID_MNEMONIC)
    }).rejects.toThrow('Invalid mnemonic')
  })
})

function testValidKey (secureChannelKey: BipSecureChannelKey | null): void {
  if (secureChannelKey == null) expect(secureChannelKey).toBeDefined()
  else {
    expect(secureChannelKey.mnemonic).toBeDefined()
    expect(secureChannelKey.getPeerId()).toBeDefined()
    expect(secureChannelKey.signKeyPair).toBeDefined()
    expect(secureChannelKey.masterKey).toBeDefined()
  }
}
