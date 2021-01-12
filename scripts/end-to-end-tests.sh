#!/bin/bash
# flags inspired by https://vaneyckt.io/posts/safer_bash_scripts_with_set_euxo_pipefail/
set -euxo pipefail

# yarn pack
# mv strong-config*.tgz ..
# cd ..
# tar --extract --file strong-config*.tgz
# cd package
# yarn
# cp -r ../node/example example
# yarn test:cli

yarn pack
mv strong-config*.tgz ..
cd ..
mkdir -p blackbox
cd blackbox
yarn init --yes
yarn add file:$(ls ../strong-config*.tgz) ts-node typescript

cp -r ../node/example example
cp -r ../node/src/e2e e2e

echo "Importing dummy GPG Key for encryption tests"
gpg --import --quiet example/pgp/example-keypair.pgp

echo "CLI Tests"
yarn strong-config decrypt example/development.yaml tmp.yml && cat tmp.yml && rm tmp.yml
yarn strong-config encrypt -p pgp -k 2E9644A658379349EFB77E895351CE7FC0AC6E94 example/unencrypted.yml tmp.yml && cat tmp.yml && rm tmp.yml
yarn strong-config check example/development.yaml --config-root example
yarn strong-config generate-types --config-root example && cat example/config.d.ts
yarn strong-config validate example/development.yaml --config-root example

echo "Core Tests"
NODE_ENV=development yarn ts-node --transpile-only e2e/load-es6.ts
NODE_ENV=development yarn ts-node --transpile-only e2e/validate.ts

# The PATH= assignment is necessary so the 'sops' binary is available which sits in node_modules/.bin
# This hack is not necessary for the previous commands because all 'yarn xxx' commands automatically
# add ./node_modules/.bin to $PATH already
NODE_ENV=development PATH="$(yarn bin):$PATH" node e2e/load-commonjs.js