#!/bin/bash
cd /var/www/simids-crm

# Fix CloudTab.jsx - remove /api prefix from infrastructure paths
sed -i "s|const API = '/api/infrastructure';|const API = '/infrastructure';|g" frontend/src/components/Admin/CloudTab.jsx
sed -i "s|'/api/clients/sync-from-infra'|'/clients/sync-from-infra'|g" frontend/src/components/Admin/CloudTab.jsx
sed -i "s|'/api/infrastructure/audit-integrity'|'/infrastructure/audit-integrity'|g" frontend/src/components/Admin/CloudTab.jsx
sed -i "s|/api/infrastructure/pm2/|/infrastructure/pm2/|g" frontend/src/components/Admin/CloudTab.jsx
sed -i "s|/api/infrastructure/mongo/|/infrastructure/mongo/|g" frontend/src/components/Admin/CloudTab.jsx

# Fix CRMClients.jsx - remove /api prefix
sed -i "s|const API_URL = '/api';|const API_URL = '';|g" frontend/src/pages/admin/CRMClients.jsx

# Build
cd frontend && npm run build

# Restart
pm2 restart simids-crm

echo "DONE - API paths fixed and deployed"
