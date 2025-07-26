#!/bin/bash
echo "🔍 セキュリティヘッダーチェック..."

HEADERS=(
  "X-Frame-Options"
  "X-Content-Type-Options"
  "Referrer-Policy"
  "X-XSS-Protection"
  "Strict-Transport-Security"
  "Content-Security-Policy"
)

URL="${1:-http://localhost:3000}"

echo "チェック対象URL: $URL"
echo ""

for header in "${HEADERS[@]}"; do
  value=$(curl -s -I "$URL" | grep -i "$header" | cut -d' ' -f2-)
  if [ -n "$value" ]; then
    echo "✅ $header: $value"
  else
    echo "❌ $header: 未設定"
  fi
done

echo ""
echo "📊 セキュリティヘッダー確認完了"