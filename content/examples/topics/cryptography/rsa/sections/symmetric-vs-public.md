This is a real break from the older style of encryption, where both sides share one secret key. That older style is called **symmetric**; the two-key style is **asymmetric**, or public-key.

| | Shared-secret (symmetric) | Public-key (asymmetric) |
|---|---|---|
| Keys | one secret, both sides hold it | a public + private pair |
| Must meet first? | yes — to share the key | no |
| Who can encrypt | only key-holders | anyone |
| Who can decrypt | any key-holder | only the private-key holder |

The public-key column is what lets strangers communicate securely without ever having met. RSA's job is to build such a key pair.
