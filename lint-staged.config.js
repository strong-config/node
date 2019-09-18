module.exports = {
  '*.ts': ['eslint --fix', 'git add'],
  '*.json': ['jsonlint-cli', 'git add'],
  '*.{yaml,yml}': ['yamllint', 'git add'],
  '*.md': [
    'markdownlint --ignore CHANGELOG.md --ignore node_modules --ignore .gitlab',
    'git add',
  ],
}
