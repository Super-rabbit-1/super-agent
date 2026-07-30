#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
force=0
if [ "${1:-}" = "--force" ]; then
  force=1
fi

backup_or_refuse() {
  target=$1
  if [ ! -e "$target" ] && [ ! -L "$target" ]; then
    return
  fi
  if [ "$force" -ne 1 ]; then
    echo "目标已存在，未覆盖：$target" >&2
    echo "确认需要替换时运行：$repo_dir/bootstrap.sh --force" >&2
    exit 1
  fi
  backup="${target}.before-agent-config.$(date +%Y%m%d%H%M%S)"
  mv "$target" "$backup"
  echo "已备份：$target -> $backup"
}

ensure_link() {
  source=$1
  target=$2
  if [ -L "$target" ] && [ "$(readlink "$target")" = "$source" ]; then
    return
  fi
  backup_or_refuse "$target"
  mkdir -p "$(dirname -- "$target")"
  ln -s "$source" "$target"
  echo "已链接：$target -> $source"
}

ensure_link "$repo_dir/AGENTS.md" "$HOME/.codex/AGENTS.md"
ensure_link "$repo_dir/AGENTS.md" "$HOME/.claude/CLAUDE.md"

for skill_dir in "$repo_dir"/skills/*; do
  [ -f "$skill_dir/SKILL.md" ] || continue
  skill_name=$(basename -- "$skill_dir")
  ensure_link "$skill_dir" "$HOME/.codex/skills/$skill_name"
  ensure_link "$skill_dir" "$HOME/.claude/skills/$skill_name"
done

if git -C "$repo_dir" rev-parse --git-dir >/dev/null 2>&1; then
  chmod +x "$repo_dir/scripts/check-secrets.sh"
  ln -sf "$repo_dir/scripts/check-secrets.sh" "$repo_dir/.git/hooks/pre-commit"
  echo "已安装提交前敏感信息检查。"
fi

echo "基础配置完成。第三方依赖与独立授权见：$repo_dir/manifest/dependencies.md"
