#!/usr/bin/env bash
# 重启后端（自动加载 backend/.env 中的 AI 中转站配置），日志写 /tmp/suanfa-backend.log
# 用法：scripts/dev-backend.sh [--port 8080] [其他 --KEY=VALUE 透传给 spring-boot:run]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=8080
ARGS=()
while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="$2"; shift 2 ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

if [ -f "$ROOT/backend/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/backend/.env"
  set +a
else
  echo "提示：未找到 backend/.env（可 cp backend/.env.example backend/.env 后填入中转站 token）" >&2
fi

# 停掉旧实例（bracket 技巧避免 pkill 匹配到本脚本自己的命令行）
pkill -f "[c]om.suanfa.SuanfaApplication" 2>/dev/null || true
pkill -f "[s]pring-boot:run" 2>/dev/null || true
sleep 2

cd "$ROOT/backend"
setsid nohup mvn -o spring-boot:run \
  -Dspring-boot.run.arguments="--server.port=$PORT ${ARGS[*]:-}" \
  > "/tmp/suanfa-backend-$PORT.log" 2>&1 < /dev/null &
disown

echo "启动中…  日志：/tmp/suanfa-backend-$PORT.log"
for _ in $(seq 1 60); do
  if curl -sf -m 2 "http://localhost:$PORT/api/ai/status" >/dev/null; then
    echo "后端已就绪：http://localhost:$PORT  AI 配置："
    curl -s "http://localhost:$PORT/api/ai/status"; echo
    exit 0
  fi
  sleep 1
done
echo "启动超时，请查看日志：tail -50 /tmp/suanfa-backend-$PORT.log" >&2
exit 1
