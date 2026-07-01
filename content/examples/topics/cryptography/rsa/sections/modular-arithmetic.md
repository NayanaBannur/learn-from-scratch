RSA runs on **modular arithmetic** — arithmetic that wraps around a fixed number, the way a clock wraps at 12.

Write $a \bmod n$ for the remainder when $a$ is divided by $n$. On a 12-hour clock, $15 \bmod 12 = 3$: three hours past noon.

Everything in RSA happens inside this wrapped world of remainders, for one reason we'll build toward: stepping *forward* through it is easy, while stepping *backward* is not.
