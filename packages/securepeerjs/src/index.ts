import { type DataConnection, Peer, type PeerConnectOption, type PeerJSOption } from 'peerjs'
import { SecureChannel, type SecurePeerKey } from 'securepeerkey'

class SecureDataConnection {
  constructor (
    private readonly dataConnection: DataConnection,
    private readonly secureChannel: SecureChannel
  ) {}
}
export class SecurePeer extends Peer {
  constructor (private readonly key: SecurePeerKey, options?: PeerJSOption) {
    super(key.getPeerId())
  }

  // get id(): string {
  //   return this.key.getPeerId();
  // }

  private readonly secrets = new Map<string, Uint8Array>()

  async connectSecurely (peer: string): Promise<SecureDataConnection> {
    const initiateHandshake = await this.key.initiateHandshake(peer)
    this.secrets.set(peer, initiateHandshake.sharedSecret)

    return new SecureDataConnection(
      this.connect(peer),
      new SecureChannel(initiateHandshake.sharedSecret)
    )
  }

  connect (
    peer: string,
    options?: PeerConnectOption | undefined
  ): DataConnection {
    const secret = this.secrets.get(peer)
    if (secret == null) {
      throw Error('no secret to connect with')
    }
    // new SecureChannel(secret).;
    return super.connect(peer, options)
  }
}
