import { SecurePeer } from 'securepeerjs'
import { type SecurePeerKey } from 'securepeerkey'
import { type SecureLayer } from 'securepeerjs'

const SERVER_PUB_ID = '076d121e9c1b8d8b6478414804806365af8a1bee8cfb4058959a8ce209054a46'

export async function setupPeers (element: HTMLButtonElement, key: SecurePeerKey, otherPeerId: string): Promise<any> {
  let counter = 0
  let isSecure: boolean
  let secureLayer: SecureLayer | undefined

  let decrypted: string | null = null

  const securePeer = new SecurePeer(key, {
    host: document.location.hostname,
    path: '/',
    port: 9000,
    debug: 0
  }, SERVER_PUB_ID)
  securePeer.on('open', (id) => {
    console.debug('Peer Connected with ID:', id)
    void securePeer.isServerSecure().then(is => {
      isSecure = is
    }).catch(console.error)
  })
  securePeer.on('connection', (con) => {
    secureLayer = con.metadata.secureLayer as SecureLayer
    secureLayer.on('decrypted', console.info)
    secureLayer.on('decrypted', d => {
      decrypted = d
    })
  })
  const setCounter: (count: number) => void = (count: number) => {
    counter = count
    element.innerHTML = `
    <p>Server Secure: ${isSecure?.toString()}</p>
    <p>Secure Peer ID: ${securePeer.id}</p>
    <p>${securePeer.disconnected ? 'offline' : 'ONLINE'}</p>
     <p>Other peer: ${otherPeerId}</p>
    <p>PEERS ${secureLayer?.dataConnection.open === true ? 'CONNECTED 🔗' : 'DISCONNECTED 🔌'} </p>
    <p>Decrypted: ${decrypted === null ? '' : decrypted}</p>
    <p>count is ${counter}</p>
    `
  }
  element.addEventListener('click', () => {
    setCounter(++counter)

    if (secureLayer?.dataConnection.open === true) {
      secureLayer?.send(`Hello again ${counter}`)
    } else if (secureLayer === undefined) {
      secureLayer = securePeer.connectSecurely(otherPeerId)
      secureLayer.on('decrypted', console.info)
      secureLayer.on('decrypted', d => { decrypted = d })
    }
  })
  setCounter(0)
}
