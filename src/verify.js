const cose = require("cose-js");
const rawHash = require("sha256-uint8array").createHash;
const { Certificate } = require("@fidm/x509");
const zlib = require("pako");
const cbor = require("cbor");
const base45 = require("base45-js");

module.exports = async function verify(certificatePEM, data) {
  const cert = Certificate.fromPEM(certificatePEM);

  const fingerprint = rawHash().update(cert.raw).digest();
  const keyID = fingerprint.slice(0, 8);

  // Highly ES256 specific - extract the 'X' and 'Y' for verification
  //
  pk = cert.publicKey.keyRaw;
  const keyX = Buffer.from(pk.slice(1, 1 + 32));
  const keyY = Buffer.from(pk.slice(33, 33 + 32));

  // Strip off the HC1 header if present
  //
  if (data.startsWith("HC1")) {
    data = data.substring(3);
    if (data.startsWith(":")) {
      data = data.substring(1);
    } else {
      console.log("Warning: unsafe HC1: header - update to v0.0.4");
    }
  } else {
    console.log("Warning: no HC1: header - update to v0.0.4");
  }

  data = base45.decode(data);

  // Zlib magic headers:
  // 78 01 - No Compression/low
  // 78 9C - Default Compression
  // 78 DA - Best Compression
  //
  if (data[0] == 0x78) {
    data = zlib.inflate(data);
  }

  const verifier = { key: { x: keyX, y: keyY, kid: keyID } };

  return cose.sign
    .verify(data, verifier)
    .then((buf) => {
      return cbor.decode(buf);
    })
    .catch((error) => {
      console.log(error);
    });
};
