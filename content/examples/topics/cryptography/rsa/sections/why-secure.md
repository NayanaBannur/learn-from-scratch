An attacker sees the public key $(e, n)$ and a ciphertext $C$. To read the message they need $d$ — and computing $d$ needs $\varphi(n) = (p-1)(q-1)$, which needs the factors $p$ and $q$. [[cite:rsa78]]

So breaking RSA reduces to factoring $n$. With a 2048-bit modulus — roughly 600 decimal digits — no published algorithm can factor it in any practical time. [[cite:nist]]

The security rests entirely on that asymmetry: the modulus is public, while the two primes inside it stay hidden.
