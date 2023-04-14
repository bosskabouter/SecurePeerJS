import { useEffect, useState } from 'react'
import { SecurePeer } from 'securepeerjs'
// import { Buffer } from 'buffer'
import { SecurePeerKey } from 'securepeerkey'
// import { SecurePeerKeyBip } from 'securepeerkey-bip'
function Peers (): JSX.Element {
  const [peerKeys, setPeerKeys] = useState<SecurePeerKey[]>()

  useEffect(() => {
    void (async () => {
      const key1 = await SecurePeerKey.create('MySimpleSeed123')
      const key2 = await SecurePeerKey.create() // ('peace chat focus cactus mirror push open health puppy muscle pencil nephew')
      // console.info(key2.mnemonic)
      console.info('Keys', key1, key2)
      setPeerKeys([key1, key2])
    })()
  }, [])

  return (
    <div>
      {peerKeys !== undefined && (
        <div>
          <div>
            <Peertje peerKey={peerKeys[0]} otherPeerId={peerKeys[1].peerId} />
          </div>
          <div>
            <Peertje peerKey={peerKeys[1]} otherPeerId={peerKeys[0].peerId} />
          </div>
        </div>
      )}
    </div>
  )
}

function Peertje ({
  peerKey,
  otherPeerId
}: {
  peerKey: SecurePeerKey
  otherPeerId: string
}): JSX.Element {
  const normalPeer = new SecurePeer(peerKey)
  console.info(normalPeer)
  //  const securePeer = new SecurePeer(peerKey)
  // securePeer.connectSecurely(otherPeerId)
  return (
    <div>
      {normalPeer.id} - {normalPeer.disconnected}
    </div>
  )
}
export default Peers
