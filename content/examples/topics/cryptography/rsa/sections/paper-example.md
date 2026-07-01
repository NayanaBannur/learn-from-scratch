The original 1978 paper demonstrated RSA on its own small key: $p = 47$, $q = 59$, giving $n = 2773$ and $\varphi(n) = 46 \times 58 = 2668$. [[cite:rsa78]]

It chose $e = 17$, which makes the private exponent $d = 157$ — and indeed $ed = 17 \times 157 = 2669$, one more than $\varphi$. [[cite:rsa78]]

The message was the phrase **"ITS ALL GREEK TO ME"**, encoded two letters at a time. Its first block, $920$, makes the full round trip: [[cite:rsa78]]

$$920^{17} \bmod 2773 = 948, \qquad 948^{157} \bmod 2773 = 920.$$
