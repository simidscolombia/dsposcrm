#!/bin/bash
cd /var/www/simids-crm
sed -i 's/v6.7 - SYMBOLIC REBUILD/v6.8 - SYMBOLIC REBUILD/g' frontend/src/App.jsx
grep -n 'V6' frontend/src/App.jsx | head -5
sed -i 's/V6.7/V6.8/g' frontend/src/App.jsx
cd frontend && npm run build
pm2 restart simids-crm
echo "DONE - version updated to v6.8"
