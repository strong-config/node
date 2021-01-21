#!/bin/bash
# flags inspired by https://vaneyckt.io/posts/safer_bash_scripts_with_set_euxo_pipefail/
set -euxo pipefail

# Create tarball with strong-config package
yarn pack

# Clean up leftovers from previous e2e test runs
rm -rf blackbox

# Create empty dir to bootstrap test project
mkdir -p blackbox
cd blackbox

# Create package.json for test project
yarn init --yes

# Install strong-config from tarball, ts-node & typescript for transpiling test files
yarn add file:$(ls ../strong-config*.tgz) ts-node typescript

# Copy in example configs to test against
cp -r ../example config
cp -r ../example-with-base-config config-with-base-config
cp -r ../example-with-base-config config-with-base-config-containing-secrets

# Copy in e2e test files
cp -r ../src/e2e e2e

# Import GPG key into local keychain
echo "Importing dummy GPG Key for encryption tests"
gpg --import --quiet config/pgp/example-keypair.pgp

# Run CLI commands
echo "CLI Tests"

# Decrypt with local GPG key
yarn strong-config decrypt config/development.yaml tmp.yml && cat tmp.yml && rm tmp.yml

# Encrypt with local GPG key
yarn strong-config encrypt -p pgp -k 2E9644A658379349EFB77E895351CE7FC0AC6E94 config/unencrypted.yml tmp.yml && cat tmp.yml && rm tmp.yml

# Check single config
yarn strong-config check config/development.yaml

# Check multiple configs
yarn strong-config check config/development.yaml config/no-secrets.yml

# Validate single config
yarn strong-config validate config/development.yaml config/unencrypted.yml

# Validate multiple configs
yarn strong-config validate config/development.yaml

# Generate TypeScript Definitions
yarn strong-config generate-types && cat config/config.d.ts

# Test core strong-config package 
echo "Core Tests"
NODE_ENV=development yarn ts-node --transpile-only e2e/load-es6.ts
NODE_ENV=development yarn ts-node --transpile-only e2e/validate.ts

# The PATH-assignment is necessary so the 'sops' binary is available which sits in node_modules/.bin
# This hack is not necessary for the previous commands because all 'yarn xxx' commands add ./node_modules/.bin
# to the $PATH automatically already
NODE_ENV=development PATH="$(yarn bin):$PATH" node e2e/load-commonjs.js