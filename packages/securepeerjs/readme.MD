# SecurePeerJS - PeerJS with hybrid security

## Install SecurePeerJS

``` bash
    npm i securepeerjs
```

## Usage

``` typescript
    // Participants need a SecurePeerKey
    const key = await SecurePeerKey.create('some seed'); 
    const securePeer = new SecurePeer(key);

    securePeer.on('open', () => {
      securePeer.on('connection', (con) => {
        const secureLayer = con.metadata.secureLayer;
        secureLayer.on('decrypted', console.info);
        secureLayer.send('Thanks for your secure message!');
      });
    });

    const somePeerId = (await SecurePeerKey.create()).peerId
    const secureLayer = securePeer.connectSecurely(somePeerId)
    secureLayer.send('Send this securely!')
```

