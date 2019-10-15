#!/bin/bash
# MIT © Sindre Sorhus - sindresorhus.com

changed_files="$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)"

check_run() {
	echo "$changed_files" | grep --quiet "$1" && eval "$2"
}

# Usage
# In this example it's used to run `yarn` if yarn.lock changed
check_run yarn.lock "yarn install" || true
