const cose = require('cose-js')
const fs = require('fs')
const rawHash = require("sha256-uint8array").createHash;
const { PEM, ASN1, Class, Tag } = require('@fidm/asn1')
const { Certificate, PrivateKey } = require('@fidm/x509')
const zlib = require('pako');
var cbor = require('cbor');
const base45 = require('base45-js');
const ignoreSign = process.argv.length > 2 && process.argv[2] === '--ignore-signature';

// Read in the Base45
//
const buffer = Buffer.alloc(4_096);
var len = fs.readSync(process.stdin.fd, buffer, 0, buffer.length)
var data = buffer.slice(0,len).toString('ASCII')

// Strip off the HC1 header if present
//
if (data.startsWith('HC1')) {
  data = data.substring(3)
  if (data.startsWith(':')) {
     data = data.substring(1)
  } else {
     console.log("Warning: unsafe HC1: header - update to v0.0.4");
  };
} else {
     console.log("Warning: no HC1: header - update to v0.0.4");
};

data = base45.decode(data)

// Zlib magic headers:
// 78 01 - No Compression/low
// 78 9C - Default Compression
// 78 DA - Best Compression 
//
if (data[0] == 0x78) {
   data = zlib.inflate(data)
}

if (ignoreSign) {
  // We ignore the signature and just print out the values in the CBOR payload
  data = cbor.decode(data);
  data = cbor.decode(data.value[2]); // EU Covid certificate specific: the actual payload is in this field.
  console.log('%o', data); // It's a POJO not a JSON object so we serialize this way
} else {
  const cert = Certificate.fromPEM(fs.readFileSync('./dsc-worker.pem'))
  const fingerprint = rawHash().update(cert.raw).digest();
  const keyID = fingerprint.slice(0,8)
  // Highly ES256 specific - extract the 'X' and 'Y' for verification
  //
  const pk = cert.publicKey.keyRaw
  const keyB = Buffer.from(pk.slice(0, 1))
  const keyX = Buffer.from(pk.slice(1, 1+32))
  const keyY = Buffer.from(pk.slice(33,33+32))
  const verifier = { 'key': { 'x': keyX, 'y': keyY,  'kid': keyID } };
  cose.sign.verify(data,verifier)
  .then((buf) => {
    data = cbor.decode(buf)
    data = JSON.stringify(data,null,5)
    process.stdout.write(data)
  }).catch((error) => {
    console.log(error);
  });
}
