import sodium from 'libsodium-wrappers'

export interface EncryptedMessage {
  nonceBase64: string
  cipherTextBase64: string
}

export class SecureChannel {
  /**
   *
   * @param sharedSecret
   */
  constructor (private readonly sharedSecret: Uint8Array) {}

  async encryptMessage (message: string): Promise<EncryptedMessage> {
    await sodium.ready

    // Generate a new random nonce for each message
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)

    // Encrypt the message with the shared secret and nonce
    const messageBytes = sodium.from_string(message)
    const cipherText = sodium.crypto_secretbox_easy(
      messageBytes,
      nonce,
      this.sharedSecret
    )

    const encryptedMessage: EncryptedMessage = {
      nonceBase64: sodium.to_base64(nonce),
      cipherTextBase64: sodium.to_base64(cipherText)
    }

    return encryptedMessage
  }

  async decryptMessage (encryptedMessage: EncryptedMessage): Promise<string> {
    await sodium.ready

    // Decrypt the message with the shared secret and nonce
    const nonce = sodium.from_base64(encryptedMessage.nonceBase64)
    const cipherText = sodium.from_base64(encryptedMessage.cipherTextBase64)

    const decryptedBytes = sodium.crypto_secretbox_open_easy(
      cipherText,
      nonce,
      this.sharedSecret
    )

    const decryptedMessage = sodium.to_string(decryptedBytes)
    return decryptedMessage
  }
}

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

/**
 * A class that represents a key pair used for secure communication between two peers.
 */
export class SecurePeerKey {
  /**
   *
   * @param seed value to derive the key from
   * @returns Instance of the SecureChannelKey class
   */
  public static async create (seed?: Uint8Array): Promise<SecurePeerKey> {
    await sodium.ready

    const signKeyPair = (seed != null)
      ? sodium.crypto_sign_seed_keypair(seed)
      : sodium.crypto_sign_keypair()
    const boxKeyPair = (seed != null)
      ? sodium.crypto_box_seed_keypair(seed)
      : sodium.crypto_box_keypair()

    return new this(signKeyPair, boxKeyPair)
  }

  /**
   * @see create to initialize key
   * @param signKeyPair
   * @param boxKeyPair
   */
  protected constructor (
    public signKeyPair: sodium.KeyPair,
    public boxKeyPair: sodium.KeyPair
  ) {}

  /**
   * @returns Public identifier of this peer, based on the base64 value of public box key (asymmetric encryption key - x25519). Used to initiate a secure channel and establish a shared secret through hybrid encryption/verification.
   */
  getPeerId (): string {
    return sodium.to_base64(this.boxKeyPair.publicKey)
  }

  /**
   *
   * @param peerId Destination Peer ID to initiate a new secure channel with. This public box key is used in the hybrid encryption/verification handshake to establish a shared secret.
   * @returns a shared secret (to be kept secret :), together with the handshake to send to the other peer in order for him to establish the same shared secret on his side.
   */
  async initiateHandshake (
    peerId: string
  ): Promise<{ sharedSecret: Uint8Array, handshake: Handshake }> {
    await sodium.ready

    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)
    const sharedSecret = sodium.crypto_secretstream_xchacha20poly1305_keygen()
    const encryptedSharedSecret = sodium.crypto_box_easy(
      sharedSecret,
      nonce,
      sodium.from_base64(peerId), // pubkey
      this.boxKeyPair.privateKey
    )

    // The initiator signs the handshake message with his private signing key
    const signingMessage: HandshakeMessage = {
      sharedSecret: sodium.to_base64(encryptedSharedSecret),
      nonce: sodium.to_base64(nonce)
    }

    const signedMessageBytes = sodium.from_string(
      JSON.stringify(signingMessage)
    )

    const signature = sodium.crypto_sign_detached(
      signedMessageBytes,
      this.signKeyPair.privateKey
    )

    const handshake: Handshake = {
      message: sodium.to_base64(signedMessageBytes),
      publicSignKey: sodium.to_base64(this.signKeyPair.publicKey),
      signature: sodium.to_base64(signature)
    }
    return { sharedSecret, handshake }
  }

  /**
   * Established the same shared secret as the sending peerId, using given encrypted handshake message.
   * @param peerId
   * @param handshake
   * @returns the shared secret key
   */
  async receiveHandshake (
    peerId: string,
    handshake: Handshake
  ): Promise<Uint8Array> {
    await sodium.ready
    {
      const receivedSignature = sodium.from_base64(handshake.signature)
      const verified = sodium.crypto_sign_verify_detached(
        receivedSignature,
        sodium.from_base64(handshake.message),
        sodium.from_base64(handshake.publicSignKey)
      )

      if (!verified) {
        throw Error('Invalid signature!')
      }
    }

    const receivedMessage: HandshakeMessage = JSON.parse(
      sodium.to_string(sodium.from_base64(handshake.message))
    )

    const receivedNonce = sodium.from_base64(receivedMessage.nonce)
    const receivedEncryptedKey = sodium.from_base64(receivedMessage.sharedSecret)

    // The receiver uses their private box key to decrypt the shared key
    const sharedKeyBytes = sodium.crypto_box_open_easy(
      receivedEncryptedKey,
      receivedNonce,
      sodium.from_base64(peerId),
      this.boxKeyPair.privateKey
    )
    return sharedKeyBytes
  }
}
