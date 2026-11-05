#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 ]]; then
  echo "usage: cleanup-workdir.sh <temp-project-dir>"
  exit 2
fi
DIR="$1"
case "$DIR" in
  /tmp/deck-verify-* | /var/folders/*deck-verify-* ) ;;
  * )
    echo "refusing to remove dir outside deck-verify temp pattern: $DIR"
    exit 1
    ;;
esac
rm -rf "$DIR"
echo "removed $DIR"
