# Kiaan WMS Session Resume - December 23, 2025

## DOKPLOY CREDENTIALS
```
API Key: fqmDOfkeSKrhEEBkoLcrIeozmDufqsVqyNJXRtPoYtDKuJADodhLXlKrMJBIkWKC
Saved to: ~/.config/dokploy/api_key
URL: dokploy.icywave-b9eebc34.westeurope.azurecontainerapps.io (was not resolving)
```

## GITHUB
- Repo: https://github.com/maanisingh/kiaan-wms.git
- Latest commit: `dd8b3cd` on `main` branch
- Changes pushed but NOT deployed to Dokploy yet

## WHAT WAS COMPLETED

### 1. Auto Weight Calculation (Backend)
- Added `PACKAGING_WEIGHTS` constant in `server.js` (line ~5640)
- Added `calculateTotalWeight()` function that:
  - Calculates product weight from order items
  - Adds packaging weight based on box size (small/medium/large/extra-large)
  - Includes bubble wrap, paper fill, tape, label weights
  - Supports manual weight override
  - Returns detailed breakdown

### 2. Weight Editable at Packing Stage (Frontend)
- Updated `/frontend/app/protected/packing/[id]/page.tsx`
- Added clickable Weight card showing auto-calculated weight
- Added Weight Edit Modal with:
  - Weight breakdown (Products | Packaging | Total)
  - Packaging details (box type, bubble wrap, paper fill, tape & label)
  - Manual weight override input
  - Reset to auto-calculated button

### 3. UK Carrier Rate Tables
- Added real UK carrier pricing in `server.js`:
  - Royal Mail, Parcelforce, DPD, Evri, Yodel, DHL, UPS, FedEx, Amazon Logistics
- Weight-based pricing with estimated delivery days

### 4. Shipment Detail Page
- Updated `/frontend/app/protected/shipments/[id]/page.tsx`
- Shows real data from API (not mock)
- Displays weight breakdown and rate comparison

## FILES MODIFIED (in commit dd8b3cd)
- backend/server.js
- backend/prisma/schema.prisma
- frontend/app/protected/dashboard/page.tsx
- frontend/app/protected/integrations/channels/page.tsx
- frontend/app/protected/integrations/mappings/page.tsx
- frontend/app/protected/integrations/page.tsx
- frontend/app/protected/packing/[id]/page.tsx
- frontend/app/protected/sales-orders/[id]/page.tsx
- frontend/app/protected/sales-orders/page.tsx
- frontend/app/protected/settings/page.tsx
- frontend/app/protected/shipments/[id]/page.tsx

## DOCKER CONTAINERS
```
Frontend: compose-calculate-cross-platform-alarm-jfo2b6-kiaan-wms-frontend-1
Backend: compose-calculate-cross-platform-alarm-jfo2b6-kiaan-wms-backend-1
```
Both were restarted locally but Dokploy deployment pending.

## PENDING TASK
- Deploy to Dokploy using new API key
- Dokploy URL was not resolving - may need correct URL

## PROMPT TO RESUME
```
Continue the Kiaan WMS session. Read /root/kiaan-wms-frontend/RESUME_SESSION.md for context.

Last task: Deploy to Dokploy. The code is committed and pushed to GitHub (commit dd8b3cd).
New Dokploy API key was provided: fqmDOfkeSKrhEEBkoLcrIeozmDufqsVqyNJXRtPoYtDKuJADodhLXlKrMJBIkWKC
Need to trigger deployment to make changes live.

Features implemented:
1. Auto weight calculation (products + packaging materials)
2. Weight editable at packing stage with breakdown modal
3. UK carrier rate tables with real pricing
4. Shipment detail page with real data
```
