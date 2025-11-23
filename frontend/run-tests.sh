#!/bin/bash

echo "======================================"
echo "  KIAAN WMS - Comprehensive Testing"
echo "======================================"
echo ""
echo "📋 Test Suite:"
echo "  1. Authentication & Authorization"
echo "  2. Content Verification (real data)"
echo "  3. CRUD Workflows"
echo ""
echo "🎯 Starting tests..."
echo ""

# Set environment
export NODE_ENV=test
export NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8090/v1/graphql
export NEXT_PUBLIC_HASURA_ADMIN_SECRET=kiaan_hasura_admin_secret_2024

# Kill any existing dev servers
echo "🧹 Cleaning up old processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

# Check if Hasura is running
echo "🔍 Checking Hasura status..."
HASURA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/healthz)

if [ "$HASURA_STATUS" != "200" ]; then
  echo "❌ Hasura is not running on port 8090"
  echo "   Please start Hasura first:"
  echo "   cd /root/kiaan-wms/hasura && docker compose up -d"
  exit 1
fi

echo "✅ Hasura is running"
echo ""

# Run tests
echo "🧪 Running Playwright tests..."
echo ""

npx playwright test \
  --config=playwright.config.ts \
  --reporter=list \
  --reporter=html \
  --reporter=json

TEST_EXIT_CODE=$?

echo ""
echo "======================================"
echo "  Test Results"
echo "======================================"
echo ""

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "⚠️  Some tests failed (exit code: $TEST_EXIT_CODE)"
fi

echo ""
echo "📊 Test reports generated:"
echo "  - HTML: test-results/html/index.html"
echo "  - JSON: test-results/results.json"
echo ""

# Show summary
if [ -f "test-results/results.json" ]; then
  echo "📈 Test Summary:"
  node -e "
    const fs = require('fs');
    try {
      const results = JSON.parse(fs.readFileSync('test-results/results.json', 'utf8'));
      const stats = results.suites.reduce((acc, suite) => {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            test.results.forEach(result => {
              acc[result.status] = (acc[result.status] || 0) + 1;
            });
          });
        });
        return acc;
      }, {});

      console.log('');
      Object.keys(stats).forEach(status => {
        const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️';
        console.log(\`  \${icon} \${status}: \${stats[status]}\`);
      });
      console.log('');
    } catch (e) {
      console.log('  (Summary unavailable)');
    }
  "
fi

# Open HTML report if tests completed
if [ -f "test-results/html/index.html" ]; then
  echo "💡 To view detailed HTML report, open:"
  echo "   file://$(pwd)/test-results/html/index.html"
fi

echo ""
echo "======================================"

exit $TEST_EXIT_CODE
