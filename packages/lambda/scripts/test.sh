#!/bin/bash

# Set environment variables
set -a
. .env
set +a

node __tests__/spec.js