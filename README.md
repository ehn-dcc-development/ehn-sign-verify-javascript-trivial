# Trivial/rudimentary eHN-simplified implementation

Brought in line with 1.00 of
https://github.com/ehn-digital-green-development/hcert-spec/blob/main/hcert_spec.md

For round-trip testing of `bin/sign` and `bin/verify` take some
JSON, e.g. `{ "Foo" : "Bar }`, CBOR package, COSE sign, compress and base45
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

1. Generate the CSCA and DSC with `./gen-csca-dsc.sh`
1. Ensure the dependencies are installed: `npm install`
1. Run the command: `echo "{'A': 1234}" | ./bin/sign | ./bin/verify`
1. You should see the output: `{"A": 1234}`

Or the larger example:

```
    echo '{ "Foo":1, "Bar":{ "Field1": "a value",   "integer":1212112121 }}' | ./bin/sign > barcode
    cat barcode | | ./bin/verify
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
