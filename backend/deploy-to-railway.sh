#!/bin/bash

# 🚀 Kiaan WMS Backend - Quick Railway Deployment Script
# This script helps deploy the backend to Railway

set -e

echo "🚀 Kiaan WMS Backend - Railway Deployment Helper"
echo "=================================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial backend commit for Railway deployment"
else
    echo "✅ Git repository already initialized"
fi

# Check if remote exists
if ! git remote get-url origin &> /dev/null; then
    echo ""
    echo "⚠️  No GitHub remote configured!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Create a new GitHub repository at: https://github.com/new"
    echo "   Repository name: kiaan-wms-backend"
    echo "   Description: Backend API for Kiaan WMS Platform"
    echo "   Visibility: Private (recommended) or Public"
    echo ""
    echo "2. After creating the repo, run these commands:"
    echo ""
    echo "   git remote add origin https://github.com/YOUR_USERNAME/kiaan-wms-backend.git"
    echo "   git branch -M master"
    echo "   git push -u origin master"
    echo ""
    echo "3. Then deploy to Railway:"
    echo "   - Go to https://railway.app/dashboard"
    echo "   - Click 'New Project' or select existing project"
    echo "   - Click 'New' → 'GitHub Repo'"
    echo "   - Select 'kiaan-wms-backend'"
    echo "   - Railway will automatically deploy!"
    echo ""
    exit 1
fi

echo "✅ GitHub remote configured"
echo ""

# Show current remote
echo "📍 Current remote:"
git remote -v
echo ""

# Check git status
echo "📊 Git status:"
git status --short
echo ""

# Ask if user wants to push
read -p "🤔 Do you want to push to GitHub now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing to GitHub..."
    git add .
    git commit -m "Backend ready for Railway deployment - $(date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
    git push -u origin master || git push

    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎯 Next: Deploy to Railway"
    echo "=========================="
    echo ""
    echo "Option 1: Railway UI (Easiest)"
    echo "------------------------------"
    echo "1. Visit: https://railway.app/dashboard"
    echo "2. Click 'New Project' (or use existing 'kiaan-wms-production')"
    echo "3. Click 'New' → 'GitHub Repo'"
    echo "4. Select 'kiaan-wms-backend'"
    echo "5. Railway will auto-deploy!"
    echo ""
    echo "Option 2: Railway CLI"
    echo "--------------------"
    echo "1. railway login"
    echo "2. railway link (select kiaan-wms-production)"
    echo "3. railway up"
    echo ""
    echo "📋 Required Environment Variables (set in Railway):"
    echo "---------------------------------------------------"
    echo "PORT=8010"
    echo "NODE_ENV=production"
    echo "JWT_SECRET=your_secure_jwt_secret_here"
    echo "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
    echo ""
    echo "🎉 After deployment, test with:"
    echo "curl https://YOUR-BACKEND-URL/health"
    echo ""
else
    echo "⏸️  Deployment cancelled. Run this script again when ready!"
fi

echo ""
echo "📖 For detailed instructions, see: BACKEND_DEPLOYMENT_INSTRUCTIONS.md"
echo ""
