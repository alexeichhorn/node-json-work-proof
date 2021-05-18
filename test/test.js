const assert = require('assert')
const JWP = require('../')


async function generateAndCheck(jwp, count = 10) {
    for (var i = 0; i < count; i++) {
        const claims = { 'hello': 'world', 'randomNumber': Math.random() * 10000000 }
        const stamp = await jwp.generate(claims)
        //console.log(stamp)

        const decodedClaims = jwp.decode(stamp)

        assert.strictEqual(claims['hello'], decodedClaims['hello'])
        assert.strictEqual(claims['randomNumber'], decodedClaims['randomNumber'])
    }
}


describe('JWP', function() {

    describe('test single', function() {
        this.timeout(20*1000) // 20 sec

        it('single generation', function(done) {
            const jwp = new JWP(20)
            jwp.generate({ 'hello': 'world' }).then( token => {
                console.log(token)
                done()
            })            
        })
    })


    describe('generate and check', function() {
        this.timeout(3*60*1000) // 3 min

        it('repeated generation and checking with random content', async function() {
            generateAndCheck(new JWP(), 5)
        })
    })


    describe('expiration check', function() {
        this.timeout(60*1000) // 1 min
        
        /*it('check if DateRanges work', function() {
            //
        })*/
    })


    describe('difficulty check', function() {
        this.timeout(60*1000) // 1 min

        it('check if difficulty gets checked correctly', async function() {
            const hardJWP = new JWP(20)
            const easyJWP = new JWP(15)

            const hardStamp = "eyJ0eXAiOiJKV1AiLCJhbGciOiJTSEEyNTYiLCJkaWYiOjIwfQ.eyJleHAiOjE2MTY4NTA1NzAuNjU1MTQ3MSwiaGVsbG8iOiJ3b3JsZCJ9.VE6YYxIQ46lPzxyNuRYAmAMkEM"
            const easyStamp = "eyJ0eXAiOiJKV1AiLCJhbGciOiJTSEEyNTYiLCJkaWYiOjE1fQ.eyJoZWxsbyI6IndvcmxkIiwiZXhwIjoxNjE2ODUxODcyLjUyOTQwNDJ9.Rg1tRi9JUkw1Ls9WotkuaAFzs"

            let d = await hardJWP.decode(hardStamp)
            assert.strictEqual(d.constructor, Object)
            assert.throws(function() { hardJWP.decode(easyStamp) }, JWP.InvalidProofError)

            d = await easyJWP.decode(hardStamp)
            assert.strictEqual(d.constructor, Object)
            d = await easyJWP.decode(easyStamp)
            assert.strictEqual(d.constructor, Object)
        })
    })


    describe('invalid proof check', function() {

    })


    describe('zero bit count', function() {
        const jwp = new JWP()
        it('leading zero bit count evaluation', function() {
            assert.strictEqual(jwp._leadingZeroBitCount(0b10000000), 0)
            assert.strictEqual(jwp._leadingZeroBitCount(0b01000000), 1)
            assert.strictEqual(jwp._leadingZeroBitCount(0b00100000), 2)
            assert.strictEqual(jwp._leadingZeroBitCount(0b00010000), 3)
            assert.strictEqual(jwp._leadingZeroBitCount(0b00001000), 4)
            assert.strictEqual(jwp._leadingZeroBitCount(0b00000100), 5)
            assert.strictEqual(jwp._leadingZeroBitCount(0b00000010), 6)
            assert.strictEqual(jwp._leadingZeroBitCount(0b00000001), 7)
            assert.strictEqual(jwp._leadingZeroBitCount(0), 8)
        })
    })

})