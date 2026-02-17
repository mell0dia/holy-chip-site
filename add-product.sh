#!/bin/bash
# Automated script to add a new Holy Chip product
# Usage: npm run add-product Chip_100

if [ -z "$1" ]; then
  echo "❌ Error: Please provide a chip name"
  echo "Usage: npm run add-product Chip_100"
  exit 1
fi

CHIP_NAME=$1

echo "🚀 Adding new product: $CHIP_NAME"
echo ""

# Step 1: Create mug product
echo "📦 Step 1/4: Creating mug product in Printify..."
node create-single-mug.js "$CHIP_NAME"

if [ $? -ne 0 ]; then
  echo "❌ Failed to create mug product"
  exit 1
fi

echo ""

# Step 2: Wait for Printify to generate mockups
echo "⏳ Step 2/4: Waiting 30 seconds for Printify to generate mockups..."
sleep 30

echo ""

# Step 3: Download mockup images
echo "📸 Step 3/4: Downloading mockup images..."
node fetch-all-mug-angles.js

echo ""

# Step 4: Deploy to Vercel
echo "🚢 Step 4/4: Deploying to Vercel..."
vercel --prod --yes

echo ""
echo "✅ SUCCESS! $CHIP_NAME is now live!"
echo "🔗 Your site: https://holy-chip-store.vercel.app"
echo ""
