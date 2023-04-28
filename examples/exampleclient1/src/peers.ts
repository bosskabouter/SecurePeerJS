import { type SecureCommunicationKey, SecurePeer, type SecureLayer } from 'securepeerjs'

const SERVER_PUB_ID = '1a00d6e266b861c19179e4ff4f492b7e3ba095d6f0d57100a7dcd40b6a2c6a17'

export async function setupPeers (element: HTMLButtonElement, key: SecureCommunicationKey, otherPeerId: string): Promise<any> {
  let counter = 0
  let isSecure: boolean
  let secureLayer: SecureLayer | undefined

  let decrypted: string | null = null

  const securePeer = new SecurePeer(key, SERVER_PUB_ID, {
    host: document.location.hostname,
    path: '/',
    port: 9001,
    debug: 0
  })
  securePeer.on('open', (_id) => {
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
