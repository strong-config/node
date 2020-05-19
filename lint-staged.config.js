module.exports = {
  '*.ts': ['eslint --fix', 'git add'],
  '*.json': ['jsonlint-cli', 'git add'],
  '*.{yaml,yml}': ['yamllint', 'git add'],
  'example/*.{yaml,yml}': [
    'strong-config validate --config-root example',
    'git add',
  ],
  '*.md': [
    'markdownlint --ignore CHANGELOG.md --ignore node_modules',
    'git add',
  ],
}
