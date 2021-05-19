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

        it('difficulty: default (20),  count: 5', async function() {
            generateAndCheck(new JWP(), 5)
        })
        it('difficulty: 22,  count: 2', async function() {
            generateAndCheck(new JWP(22), 2)
        })
        it('difficulty: 18,  count: 5', async function() {
            generateAndCheck(new JWP(18), 5)
        })
        it('difficulty: 15,  count: 10', async function() {
            generateAndCheck(new JWP(15), 10)
        })
        it('difficulty: 5,  count: 10', async function() {
            generateAndCheck(new JWP(5), 10)
        })
        it('difficulty: 15,   salt length: 100,  count: 5', async function() {
            generateAndCheck(new JWP(15, 100), 5)
        })
    })


    describe('expiration check', function() {
        this.timeout(60*1000) // 1 min
        
        it('check if DateRanges work', async function() {
            const jwp = new JWP(20)

            const stamp1 = "eyJ0eXAiOiJKV1AiLCJhbGciOiJTSEEyNTYiLCJkaWYiOjIwfQ.eyJleHAiOjE2MTY4NTA1NzAuNjU1MTQ3MSwiaGVsbG8iOiJ3b3JsZCJ9.VE6YYxIQ46lPzxyNuRYAmAMkEM"
            let d = jwp.decode(stamp1, true, JWP.DateRange.unlimited)
            assert.strictEqual(d.constructor, Object) // is dict
            assert.strictEqual(d.hello, 'world') // in body
            d = jwp.decode(stamp1, true, JWP.DateRange.startUntil(new Date(1616850383000), 5*60*1000))
            assert.strictEqual(d.constructor, Object)
            assert.strictEqual(d.hello, 'world')
            assert.throws(function() { jwp.decode(stamp1) }, JWP.ExpiredError)
        })

        it('check if DateRanges work with second stamp', async function() {
            const jwp = new JWP(20)

            const stamp2 = "eyJ0eXAiOiJKV1AiLCJhbGciOiJTSEEyNTYiLCJkaWYiOjIwfQ.eyJoZWxsbyI6IndvcmxkIn0.LCYdFqTlHkox8chJLRoPpQB5wC"
            d = jwp.decode(stamp2, true, JWP.DateRange.unlimited)
            assert.strictEqual(d.constructor, Object)
            assert.strictEqual(d.hello, 'world')
            assert.throws(function() { jwp.decode(stamp2) }, JWP.ExpiredError)
            assert.throws(function() { jwp.decode(stamp2, true, JWP.DateRange.durationTo(1000000000, new Date())) }, JWP.ExpiredError)
            d = jwp.decode(stamp2, true, new JWP.DateRange(null, new Date()))
            assert.strictEqual(d.constructor, Object)
            assert.strictEqual(d.hello, 'world')
        })
    })


    describe('difficulty check', function() {
        this.timeout(60*1000) // 1 min

        it('check if difficulty gets checked correctly', async function() {
            const hardJWP = new JWP(20)
            const easyJWP = new JWP(15)

            const hardStamp = "eyJ0eXAiOiJKV1AiLCJhbGciOiJTSEEyNTYiLCJkaWYiOjIwfQ.eyJleHAiOjE2MTY4NTA1NzAuNjU1MTQ3MSwiaGVsbG8iOiJ3b3JsZCJ9.VE6YYxIQ46lPzxyNuRYAmAMkEM"
            const easyStamp = "eyJ0eXAiOiJKV1AiLCJhbGciOiJTSEEyNTYiLCJkaWYiOjE1fQ.eyJoZWxsbyI6IndvcmxkIiwiZXhwIjoxNjE2ODUxODcyLjUyOTQwNDJ9.Rg1tRi9JUkw1Ls9WotkuaAFzs"

            let d = hardJWP.decode(hardStamp, true, JWP.DateRange.unlimited)
            assert.strictEqual(d.constructor, Object)
            assert.strictEqual(d.hello, 'world')
            assert.throws(function() { hardJWP.decode(easyStamp, true, JWP.DateRange.unlimited) }, JWP.InvalidProofError)

            d = easyJWP.decode(hardStamp, true, JWP.DateRange.unlimited)
            assert.strictEqual(d.constructor, Object)
            assert.strictEqual(d.hello, 'world')
            d = easyJWP.decode(easyStamp, true, JWP.DateRange.unlimited)
            assert.strictEqual(d.constructor, Object)
            assert.strictEqual(d.hello, 'world')
        })
    })


    describe('invalid proof check', function() {
        const jwp = new JWP()

        it('check valid stamp', function() {
            const validStamp = "eyJ0eXAiOiJKV1AiLCJhbGciOiJTSEEyNTYiLCJkaWYiOjIwfQ.eyJleHAiOjE2MTY4NTA1NzAuNjU1MTQ3MSwiaGVsbG8iOiJ3b3JsZCJ9.VE6YYxIQ46lPzxyNuRYAmAMkEM"
            let d = jwp.decode(validStamp, true, JWP.DateRange.unlimited)
            assert.strictEqual(d.constructor, Object)
            assert.strictEqual(d.hello, 'world')
        })

        it('check invalid stamp', function() {
            const invalidStamp = "eyJ0eXAiOiJKV1AiLCJhbGciOiJTSEEyNTYiLCJkaWYiOjIwfQ.eyJleHAiOjE2MTY4NTA1NzAuNjU1MTQ3MSwiaGVsbG8iOiJ3b3JsZCJ9.VE6YYxIQ46lPzxyNuRYAmAMkEC"
            let d = jwp.decode(invalidStamp, false) // without verification
            assert.strictEqual(d.constructor, Object)
            assert.strictEqual(d.hello, 'world')

            assert.throws(function() { jwp.decode(invalidStamp, true, JWP.DateRange.unlimited) }, JWP.InvalidProofError)
        })
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