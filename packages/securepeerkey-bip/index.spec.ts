import { SecurePeerKeyBip } from '.'

const VALID_MNEMONIC =
  'plastic seed stadium payment arrange inherit risk spend suspect alone debris very'
const INVALID_MNEMONIC =
  'iehdej cldkcl cmmceed cckdc okdc ckm risk spend suspect alone debris very'

describe('BIP Key', () => {
  test('should have valid new key', async () => {
    const securePeerKeyBip = await SecurePeerKeyBip.createBipKey()
    testValidKey(securePeerKeyBip)
    expect(securePeerKeyBip).not.toEqual(
      SecurePeerKeyBip.createBipKey()
    )
  })

  test('should restore', async () => {
    const SecureChannelKeyBU1 = await SecurePeerKeyBip.createBipKey(
      VALID_MNEMONIC
    )
    const SecureChannelKeyBU2 = await SecurePeerKeyBip.createBipKey(
      VALID_MNEMONIC
    )
    testValidKey(SecureChannelKeyBU1)
    expect(SecureChannelKeyBU1).toEqual(SecureChannelKeyBU2)
    expect(SecureChannelKeyBU1.peerId).toEqual(
      SecureChannelKeyBU2.peerId
    )
    expect(SecureChannelKeyBU1.masterKey).toEqual(
      SecureChannelKeyBU2.masterKey
    )
    expect(SecureChannelKeyBU1.securePeerKeySet.signKeyPair).toEqual(
      SecureChannelKeyBU2.securePeerKeySet.signKeyPair
    )
  })

  test('Entered wrong mnemonic', async () => {
    await expect(async () => {
      await SecurePeerKeyBip.createBipKey(INVALID_MNEMONIC)
    }).rejects.toThrow('Invalid mnemonic')
  })
})

function testValidKey (secureChannelKey: SecurePeerKeyBip | null): void {
  if (secureChannelKey == null) expect(secureChannelKey).toBeDefined()
  else {
    expect(secureChannelKey.mnemonic).toBeDefined()
    expect(secureChannelKey.mnemonic.split(' ').length).toBe(12)
    expect(secureChannelKey.peerId).toBeDefined()
    expect(secureChannelKey.securePeerKeySet.signKeyPair).toBeDefined()
    expect(secureChannelKey.masterKey).toBeDefined()
  }
}
