#!/bin/sh
set -eu

if repo_dir=$(git rev-parse --show-toplevel 2>/dev/null); then
  :
else
  repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
  git -C "$repo_dir" rev-parse --show-toplevel >/dev/null
fi
cd "$repo_dir"

tracked=$(git diff --cached --name-only --diff-filter=ACMR)
if [ -z "$tracked" ]; then
  exit 0
fi

unsafe_names=$(printf '%s\n' "$tracked" | grep -v '^scripts/check-secrets\.sh$' | grep -Ei '(^|/)(\.env($|\.)|[^/]*(credential|secret|token)[^/]*|[^/]+\.(pem|key))$' || true)
if [ -n "$unsafe_names" ]; then
  echo "拒绝提交疑似凭据文件：" >&2
  printf '%s\n' "$unsafe_names" >&2
  exit 1
fi

added_lines=$(git diff --cached --no-ext-diff --unified=0 -- . ':!scripts/check-secrets.sh' | grep '^+' | grep -v '^+++' || true)
if printf '%s\n' "$added_lines" | grep -Eiq '(-----BEGIN ([A-Z ]+ )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|sk-[A-Za-z0-9_-]{20,})'; then
  echo "拒绝提交：新增内容中疑似包含真实密钥或访问令牌。" >&2
  exit 1
fi

echo "敏感信息检查通过。"
