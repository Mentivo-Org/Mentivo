#!/usr/bin/env bash
set -e

echo "══════════════════════════════════════════════"
echo "🚀 [RENDER BUILD] Starting Load Balancer Build"
echo "══════════════════════════════════════════════"

# Step 1: Install dependencies
echo ""
echo "📦 [1/1] Installing dependencies..."
pnpm install
echo "   ✅ Dependencies installed"

echo ""
echo "══════════════════════════════════════════════"
echo "✅ [RENDER BUILD] Load Balancer build finished!"
echo "══════════════════════════════════════════════"
