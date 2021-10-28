# JSON Work Proof

JSON Work Proof is a proof-of-work algorithm that creates a token after doing some workload. This token contains certain claims defined by you and verifies that you did this work at this time and for these claims.

It packs the security of the Hashcash algorithm *(used for Bitcoin in a similar way)* into a modern JWT-like token.

## Structure of Token

A token looks like this: `eyJ0eXAiOiJKV1AiLCJhbGciOiJTSEEyNTYiLCJkaWYiOjIwfQ.eyJleHAiOjE2MTY4NTA1NzAuNjU1MTQ3MSwiaGVsbG8iOiJ3b3JsZCJ9.VE6YYxIQ46lPzxyNuRYAmAMkEM`. It has the same structure as a JWT token and can therefore also be inspected on the Debugger on [jwt.io](https://jwt.io).
It contains three elements which are each base64url encoded. The header contains the type of the token (JWP), the hash algorithm used for the challenge (currently only SHA256 supported) and the difficulty at which the token was mined. The payload consists of the claims you specified and optionally an expiration date. The last part contains a salt and a big number (named counter in Hashcash). The work needed to generate a token is actually to find this number. It's hard to find this number, but easy to verify it's correct. (Read more about how it works on [Wikipedia](https://en.wikipedia.org/wiki/Hashcash))


## Possible Applications

Can be used to prevent DDOS attacks or as an alternative to rate limiting or captchas. 

E.g. you can use this to prevent brute forcing user logins: The client generates a token with the claims including username and password and sends it along with the login request. The server then first checks if the token is valid before it does any lookup. The scale of bruteforcing can therefore be massively reduced.



## Usage

### General

To generate and validate tokens you need to use a `JWP`-object. On creation you can specify the `difficulty`, which determines how hard the challenge should be. It defaults to `20`, which takes about a second to compute on an average computer. Each increment by one, doubles the difficulty and therefore the time it takes to generate.
```node
const JWP = require('json-work-proof')

const jwp = new JWP() // defaults to difficulty=20
const jwp_harder = JWP(25) // first parameter sets difficulty
```

### Generation

To generate a token, that proves you did work, create a `JWP`-object and call it with your dictionary of claims like this:
```node
const jwp = new JWP()
const token = await jwp.generate({ hello: 'world', count: 88 })
```

**Note:** A token expires 5 minutes after creation on default. You can change this by giving a custom expiration date:
```node
const expiration = new Date(new Date().getTime() + 3600*1000) // 1 hour from now
const token = await jwp.generate(claims, expiration)

const token2 = await jwp.generate(claims, null) // no expiration
```



### Validation

To check if a token is valid for a certain difficulty and to read the claims:
```node
const jwp = new JWP()
try {
  let claims = jwp.decode(token)
} catch (e) {
  if (e instanceof JWP.InvalidFormatError) {
    console.log("The token is formatted incorrectly")
  } else if (e instanceof JWP.InvalidProofError) {
    console.log("The difficulty this token was created at is lower than what is specified in your JWP object")
  } else if (e instanceof JWP.ExpiredError) {
    console.log("The token expiration is too old or too new")
  }
}
```


If you just want to read the claims without verifying the proof and expiration date, you can use this instead:
```node
const claims = jwp.decode(token, false)
```

By default it expects the expiration date to be between now and 30 minutes in the future. You can also specify your own range of valid expiration dates like this:
```node
const claims1 = jwp.decode(token, true, new JWP.DateRange(start_date, end_date)) # must be in [start_date, end_date]
const claims2 = jwp.decode(token, true, JWP.DateRange.fromNow(3600*1000)) # must be in [now(), now()+3600s]
const claims3 = jwp.decode(token, true, JWP.DateRange.unlimited)) # all expirations are accepted
```
