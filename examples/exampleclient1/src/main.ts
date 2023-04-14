import './style.css'
import { setupPeers } from './peers'
import { SecurePeerKey } from 'securepeerkey'
// import { SecurePeerKeyBIP } from 'securepeerjs-bip'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>Vite + TypeScript + SecurePeerJS</h1>
    <div class="card">
      <button id="peer1" type="button"></button>
      <button id="peer2" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  <button id="loadlib">load lib</button>
  </div>
`
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
document.querySelector<HTMLButtonElement>('#loadlib')?.addEventListener('click', () => {
  void Promise.all([
    SecurePeerKey.create(),
    SecurePeerKey.create()]).then(async ([key1, key2]) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await setupPeers(document.querySelector<HTMLButtonElement>('#peer1')!, key1, key2.peerId)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await setupPeers(document.querySelector<HTMLButtonElement>('#peer2')!, key2, key1.peerId)
  })
})
