#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
message=${1:-"chore(agent): sync personal configuration"}

if git -C "$repo_dir" remote get-url origin >/dev/null 2>&1; then
  git -C "$repo_dir" pull --rebase --autostash
fi

git -C "$repo_dir" add -A
"$repo_dir/scripts/check-secrets.sh"

if git -C "$repo_dir" diff --cached --quiet; then
  echo "没有需要提交的 Agent 配置变化。"
  exit 0
fi

git -C "$repo_dir" commit -m "$message"

if git -C "$repo_dir" remote get-url origin >/dev/null 2>&1; then
  git -C "$repo_dir" push
else
  echo "已完成本地提交；尚未配置 origin，因此没有推送。"
fi
