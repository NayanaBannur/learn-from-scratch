The same machinery runs in reverse to **sign** a message, proving it came from you.

Rather than encrypting with the public key, you apply your **private** key first, $S = M^d \bmod n$. Anyone can then undo it with your public key, recovering $M = S^e \bmod n$. [[cite:rsa78]]

Only the holder of $d$ could have produced an $S$ that unwraps to a sensible $M$, so a valid signature is proof of authorship. Encryption keeps a message secret; a signature vouches for who wrote it.
