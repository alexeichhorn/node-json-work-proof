const assert = require('assert')
const JWP = require('../')

describe('Array', function() {
    describe('#indexOf()', function() {
        it('should return -1 when the value is not present', function() {
        assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});


describe('JWP', function() {

    describe('test single', function() {
        this.timeout(20*1000) // 20 sec

        it('single generation', function() {
            const jwp = new JWP(20)
            const token = jwp.generate({ 'hello': 'world' })
            console.log(token)
        })
    })


    describe('generate and check', function() {

    })


    describe('expiration check', function() {

    })


    describe('difficulty check', function() {

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