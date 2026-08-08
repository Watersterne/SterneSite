// 纯 JS 哈希算法：MD5 / SHA-1 / SHA-256（输入为字符串，内部做 UTF-8 编码）
// 输出为小写十六进制字符串

function strToBytes(s) {
    if (typeof TextEncoder !== 'undefined') {
        return Array.from(new TextEncoder().encode(s));
    }
    var out = [];
    for (var i = 0; i < s.length; i++) {
        var c = s.codePointAt(i);
        if (c > 0xFFFF) i++;
        if (c < 0x80) out.push(c);
        else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 63));
        else if (c < 0x10000) out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
        else out.push(0xF0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return out;
}

function toHex(bytesLE32) {
    var s = '';
    for (var i = 0; i < bytesLE32.length; i++) {
        var v = bytesLE32[i] >>> 0;
        s += ('0' + (v & 255).toString(16)).slice(-2) +
             ('0' + ((v >>> 8) & 255).toString(16)).slice(-2) +
             ('0' + ((v >>> 16) & 255).toString(16)).slice(-2) +
             ('0' + ((v >>> 24) & 255).toString(16)).slice(-2);
    }
    return s;
}

function toHexBE(words) {
    var s = '';
    for (var i = 0; i < words.length; i++) {
        var v = words[i] >>> 0;
        s += ('00000000' + v.toString(16)).slice(-8);
    }
    return s;
}

function padBytes(bytes, bigEndianLen) {
    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    if (bigEndianLen) {
        bytes.push(0, 0, 0, 0,
            (bitLen >>> 24) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 8) & 0xff, bitLen & 0xff);
    } else {
        bytes.push(bitLen & 0xff, (bitLen >>> 8) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 24) & 0xff, 0, 0, 0, 0);
    }
    return bytes;
}

// ---------------- MD5 ----------------
function md5(str) {
    function rot(x, c) { return (x << c) | (x >>> (32 - c)); }
    var K = [];
    for (var i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296);
    var S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
    var bytes = padBytes(strToBytes(str), false);
    var h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476;
    for (var off = 0; off < bytes.length; off += 64) {
        var M = [];
        for (var j = 0; j < 16; j++) {
            M[j] = bytes[off + j * 4] | (bytes[off + j * 4 + 1] << 8) |
                   (bytes[off + j * 4 + 2] << 16) | (bytes[off + j * 4 + 3] << 24);
        }
        var A = h0, B = h1, C = h2, D = h3;
        for (i = 0; i < 64; i++) {
            var F, g;
            if (i < 16) { F = (B & C) | (~B & D); g = i; }
            else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
            else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
            else { F = C ^ (B | ~D); g = (7 * i) % 16; }
            F = (F + A + K[i] + M[g]) | 0;
            A = D; D = C; C = B;
            B = (B + rot(F, S[i])) | 0;
        }
        h0 = (h0 + A) | 0; h1 = (h1 + B) | 0; h2 = (h2 + C) | 0; h3 = (h3 + D) | 0;
    }
    return toHex([h0, h1, h2, h3]);
}

// ---------------- SHA-1 ----------------
function sha1(str) {
    function rot(x, n) { return (x << n) | (x >>> (32 - n)); }
    var bytes = padBytes(strToBytes(str), true);
    var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
    for (var off = 0; off < bytes.length; off += 64) {
        var w = [];
        for (var j = 0; j < 16; j++) {
            w[j] = (bytes[off + j * 4] << 24) | (bytes[off + j * 4 + 1] << 16) |
                   (bytes[off + j * 4 + 2] << 8) | bytes[off + j * 4 + 3];
        }
        for (j = 16; j < 80; j++) w[j] = rot(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
        var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4];
        for (j = 0; j < 80; j++) {
            var f, k;
            if (j < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
            else if (j < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
            else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
            else { f = b ^ c ^ d; k = 0xCA62C1D6; }
            var t = (rot(a, 5) + f + e + k + w[j]) | 0;
            e = d; d = c; c = rot(b, 30); b = a; a = t;
        }
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0;
        H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0;
    }
    return toHexBE(H);
}

// ---------------- SHA-256 ----------------
function sha256(str) {
    function ror(x, n) { return (x >>> n) | (x << (32 - n)); }
    var K = [
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    var bytes = padBytes(strToBytes(str), true);
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    for (var off = 0; off < bytes.length; off += 64) {
        var w = [];
        for (var j = 0; j < 16; j++) {
            w[j] = (bytes[off + j * 4] << 24) | (bytes[off + j * 4 + 1] << 16) |
                   (bytes[off + j * 4 + 2] << 8) | bytes[off + j * 4 + 3];
        }
        for (j = 16; j < 64; j++) {
            var s0 = ror(w[j - 15], 7) ^ ror(w[j - 15], 18) ^ (w[j - 15] >>> 3);
            var s1 = ror(w[j - 2], 17) ^ ror(w[j - 2], 19) ^ (w[j - 2] >>> 10);
            w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }
        var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
        for (j = 0; j < 64; j++) {
            var S1 = ror(e, 6) ^ ror(e, 11) ^ ror(e, 25);
            var ch = (e & f) ^ (~e & g);
            var t1 = (h + S1 + ch + K[j] + w[j]) | 0;
            var S0 = ror(a, 2) ^ ror(a, 13) ^ ror(a, 22);
            var maj = (a & b) ^ (a & c) ^ (b & c);
            var t2 = (S0 + maj) | 0;
            h = g; g = f; f = e; e = (d + t1) | 0;
            d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return toHexBE(H);
}
