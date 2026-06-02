-- Migration: Add Wompi payment columns to crm_payments
ALTER TABLE crm_payments ADD COLUMN IF NOT EXISTS wompi_link_id VARCHAR(255);
ALTER TABLE crm_payments ADD COLUMN IF NOT EXISTS wompi_link_url TEXT;
ALTER TABLE crm_payments ADD COLUMN IF NOT EXISTS wompi_reference VARCHAR(255);
ALTER TABLE crm_payments ADD COLUMN IF NOT EXISTS wompi_transaction_id VARCHAR(255);
