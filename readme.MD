# SecurePeerJS - extend PeerJS with encryption

SecurePeerJS is an extension to PeerJS (server and client) and adds a layer of hybrid security through encryption and signature verification.

## securepeerjs - client (extends peerjs)

A securepeerjs adds a security layer to peerjs connect and send data methods by initiating new connections with a hybrid security handshake to establish a shared secret used in further encrypted data communication.

## securepeer - server (extends peer)

A securepeer server will behave in the exact same way as a securepeerjs client by exchanging the same handshake when peers try to connect. This allows peers to securily verify the identity of the server and guarantee their own identity on the network.

### Hybrid handshake

SecurePeers can connect to any peer server, but in case it connects to a SecurePeerServer it will verify the identity of the server (and vice versa) in the same way as SecurePeers connect with each other.

The public exponent of a encryption key pair is base64 encoded and published as the public id of the participant in the secure network.


1. with other peers to ensure identity verification and encrypted datacommuniction
2. when connecting to the signaling server. Both layers are optional.

Every participant owns:

    1. sodium.crypto_box_keypair (from seed?)
    2. sodium.crypto_sign_keypair (from seed?)
    3. (optional) bip32.hd_key (from mnemonic?)

## Peer ID
The public exponent of the signature key pair is base64 encoded and registered as ID of the peer when registering to the signaling peer server, so peers contact each other through this ID. 

When  with the public signing key encoded as base64.  
