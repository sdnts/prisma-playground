#!/bin/bash

set -e

rm -rf archive.zip
zip -r archive.zip . \
    -x "*.sh" \
    -x "**/*.d.ts" \
    -x "**/*.md" \
    -x "prisma/migrations/*" \
    -x "prisma/.env" \
    -x "node_modules/@prisma/cli/*"
aws lambda update-function-code --function-name PrismaWorkspaceAPI --zip-file fileb://archive.zip
rm -rf archive.zip