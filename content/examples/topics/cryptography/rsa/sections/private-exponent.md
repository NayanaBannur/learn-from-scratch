The **private exponent** $d$ is the number that undoes $e$ inside modular arithmetic — its **modular inverse**:

$$e \cdot d \equiv 1 \pmod{\varphi(n)}.$$

This is the one congruence the whole method rests on. For $e = 17$ and $\varphi = 3120$, the answer is $d = 2753$: indeed $17 \times 2753 = 46801 = 15 \times 3120 + 1$. [[cite:rsa78]]

Finding $d$ requires $\varphi(n)$, which requires $p$ and $q$. That is exactly why only the key's creator can compute $d$ — it is the secret that is never shared.
