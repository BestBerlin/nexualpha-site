#!/usr/bin/env bash
# One-time setup, run on the Mac that can already "ssh baota-prod".
# Creates a dedicated deploy key for GitHub Actions, authorizes it on the server,
# tests it, and copies the PRIVATE key to the clipboard for pasting into GitHub.
# The private key is never printed.
set -euo pipefail
KEY="$HOME/.ssh/nexualpha_gh_deploy"
EXPECT_FP="SHA256:ZeuG/YAk9Zlihb4hXHlsxu+Sx1IWZ3KV5SDDcmrmf2Y"
SECRETS_URL="https://github.com/BestBerlin/nexualpha-site/settings/secrets/actions/new"
say(){ printf '\n==> %s\n' "$1"; }
fail(){ printf '\n✗ 失败：%s\n' "$1"; exit 1; }

say "1/5 检查现有服务器连接"
ssh -o BatchMode=yes -o ConnectTimeout=10 baota-prod true || fail "ssh baota-prod 连不上"
HOSTNAME_=$(ssh -G baota-prod | awk '$1=="hostname"{print $2}')
PORT_=$(ssh -G baota-prod | awk '$1=="port"{print $2}')
USER_=$(ssh -G baota-prod | awk '$1=="user"{print $2}')
echo "服务器 $USER_@$HOSTNAME_:$PORT_"

say "2/5 核对服务器指纹"
FP=$(ssh-keyscan -p "$PORT_" -t ed25519 "$HOSTNAME_" 2>/dev/null | ssh-keygen -lf - | awk '{print $2}')
echo "服务器 ED25519 指纹 $FP"
[ "$FP" = "$EXPECT_FP" ] || fail "指纹与仓库里记录的不一致，停止。把上面这行发给 Claude"

say "3/5 生成部署专用钥匙"
if [ -f "$KEY" ]; then echo "已存在 $KEY，沿用"; else ssh-keygen -q -t ed25519 -N "" -C "github-actions nexualpha-site" -f "$KEY"; echo "已生成 $KEY"; fi
PUB=$(cat "$KEY.pub")

say "4/5 授权到服务器并测试"
ssh -o BatchMode=yes baota-prod "mkdir -p ~/.ssh && chmod 700 ~/.ssh && touch ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && (grep -qxF '$PUB' ~/.ssh/authorized_keys || echo '$PUB' >> ~/.ssh/authorized_keys)"
ssh -o BatchMode=yes -o IdentitiesOnly=yes -i "$KEY" -p "$PORT_" "$USER_@$HOSTNAME_" 'echo "新钥匙登录成功: $(whoami)@$(hostname)"; docker ps --format "{{.Names}}" | grep -c nexualpha | xargs echo "nexualpha 容器数"' || fail "新钥匙登录失败"

say "5/5 复制私钥到剪贴板（不显示）"
pbcopy < "$KEY"
echo "已复制。现在会打开 GitHub 的新建 Secret 页面："
echo "  Name 填：DEPLOY_SSH_KEY"
echo "  Secret 里按 Cmd+V 粘贴，然后点 Add secret"
open "$SECRETS_URL" 2>/dev/null || echo "请手动打开 $SECRETS_URL"
echo
echo "把下面这一行发给 Claude（不含任何密钥）："
echo "DEPLOY_USER=$USER_ DEPLOY_HOST=$HOSTNAME_ DEPLOY_PORT=$PORT_ FP=$FP"
echo
echo "粘贴完成后，运行这一句清空剪贴板： pbcopy < /dev/null"
