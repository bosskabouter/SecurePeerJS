import { SecurePeerKey } from '../src'

describe('SecureKey from seed string', () => {
  const aSeed = 'JuStAsEeD'
  test('should create equal keys from same seed string', async () => {
    const key = await SecurePeerKey.create(aSeed)
    expect(key).toBeDefined()
    const key2 = await SecurePeerKey.create(aSeed)
    expect(key2).toBeDefined()
    expect(key).toEqual(key2)
  })

  test('should create different keys from different seed string', async () => {
    const key = await SecurePeerKey.create(aSeed)
    expect(key).toBeDefined()
    const key2 = await SecurePeerKey.create(aSeed + aSeed)
    expect(key2).toBeDefined()
    expect(key).not.toEqual(key2)
  })
})
