import { useEffect, useState } from 'react'
import {
  SecureCommunicationKey
  , SecurePeer
} from 'securepeerjs'

import TEST_CONFIG from '../../example-config.json'
import { type Peer } from 'peerjs'

function Peers (): JSX.Element {
  const [key1, setKey1] = useState<SecureCommunicationKey>()
  const [key2, setKey2] = useState<SecureCommunicationKey>()

  useEffect(() => {
    if (key1 === undefined) void SecureCommunicationKey.create().then(setKey1)
    if (key2 === undefined) void SecureCommunicationKey.create().then(setKey2)
  }, [])

  return (
    <div>
      {key1 !== undefined && key2 !== undefined && (
        <div>
          <div>
            <PeerInstance secureKey={key1}/>
          </div>
          <div>
            <PeerInstance secureKey={key2} otherPeerId={key1.peerId}/>
          </div>
        </div>
      )}
    </div>
  )
}

function PeerInstance ({
  secureKey, otherPeerId
}: {
  secureKey: SecureCommunicationKey
  otherPeerId?: string
}): JSX.Element {
  const [securePeer, setSecurePeer] = useState<Peer>()

  const [online, setOnline] = useState<string>()

  useEffect(() => {
    const peer = new SecurePeer(
      secureKey,
      {
        host: 'localhost',
        port: TEST_CONFIG.testConfig.server.port + 1,
        path: '/', // TEST_CONFIG.testConfig.server.SEC_PEER_CTX,
        debug: 3,
        secure: false,
        key: 'securepeerjs'
        //,
        // referrerPolicy: 'unsafe-url'
        // logFunction: console.info

      }
      //, TEST_CONFIG.testConfig.server.publicKey
      // , otherPeerId
    )

    peer.on('open', setOnline)
    peer.on('error', (e) => { console.error(e) })
    setSecurePeer(peer)
    return () => {
      peer.disconnect()
      peer.destroy()
    }
  }, [secureKey, securePeer?.disconnected])

  return (
    <div>
      {securePeer?.id} - {online !== undefined ? '🟢' : '🟥'} {online}
    </div>
  )
}
export default Peers
