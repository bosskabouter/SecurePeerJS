import sodium from 'libsodium-wrappers'

/**
 * An unencrypted envelope that contains a signed and encrypted HandshakeMessage.
 */
export interface Handshake {
  /**
   * The base64-encoded encrypted HandshakeMessage.
   */
  message: string
  /**
   * The base64-encoded signature of the encrypted HandshakeMessage.
   */
  signature: string
  /**
   * The public signing key of the sender.
   */
  publicSignKey: string
}

/**
 * Key pair used for secure communication between two peers.
 */
export class SecurePeerKey {
  /**
   *
   * @param seed value to derive the key from. Can be a) a Uint8Array with seed for crypto_sign_seed_keypair, b) any string password to  derive the seed value from using crypto_generichash. Caution: this can results in a weak keyset if string doesn't contain enough entropy.
   * @returns Instance of the SecureChannelKey class
   */
  public static async create (
    seed?: Uint8Array | string
  ): Promise<SecurePeerKey> {
    await sodium.ready
    // if seed is just a simple string password, convert it to full 32 byte seed value
    if (typeof seed === 'string') {
      seed = sodium.crypto_generichash(32, seed)
    }
    const signKeyPair =
      seed != null
        ? sodium.crypto_sign_seed_keypair(seed)
        : sodium.crypto_sign_keypair()
    const boxKeyPair =
      seed != null
        ? sodium.crypto_box_seed_keypair(seed)
        : sodium.crypto_box_keypair()

    return new this({ signKeyPair, boxKeyPair })
  }

  /**
   * @see create to initialize key
   */
  protected constructor (readonly securePeerKeySet: SecurePeerKeySet) {}

  /**
   * @returns Public identifier of this peer, based on the base64 value of public box key (asymmetric encryption key - x25519). Used to initiate a secure channel and establish a shared secret through hybrid encryption/verification.
   */
  get peerId (): string {
    return sodium.to_hex(this.securePeerKeySet.boxKeyPair.publicKey)
  }

  /**
   *
   * @param peerId Destination Peer ID to initiate a new secure channel with. This public box key is used in the hybrid encryption/verification handshake to establish a shared secret.
   * @returns a shared secret (to be kept secret :), together with the handshake to send to the other peer in order for him to establish the same shared secret on his side.
   */
  initiateHandshake (peerId: string): {
    sharedSecret: Uint8Array
    handshake: Handshake
  } {
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
    const sharedSecret = sodium.crypto_secretstream_xchacha20poly1305_keygen()
    const encSharedSecret = sodium.crypto_box_easy(
      sharedSecret,
      nonce,
      sodium.from_hex(peerId), // pubkey
      this.securePeerKeySet.boxKeyPair.privateKey
    )

    // The initiator signs the handshake message with his private signing key
    const handshakeMessage: HandshakeMessage = {
      sharedSecret: sodium.to_base64(encSharedSecret),
      nonce: sodium.to_base64(nonce)
    }

    const signedMessageBytes = sodium.from_string(
      JSON.stringify(handshakeMessage)
    )

    const signature = sodium.crypto_sign_detached(
      signedMessageBytes,
      this.securePeerKeySet.signKeyPair.privateKey
    )

    const handshake: Handshake = {
      message: sodium.to_base64(signedMessageBytes),
      publicSignKey: sodium.to_base64(
        this.securePeerKeySet.signKeyPair.publicKey
      ),
      signature: sodium.to_base64(signature)
    }
    return { sharedSecret, handshake }
  }

  /**
   * Established the same shared secret as the sending peerId, using given encrypted handshake message.
   * @param peerId
   * @param handshake
   * @returns the shared secret key
   * @throws Error if anything prevented from establishing shared secret from handshake
   */
  receiveHandshake (peerId: string, handshake: Handshake): Uint8Array {
    {
      const signature = sodium.from_base64(handshake.signature)
      const verified = sodium.crypto_sign_verify_detached(
        signature,
        sodium.from_base64(handshake.message),
        sodium.from_base64(handshake.publicSignKey)
      )
      if (!verified) throw Error('Invalid signature!')
    }

    const message: HandshakeMessage = JSON.parse(
      sodium.to_string(sodium.from_base64(handshake.message))
    )

    const nonce = sodium.from_base64(message.nonce)
    const sharedSecret = sodium.from_base64(message.sharedSecret)

    // The receiver uses their private box key to decrypt the shared key
    const sharedKeyBytes = sodium.crypto_box_open_easy(
      sharedSecret,
      nonce,
      sodium.from_hex(peerId),
      this.securePeerKeySet.boxKeyPair.privateKey
    )
    return sharedKeyBytes
  }
}
/**
 * The key contains an encryption and a signing key, based on the same seed
 */
interface SecurePeerKeySet {
  signKeyPair: sodium.KeyPair
  boxKeyPair: sodium.KeyPair
}

/**
 * A handshake message that is sent between peers during the secure handshake process.
 */
interface HandshakeMessage {
  /**
   * prevent replay attacks.
   */
  nonce: string
  /**
   * A string representing the shared secret key.
   */
  sharedSecret: string
}
