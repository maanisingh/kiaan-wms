# Kiaan WMS - Quick Reference (Nov 23, 2024)

## 🎯 Current Status: Phase 1 Complete (100%)

### Production URLs
- **Frontend:** https://frontend-production-32b8.up.railway.app
- **GraphQL API:** https://hasura-wms.alexandratechlab.com/v1/graphql
- **Hasura Console:** https://hasura-wms.alexandratechlab.com/console
- **Admin Secret:** `kiaan_hasura_admin_secret_2024`

### All 12 Entity Pages Live ✅
1. `/products` - Products CRUD
2. `/sales` - Sales Orders
3. `/customers` - Customer Management
4. `/suppliers` - Supplier Management
5. `/products/brands` - Brand Management
6. `/warehouses` - Warehouse Management
7. `/warehouses/locations` - Location Management
8. `/inventory` - Inventory Tracking
9. `/products/bundles` - **Bundle Management (NEW)**
10. `/picking` - **Pick List Workflow (NEW)**
11. `/transfers` - **Transfer Operations (NEW)**
12. `/warehouses/zones` - **Zone Management (NEW)**

### Database Connection
```bash
PGPASSWORD=wms_secure_password_2024 psql -h localhost -p 5439 -U wms_user -d kiaan_wms
```

### Git Repository
- **Remote:** https://github.com/maanisingh/kiaan-wms.git
- **Branch:** main
- **Last Commit:** Zones CRUD (100% complete)

### Quick Testing Commands

```bash
# Test all 12 entity pages
for path in products sales customers suppliers products/brands warehouses warehouses/locations inventory products/bundles picking transfers warehouses/zones; do
  echo "Testing /$path..."
  curl -s -o /dev/null -w "%{http_code}" "https://frontend-production-32b8.up.railway.app/$path"
  echo ""
done

# Test GraphQL (requires admin secret)
curl -s -X POST "https://hasura-wms.alexandratechlab.com/v1/graphql" \
  -H "Content-Type: application/json" \
  -H "x-hasura-admin-secret: kiaan_hasura_admin_secret_2024" \
  -d '{"query": "query { Zone(limit: 1) { id name } }"}' | jq '.'
```

### Hasura Management Scripts

All scripts saved in `/tmp/`:
- `/tmp/track_production_tables.sh` - Track all tables in Hasura
- `/tmp/create_relationships.sh` - Create all GraphQL relationships
- `/tmp/final_test.sh` - Test all 12 entities

### Key Technical Patterns

```typescript
// UUID Generation
const uuid = crypto.randomUUID();

// Required companyId
companyId: '53c65d84-4606-4b0a-8aa5-6eda9e50c3df'

// Timestamps
updatedAt: new Date().toISOString()

// GraphQL Query Pattern
const { data, loading, refetch } = useQuery(GET_ZONES, {
  variables: { limit: 100, offset: 0 }
});

// GraphQL Mutation Pattern
const [createZone] = useMutation(CREATE_ZONE, {
  onCompleted: () => {
    message.success('Zone created!');
    refetch();
  }
});
```

### Phase 2 Recommendations

Top priority features to consider:
1. **User Authentication** - Login/logout, JWT tokens
2. **Role-Based Access Control** - Admin, Manager, Operator roles
3. **Inventory Reporting** - Charts, dashboards, exports
4. **Barcode Scanning** - Mobile picking workflow
5. **Integrations** - ShipStation, Amazon FBA

### Important Notes

- All pages use Ant Design components
- GraphQL uses Hasura with PostgreSQL backend
- Railway auto-deploys from GitHub main branch
- All relationships are configured and working
- Production data is present and accessible

---

**Last Updated:** November 23, 2024
**Phase:** 1 Complete (12/12 entities)
**Next Session:** Ready for Phase 2 planning
