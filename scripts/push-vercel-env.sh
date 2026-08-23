#!/usr/bin/env bash
# ĐẨY 4 BIẾN ENV LÊN VERCEL PRODUCTION từ .env.local (không in giá trị ra màn hình)
# Yêu cầu: đã `npx vercel login` và đứng trong thư mục project.
set -e
cd "$(dirname "$0")/.."
for VAR in THUEAPIBANK_SECRET_KEY THUEAPI_MB_TOKEN CRON_SECRET SUPABASE_SERVICE_ROLE_KEY; do
  VAL=$(grep -E "^${VAR}=" .env.local | head -1 | cut -d'=' -f2- | tr -d '\r')
  if [ -z "$VAL" ]; then echo "⚠️  Bỏ qua $VAR (chưa có trong .env.local)"; continue; fi
  printf '%s' "$VAL" | npx vercel env add "$VAR" production -y 2>/dev/null \
    || printf '%s' "$VAL" | npx vercel env add "$VAR" production
  echo "✅ $VAR đã thêm vào Vercel (production)"
done
echo "--- Redeploy production ---"
npx vercel deploy --prod --yes >/dev/null 2>&1 || npx vercel --prod
echo "✅ Xong. Kiểm tra: curl -s https://thanoxstorebot.shop/api/health"
