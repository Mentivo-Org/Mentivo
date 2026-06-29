#!/usr/bin/env bash
set -e

echo "══════════════════════════════════════════════"
echo "🚀 [RENDER BUILD] Starting Mentivo Backend Build"
echo "══════════════════════════════════════════════"

# Step 1: Copy Firebase secret file from Render's secret storage
echo ""
echo "📁 [1/3] Copying Firebase secrets..."
if [ -f /etc/secrets/firebase-secrets.json ]; then
  cp /etc/secrets/firebase-secrets.json ./firebase-secrets.json
  echo "   ✅ firebase-secrets.json copied to project root"
else
  echo "   ⚠️  /etc/secrets/firebase-secrets.json not found — Firebase will fall back to env vars"
fi

# Step 2: Install dependencies
echo ""
echo "📦 [2/3] Installing dependencies..."
pnpm install
echo "   ✅ Dependencies installed"

# Step 3: Generate Prisma client
echo ""
echo "🗄️  [3/3] Generating Prisma client..."
pnpm run prisma:generate
echo "   ✅ Prisma client generated"

echo ""
echo "══════════════════════════════════════════════"
echo "✅ [RENDER BUILD] Backend build finished successfully!"
echo "══════════════════════════════════════════════"
