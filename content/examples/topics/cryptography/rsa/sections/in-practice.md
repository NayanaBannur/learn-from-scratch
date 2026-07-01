Real deployments add layers the bare algorithm leaves out.

- **Padding.** Encrypting a raw message with textbook RSA is insecure; standards such as PKCS #1 wrap the message in structured random padding (OAEP) before the exponentiation. [[cite:rfc8017]]
- **Key size.** Moduli are at least 2048 bits today, with 3072 recommended where protection must last decades. [[cite:nist]]
- **Hybrid encryption.** RSA is slow on bulk data, so it usually encrypts only a short random key, which a fast symmetric cipher then uses for the actual payload.

The upshot: RSA rarely encrypts the message itself. It guards the key that does.
