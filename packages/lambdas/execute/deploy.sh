#!/bin/bash

set -e

rm -rf archive.zip
zip -r archive.zip . \
    -x "*.sh" \
    -x "**/*.d.ts" \
    -x "**/*.md" \
aws lambda update-function-code --function-name PrismaPlaygroundExecute --zip-file fileb://archive.zip
rm -rf archive.zip