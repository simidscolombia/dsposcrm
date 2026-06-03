#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:4050/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"123456"}' | python3 -c 'import sys,json; print(json.load(sys.stdin).get("token","NONE"))')
echo "TOKEN=$TOKEN"
curl -s http://localhost:4050/api/billing/cross-check \
  -H "Authorization: Bearer $TOKEN" | python3 -c '
import sys, json
d = json.load(sys.stdin)
print("success:", d.get("success"))
s = d.get("stats", {})
print("total_clients:", s.get("total_clients"))
print("al_dia:", s.get("al_dia"))
print("en_mora:", s.get("en_mora"))
print("sin_facturar:", s.get("sin_facturar"))
print("sin_meses:", s.get("sin_meses"))
print("unlinked_count:", len(d.get("unlinkedInvoices", [])))
print("report_count:", len(d.get("report", [])))
if d.get("report"):
    for r in d["report"][:3]:
        print(f"  - {r[\"business_name\"]} | {r[\"cloud_url\"]} | status={r[\"status_check\"]} | invoices={len(r.get(\"invoices\",[]))}")
'
