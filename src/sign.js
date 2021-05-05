const cose = require("cose-js");
const rawHash = require("sha256-uint8array").createHash;
const { Certificate, PrivateKey } = require("@fidm/x509");
const zlib = require("pako");
const cbor = require("cbor");
const base45 = require("base45-js");

module.exports = async function sign(certificatePEM, privateKey, data) {
  const cert = Certificate.fromPEM(certificatePEM);

  const fingerprint = rawHash().update(cert.raw).digest();
  const keyID = fingerprint.slice(0, 8);

  const pk = PrivateKey.fromPEM(privateKey);

  // Highly ES256 specific - extract the 'D' for signing.
  //
  const keyD = Buffer.from(pk.keyRaw.slice(7, 7 + 32));
  const plaintext = cbor.encode(data);

  const headers = {
    p: { alg: "ES256", kid: keyID },
    u: {},
  };

  const signer = {
    key: {
      d: keyD,
    },
  };

  return cose.sign
    .create(headers, plaintext, signer)
    .then((buf) => {
      buf = zlib.deflate(buf);
      return "HC1:" + base45.encode(buf);
    })
    .catch((error) => {
      console.log(error);
    });
};
