const cose = require('cose-js')
const fs = require('fs')
const rawHash = require("sha256-uint8array").createHash;
const { PEM, ASN1, Class, Tag } = require('@fidm/asn1')
const { Certificate, PrivateKey } = require('@fidm/x509')
const zlib = require('pako');
var cbor = require('cbor');
const base45 = require('base45');

const cert = Certificate.fromPEM(fs.readFileSync('./dsc-worker.pem'))
var bytes = new Uint8Array(cert.raw);

const fingerprint = rawHash().update(cert.raw).digest();
const keyID = fingerprint.slice(0,8)

// Highly ES256 specific - extract the 'X' and 'Y' for verification
//
pk = cert.publicKey.keyRaw
const keyB = Buffer.from(pk.slice(0, 1))
const keyX = Buffer.from(pk.slice(1, 1+32))
const keyY = Buffer.from(pk.slice(33,33+32))

// Read in the Base45
//
const buffer = Buffer.alloc(4_096);
var len = fs.readSync(process.stdin.fd, buffer, 0, buffer.length)
var data = buffer.slice(0,len).toString('ASCII')

data = base45.decode(data)

// Zlib magic headers:
// 78 01 - No Compression/low
// 78 9C - Default Compression
// 78 DA - Best Compression 
data = zlib.inflate(data)

//var data = JSON.parse(buffer.slice(0,len))
//const headers = {
//  'p': {'alg': 'ES256', 'kid': keyID }, 
//  'u': {}
//};

const verifier = { 'key': { 'x': keyX, 'y': keyY } };

cose.sign.verify(data,verifier)
.then((buf) => {
  data = cbor.decode(buf)
  data = JSON.stringify(data,null,5)
  process.stdout.write(data)
}).catch((error) => {
  console.log(error);
});

