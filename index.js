const base64url = require('base64url')
const sleep = (time) => new Promise(r => setTimeout(r, time))

let crypto
try {
    crypto = require('crypto')
} catch {
    if (window !== undefined) crypto = window.crypto
}

Date.prototype.toJSON = function(){
    return Math.floor(this.getTime() / 1000)
}

Uint8Array.prototype.incremented = function() {
    var i = 0
    while (this[i] !== undefined && this[i] == 0xFF) {
        this[i] = 0
        i++
    }

    if (this[i] !== undefined) {
        this[i]++
    } else {
        var res = new Uint8Array(this.length+1)
        res.set([1], this.length) // [0x01, 0x00, ..., 0x00]
        return res
    }

    return this
}

class JWP {

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

        var counter = new Uint8Array(1)

        while (true) {
            const encodedProof = base64url(counter)
            const proofData = textEncoder.encode(encodedProof)

            //const hash = await crypto.subtle.digest('SHA-256', challengeData+proofData)
            const hasher = crypto.createHash('sha256')
            hasher.update(challengeData)
            hasher.update(proofData)
            const hash = hasher.digest()

            if (this._isZeroPrefixed(hash)) {
                return challenge + encodedProof
            }

            if (Math.random() < 1e-4) await sleep(0)

            counter = counter.incremented() //counter++
        }
    }


    decode(stamp, verify = true, expirationRange = JWP.DateRange.fromNow(1800*1000)) {

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
        
        let expiration = body.exp || 0
        if (typeof expiration == 'string') expiration = parseFloat(expiration)
        expiration = new Date(expiration * 1000)

        if (!expirationRange.contains(expiration))
            throw new JWP.ExpiredError
        

        return body
    }

}


// - errors

JWP.InvalidFormatError = class InvalidProofError extends Error {
    constructor(message) {
        super(message)
        this.name = "JWP.InvalidFormat"
    }
}
    
JWP.InvalidProofError = class InvalidProofError extends Error {
    constructor(message) {
        super(message)
        this.name = "JWP.InvalidProof"
    }
}

JWP.ExpiredError = class ExpiredError extends Error {
    constructor(message) {
        super(message)
        this.name = "JWP.Expired"
    }
}


// - Date Range

var _dr

JWP.DateRange = (_dr = class DateRange {

    constructor(start, end) {
        this.start = start
        this.end = end
    }

    static startUntil(start, duration) {
        return new DateRange(start, new Date(start.getTime() + duration))
    }

    static durationTo(duration, end) {
        return new DateRange(new Date(end.getTime() - duration), end)
    }

    static fromNow(duration) {
        return DateRange.startUntil(new Date(), duration)
    }

    //static unlimited = new DateRange(null, null)

    // - Checks

    // checks if given date is inside date range
    contains(date) {
        if (this.start && date < this.start) {
            return false
        } else if (this.end && date > this.end) {
            return false
        }
        return true
    }

},
_dr.unlimited = new _dr(null, null),
_dr)

module.exports = JWP