module.exports = {
  hooks: {
    'commit-msg:comment':
      'Ensure that commit messages adhere to the conventionalcommits.org standard',
    'commit-msg': 'commitlint -E HUSKY_GIT_PARAMS',
    'post-merge:comment':
      "Automatically run 'yarn install' on post-merge if `yarn.lock` changed",
    'post-merge': '$(pwd)/scripts/post-merge-or-rebase-githook.sh',
    'post-rewrite:comment':
      "Automatically run 'yarn install' on post-rewrite if `yarn.lock` changed",
    'post-rewrite': '$(pwd)/scripts/post-merge-or-rebase-githook.sh',
    'pre-commit:comment': "Makes sure we don't commit bad code",
    'pre-commit': 'lint-staged',
    'pre-push:comment':
      'Run healthcheck on prepush to ensure no bad code makes it to GitLab',
    'pre-push': 'yarn health',
  },
}
