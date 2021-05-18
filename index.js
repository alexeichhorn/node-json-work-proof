const base64url = require('base64url')
const crypto = require('crypto')

Date.prototype.toJSON = function(){
    return Math.floor(this.getTime() / 1000)
}

class JWP {
    
    static InvalidFormatError = class InvalidProofError extends Error {
        constructor(message) {
            super(message)
            this.name = "JWP.InvalidFormat"
        }
    }
    
    static InvalidProofError = class InvalidProofError extends Error {
        constructor(message) {
            super(message)
            this.name = "JWP.InvalidProof"
        }
    }
    
    static ExpiredError = class ExpiredError extends Error {
        constructor(message) {
            super(message)
            this.name = "JWP.Expired"
        }
    }


    static hello = "HELLLLOOOO"



    constructor(difficulty = 20, saltLength = 16) {
        this.difficulty = difficulty
        this.saltLength = saltLength
    }

    _generateSalt() {
        return crypto.randomBytes(this.saltLength)
    }

    _leadingZeroBitCount(byte) {
        let mask = 0b10000000
        for (var i = 0; i < 8; i++) {
            const maskedBit = byte & mask
            mask >>= 1
            if (maskedBit != 0)
                return i
        }
        return 8
    }

    _isZeroPrefixed(digest, bitCount=this.difficulty) {
        for (var byte of digest) {
            if (bitCount == 0) return true

            if (bitCount >= 8) {
                if (byte != 0) return false
                bitCount -= 8
            } else {
                return this._leadingZeroBitCount(byte) >= bitCount
            }
        }
        return false
    }

    async generate(claims, expiration = new Date(new Date().getTime() + 5*60*1000)) {

        const header = { 'typ': 'JWP', 'alg': 'SHA256', 'dif': this.difficulty }

        if (expiration && !('exp' in claims)) {
            claims['exp'] = expiration
        }

        const body = JSON.stringify(claims)
        const encodedBody = base64url(body)
        const encodedHeader = base64url(JSON.stringify(header))

        const salt = this._generateSalt()
        const encodedSalt = base64url(salt)

        const challenge = encodedHeader+ "." + encodedBody + "." + encodedSalt

        const textEncoder = new TextEncoder()
        const challengeData = textEncoder.encode(challenge)

        //const leadingHasher = crypto.createHash('sha256')
        //leadingHasher.update(challengeData)

        var counter = 0n // 64bit

        // TODO: make completely async
        while (true) {
            let b = new ArrayBuffer(8)
            new DataView(b).setBigUint64(0, counter) // maybe remove leading 0s

            const encodedProof = base64url(b)
            const proofData = textEncoder.encode(encodedProof)

            //const hash = await crypto.subtle.digest('SHA-256', challengeData+proofData)
            const hasher = crypto.createHash('sha256')
            hasher.update(challengeData)
            hasher.update(proofData)
            const hash = hasher.digest()

            if (this._isZeroPrefixed(hash)) {
                return challenge + encodedProof
            }

            counter++
        }
    }


    decode(stamp, verify = true) {

        const components = stamp.split('.')
        if (components.length != 3) throw new JWP.InvalidFormatError()

        const encodedHeader = components[0]
        const encodedBody = components[1]

        const headerData = base64url.decode(encodedHeader)
        const bodyData = base64url.decode(encodedBody)

        const header = JSON.parse(headerData)
        const body = JSON.parse(bodyData)

        if (!verify) return body

        // TODO: check alogrithm in header

        // - check proof

        const hasher = crypto.createHash('sha256')
        hasher.update(stamp)
        const digest = hasher.digest()

        if (!this._isZeroPrefixed(digest, this.difficulty))
            throw new JWP.InvalidProofError()
        
        
        // - check expiration range
        
        // TODO:

        return body
    }

}

module.exports = JWP