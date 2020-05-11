#!/bin/bash

# Remove any previous attempts at archiving
rm -rf archive.zip

zip -r archive.zip . \
  -x **/*.d.ts \
  -x **/*.md \
  -x **/*.txt \
  -x **/LICENSE \
  -x prisma/**/* \
  -x __tests__/**/* \
  -x scripts/**/*

aws lambda update-function-code \
  --function-name PrismaPlaygroundWorkspace \
  --zip-file fileb://archive.zip

rm -rf archive.zip