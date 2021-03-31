#!/bin/sh
set -e
TMPDIR=${TMPDIR:-/tmp}

PYTHON=${PYTHON:-python3}

test -f masterlist-dsc.pem || sh  gen-csca-dsc.sh 

# JSON / CBOR / COSE / ZLIB / Base45
{
  echo  '{ "Foo":1, "Bar":{ "Field1": "a value",   "integer":1212112121 }}' | npm run sign | tail -1 > ${TMPDIR}/test.b45
  
  # We need to split this up in two steps - as some OSX implementations
  # appear to have an EGAIN issue if the data is not there quick enough.
  #
  cat  ${TMPDIR}/test.b45 |  npm run verify
} 
E=$?

rm -f ${TMPDIR}/test.b45

exit $E
