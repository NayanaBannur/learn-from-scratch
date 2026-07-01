Key generation starts with two large prime numbers, $p$ and $q$, chosen at random and kept secret.

Multiply them to get the **modulus** $n = pq$. This $n$ is made public — it is part of both keys — yet because factoring is hard, no one can pull $p$ and $q$ back out of it. [[cite:rsa78]]

In a real key, $p$ and $q$ each run to hundreds of digits. To follow the mechanism we will use tiny ones throughout: $p = 61$, $q = 53$, giving $n = 3233$.
