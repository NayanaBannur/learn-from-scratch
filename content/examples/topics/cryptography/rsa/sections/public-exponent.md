Now choose the **public exponent** $e$: any value with $1 < e < \varphi(n)$ that shares no common factor with $\varphi(n)$. We take $e = 17$.

Together with the modulus, this forms the **public key** — the pair $(e, n) = (17,\ 3233)$ — which is published for the world to use. [[cite:rsa78]]

Encrypting will mean raising a message to the power $e$. Anyone can do it, because both numbers are public.
