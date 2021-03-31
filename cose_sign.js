const cose = require('cose-js')
const fs = require('fs')
const rawHash = require("sha256-uint8array").createHash;
const { PEM, ASN1, Class, Tag } = require('@fidm/asn1')
const { Certificate, PrivateKey } = require('@fidm/x509')
const zlib = require('pako');
var cbor = require('cbor');
const base45 = require('base45-js');

const cert = Certificate.fromPEM(fs.readFileSync('./dsc-worker.pem'))
var bytes = new Uint8Array(cert.raw);

const fingerprint = rawHash().update(cert.raw).digest();
const keyID = fingerprint.slice(0,8)

const pk = PrivateKey.fromPEM(fs.readFileSync('./dsc-worker.p8'))

// Highly ES256 specific - extract the 'D' for signing.
//
const keyD = Buffer.from(pk.keyRaw.slice(7,7+32))

const buffer = Buffer.alloc(4_096);
var len = fs.readSync(process.stdin.fd, buffer, 0, buffer.length)
var data = JSON.parse(buffer.slice(0,len))
const plaintext= cbor.encode(data)

const headers = {
  'p': {'alg': 'ES256', 'kid': keyID }, 
  'u': {}
};

const signer = {
  'key': {
    'd': keyD 
  }
};

cose.sign.create(
  headers,
  plaintext,
  signer)
.then((buf) => {
  buf = zlib.deflate(buf)
  buf = base45.encode(buf)
  process.stdout.write(Buffer.from(buf).toString())
}).catch((error) => {
  console.log(error);
});
