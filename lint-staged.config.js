module.exports = {
  '*.ts': ['eslint --fix'],
  '*.json': ['eslint --fix'],
  'package.json': ['npx scriptlint'],
  '*.{yaml,yml}': ['eslint --fix'],
  'example/*[^invalid].{yaml,yml}': [
    'strong-config validate --config-root example',
  ],
  '*.md': ['markdownlint --ignore CHANGELOG.md'],
  'example/development.yaml': ['strong-config check example/development.yaml'],
}
