#!/bin/sh
set -e

UPLOAD_ROOT="${UPLOAD_DIR:-public/uploads}"

for subdir in \
  documents pdfs images invoice-imports \
  company/logo company/header company/footer \
  catalog delivery-signed delivery-notes proformas; do
  mkdir -p "${UPLOAD_ROOT}/${subdir}"
done

exec "$@"
