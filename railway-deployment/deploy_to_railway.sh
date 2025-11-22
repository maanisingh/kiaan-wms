#!/bin/bash

# Kiaan WMS - Railway Backend Deployment Script
# This script deploys PostgreSQL + Hasura to Railway
# Prerequisites: Railway CLI logged in (`railway login`)

set -e

echo "======================================"
echo "Kiaan WMS - Railway Backend Deployment"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}ERROR: Railway CLI is not installed${NC}"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

echo -e "${GREEN}✓${NC} Railway CLI found"

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}You need to login to Railway first${NC}"
    echo "Run: railway login"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo -e "${GREEN}✓${NC} Logged into Railway as: $(railway whoami)"
echo ""

# Navigate to project root
cd /root/kiaan-wms/frontend

# Check if linked to Railway project
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}Project not linked to Railway${NC}"
    echo "Linking to Railway project..."
    railway link
fi

echo ""
echo "=== Step 1: Deploy PostgreSQL Database ==="
echo ""
echo "We'll add PostgreSQL service to your Railway project..."
read -p "Press Enter to continue..."

# Add PostgreSQL database
echo "Adding PostgreSQL service..."
railway add --database postgresql

echo ""
echo -e "${GREEN}✓${NC} PostgreSQL service added!"
echo ""
echo "Please wait 1-2 minutes for PostgreSQL to provision..."
echo ""
read -p "Press Enter when PostgreSQL shows as 'Active' in Railway dashboard..."

# Get database connection details
echo ""
echo "=== Step 2: Import Database Schema and Data ==="
echo ""

# We need to get the DATABASE_URL from Railway
echo "Connecting to Railway PostgreSQL to import data..."
echo ""
echo "You'll see a psql prompt. Run this command:"
echo ""
echo -e "${YELLOW}\i /root/kiaan-wms/railway-deployment/full_database.sql${NC}"
echo ""
echo "Then type: \q to exit"
echo ""
read -p "Press Enter to open Railway PostgreSQL connection..."

railway connect postgresql

echo ""
echo -e "${GREEN}✓${NC} Database imported!"
echo ""

# Verify data import
echo "=== Step 3: Verify Database Import ==="
echo ""
echo "Let's verify the data was imported correctly..."
echo "You'll see a psql prompt. Run these commands:"
echo ""
echo -e "${YELLOW}\dt${NC}                          # Should show 21 tables"
echo -e "${YELLOW}SELECT COUNT(*) FROM \"Product\";${NC}   # Should return 32"
echo -e "${YELLOW}SELECT COUNT(*) FROM \"Inventory\";${NC} # Should return 10707"
echo -e "${YELLOW}\q${NC}                           # Exit when done"
echo ""
read -p "Press Enter to open PostgreSQL connection..."

railway connect postgresql

echo ""
echo "=== Step 4: Create Hasura Service ==="
echo ""
echo "Now we'll deploy Hasura GraphQL Engine..."
echo ""
echo "MANUAL STEP REQUIRED:"
echo "1. Go to Railway dashboard: https://railway.app/"
echo "2. Click 'New' → 'Empty Service'"
echo "3. Name it: kiaan-wms-hasura"
echo "4. Go to Settings → Deploy"
echo "5. Set Source to: Docker Image"
echo "6. Image: hasura/graphql-engine:latest"
echo "7. Click 'Deploy'"
echo ""
read -p "Press Enter when Hasura service is created..."

echo ""
echo "=== Step 5: Configure Hasura Environment Variables ==="
echo ""
echo "Add these variables to Hasura service in Railway:"
echo ""
echo -e "${YELLOW}HASURA_GRAPHQL_DATABASE_URL${NC}=\${{kiaan-wms-postgres.DATABASE_URL}}"
echo -e "${YELLOW}HASURA_GRAPHQL_ADMIN_SECRET${NC}=kiaan_hasura_admin_secret_2024"
echo -e "${YELLOW}HASURA_GRAPHQL_ENABLE_CONSOLE${NC}=true"
echo -e "${YELLOW}HASURA_GRAPHQL_ENABLED_APIS${NC}=metadata,graphql,config"
echo -e "${YELLOW}HASURA_GRAPHQL_DEV_MODE${NC}=true"
echo -e "${YELLOW}HASURA_GRAPHQL_CORS_DOMAIN${NC}=*"
echo ""
read -p "Press Enter when variables are added and Hasura is deployed..."

echo ""
echo "=== Step 6: Generate Hasura Public URL ==="
echo ""
echo "1. Go to Hasura service in Railway"
echo "2. Click 'Settings' → 'Networking'"
echo "3. Click 'Generate Domain'"
echo "4. Copy the generated URL (e.g., kiaan-wms-hasura.up.railway.app)"
echo ""
read -p "Paste the Hasura URL (without https://): " HASURA_URL

echo ""
echo "=== Step 7: Track Tables in Hasura ==="
echo ""
echo "Visit Hasura Console: https://$HASURA_URL/console"
echo "Admin Secret: kiaan_hasura_admin_secret_2024"
echo ""
echo "In the console:"
echo "1. Go to 'Data' tab"
echo "2. Click 'Track All' to track all 21 tables"
echo "3. Go to 'Track all relationships' in each table"
echo ""
read -p "Press Enter when tables are tracked..."

echo ""
echo "=== Step 8: Update Frontend Environment Variables ==="
echo ""
echo "Adding Hasura URL to frontend service..."
echo ""

# Update frontend environment variables
cat > /tmp/railway_frontend_env.txt <<EOF
NEXT_PUBLIC_GRAPHQL_URL=https://$HASURA_URL/v1/graphql
NEXT_PUBLIC_HASURA_ADMIN_SECRET=kiaan_hasura_admin_secret_2024
EOF

echo "Add these variables to your frontend service in Railway:"
echo ""
cat /tmp/railway_frontend_env.txt
echo ""
echo "1. Go to frontend service in Railway"
echo "2. Click 'Variables' tab"
echo "3. Add both variables above"
echo "4. Railway will auto-redeploy"
echo ""
read -p "Press Enter when variables are added..."

echo ""
echo "=== Step 9: Verification ==="
echo ""
echo "Testing backend connection..."
echo ""

# Test Hasura endpoint
echo "1. Testing Hasura GraphQL endpoint..."
curl -X POST https://$HASURA_URL/v1/graphql \
  -H 'Content-Type: application/json' \
  -H 'x-hasura-admin-secret: kiaan_hasura_admin_secret_2024' \
  -d '{"query":"{ Product(limit: 5) { id name sku } }"}' | head -50

echo ""
echo ""
echo "2. Waiting for frontend to redeploy (2-3 minutes)..."
sleep 180

echo ""
echo "3. Testing frontend data loading..."
node /tmp/check_railway_data.js

echo ""
echo "======================================"
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "======================================"
echo ""
echo "Your Railway URLs:"
echo "  Frontend: https://frontend-production-c9100.up.railway.app/"
echo "  Hasura:   https://$HASURA_URL/console"
echo "  GraphQL:  https://$HASURA_URL/v1/graphql"
echo ""
echo "Test these pages:"
echo "  Dashboard:  https://frontend-production-c9100.up.railway.app/dashboard"
echo "  Products:   https://frontend-production-c9100.up.railway.app/products"
echo "  Inventory:  https://frontend-production-c9100.up.railway.app/inventory"
echo "  Orders:     https://frontend-production-c9100.up.railway.app/sales-orders"
echo ""
echo "All pages should now load real data from Railway PostgreSQL!"
echo ""
