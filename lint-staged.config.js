module.exports = {
  '*.ts': ['eslint --fix'],
  '*.json': ['jsonlint-cli'],
  '*.{yaml,yml}': ['yamllint'],
  'example/*.{yaml,yml}': ['strong-config validate --config-root example'],
  '*.md': ['markdownlint --ignore CHANGELOG.md --ignore node_modules'],
}
