import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const router = express.Router();

const ENV_PATH = path.resolve(process.cwd(), '.env');

// Helper to update .env
const updateEnvFile = (updates) => {
    let envContent = '';
    if (fs.existsSync(ENV_PATH)) {
        envContent = fs.readFileSync(ENV_PATH, 'utf8');
    }

    const lines = envContent.split('\n');
    const newLines = [];
    const keysUpdated = new Set();

    for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1];
            if (updates[key] !== undefined) {
                newLines.push(`${key}=${updates[key]}`);
                keysUpdated.add(key);
            } else {
                newLines.push(line);
            }
        } else {
            newLines.push(line);
        }
    }

    // Add keys that weren't in the file
    for (const [key, value] of Object.entries(updates)) {
        if (!keysUpdated.has(key)) {
            newLines.push(`${key}=${value}`);
        }
    }

    fs.writeFileSync(ENV_PATH, newLines.join('\n'));
};

// GET status of gateways
router.get('/status', (req, res) => {
    try {
        const config = {
            wompi_env: process.env.WOMPI_ENV || 'sandbox',
            wompi_pub_sandbox: process.env.WOMPI_PUB_KEY_SANDBOX || '',
            wompi_prv_sandbox: process.env.WOMPI_PRV_KEY_SANDBOX || '',
            wompi_events_sandbox: process.env.WOMPI_EVENTS_SECRET_SANDBOX || '',
            wompi_integrity_sandbox: process.env.WOMPI_INTEGRITY_SECRET_SANDBOX || '',
            wompi_pub_prod: process.env.WOMPI_PUB_KEY || '',
            wompi_prv_prod: process.env.WOMPI_PRV_KEY || '',
            wompi_events_prod: process.env.WOMPI_EVENTS_SECRET || '',
            wompi_integrity_prod: process.env.WOMPI_INTEGRITY_SECRET || '',
            bold_api_key: process.env.BOLD_API_KEY || '',
            payment_warning_msg: process.env.PAYMENT_WARNING_MSG || 'Su pago está próximo a vencer. Por favor, póngase al día para evitar la suspensión del servicio.',
            payment_lock_msg: process.env.PAYMENT_LOCK_MSG || 'El sistema ha sido bloqueado por falta de pago. Por favor, realice su pago inmediatamente para restaurar el servicio.'
        };

        const status = {
            wompi: !!(config.wompi_pub_sandbox || config.wompi_pub_prod),
            wompi_env: config.wompi_env,
            bold: !!config.bold_api_key
        };

        res.json({ success: true, config, status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update gateway config
router.put('/', (req, res) => {
    try {
        const {
            wompi_env,
            wompi_pub_sandbox, wompi_prv_sandbox, wompi_events_sandbox, wompi_integrity_sandbox,
            wompi_pub_prod, wompi_prv_prod, wompi_events_prod, wompi_integrity_prod,
            bold_api_key,
            payment_warning_msg,
            payment_lock_msg
        } = req.body;

        const updates = {
            WOMPI_ENV: wompi_env || 'sandbox',
            WOMPI_PUB_KEY_SANDBOX: wompi_pub_sandbox || '',
            WOMPI_PRV_KEY_SANDBOX: wompi_prv_sandbox || '',
            WOMPI_EVENTS_SECRET_SANDBOX: wompi_events_sandbox || '',
            WOMPI_INTEGRITY_SECRET_SANDBOX: wompi_integrity_sandbox || '',
            WOMPI_PUB_KEY: wompi_pub_prod || '',
            WOMPI_PRV_KEY: wompi_prv_prod || '',
            WOMPI_EVENTS_SECRET: wompi_events_prod || '',
            WOMPI_INTEGRITY_SECRET: wompi_integrity_prod || '',
            BOLD_API_KEY: bold_api_key || '',
            PAYMENT_WARNING_MSG: payment_warning_msg || '',
            PAYMENT_LOCK_MSG: payment_lock_msg || ''
        };

        updateEnvFile(updates);

        res.json({ success: true, message: 'Configuration saved. Restarting server...' });

        // Restart PM2 to apply changes
        setTimeout(() => {
            exec('pm2 restart simids-crm', (error) => {
                if (error) console.error('Failed to restart PM2:', error);
            });
        }, 1000);

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
