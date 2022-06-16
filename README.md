# Trivial/rudimentary eHN-simplified implementation

Brought in line with 1.00 of
	https://github.com/ehn-digital-green-development/hcert-spec/blob/main/hcert_spec.md

For round-trip testing of ```cose_sign.js``` and ```cose_verify.js``` take some
JSON, e.g. ```{ "Foo" : "Bar }```, CBOR package, COSE sign, compress and base45
convert it for use in a QR:

1. COSE sign
   1. compact the JSOn into CBOR
   1. sign and package as a COSE message
   1. ZLIB compress
   1. Base45 encode 
1. COSE verify     
   1. Base45 decode
   1. ZLIB decompress
   1. check the signature on the COSE message
   1. unpack the CBOR into JSON

### Test Steps

1. Generate the CSCA and DSC with ```./gen-csca-dsc.sh```	
1. Ensure the dependencies are installed: ```npm install```
1. Run the command: ```echo '{"A": 1234}' | npm --silent run sign > barcode && cat barcode| npm --silent run verify```
1. You should see the output: ```{"A": 1234}```

If you get an error about a missing `libc.musl-x86_64.so.1` file you need to install the ```musl-dev``` (or its equivalent on your distribution) package, e.g. on Ubuntu type: ```sudo apt-get install musl-dev``` Note that due to the precompiled GYP module this lib (with this particular name) must be in the linker's search path, the easiest to achieve that is a symbolic link: ```sudo ln -s /usr/lib/x86_64-linux-musl/libc.so /lib/libc.musl-x86_64.so.1```

Or the larger example:

```
    echo '{ "Foo":1, "Bar":{ "Field1": "a value",   "integer":1212112121 }}' |  npm --silent run sign > barcode
    cat barcode | npm run verify
```

Which should output:

```
{
    "Foo": 1, 
    "Bar": {
        "Field1": "a value", 
        "integer": 1212112121
   }
}
```
### Dumping the contents of an EU certificate without signature verification

1. Get the base45 encoded content of your QR code into a file.
1. Run the command: ```cat base45-cert.txt |npm --silent run verifynosign```


