-- Infrastructure Tables Migration for CRM
-- Creates the 4 infrastructure tables needed for the cloud management module

CREATE TABLE IF NOT EXISTS infrastructure_servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ip VARCHAR(45) NOT NULL,
    provider VARCHAR(100) DEFAULT 'DigitalOcean',
    region VARCHAR(50),
    total_clients INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS infrastructure_clusters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255),
    uri TEXT,
    tier VARCHAR(50) DEFAULT 'M0',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS infrastructure_pos_clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    domain VARCHAR(255),
    server_id INTEGER REFERENCES infrastructure_servers(id),
    server_name VARCHAR(100),
    cluster_id INTEGER REFERENCES infrastructure_clusters(id),
    cluster_name VARCHAR(100),
    db_name VARCHAR(150),
    db_size_mb NUMERIC(10,2) DEFAULT 0,
    port INTEGER,
    owner_name VARCHAR(150),
    owner_phone VARCHAR(50),
    owner_email VARCHAR(150),
    notes TEXT,
    status VARCHAR(30) DEFAULT 'active',
    has_link BOOLEAN DEFAULT false,
    has_system BOOLEAN DEFAULT false,
    has_db BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS infrastructure_data (
    id SERIAL PRIMARY KEY,
    payload JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seed known servers
INSERT INTO infrastructure_servers (name, ip, provider, status) 
SELECT 'Server01', '24.144.114.69', 'DigitalOcean', 'active'
WHERE NOT EXISTS (SELECT 1 FROM infrastructure_servers WHERE ip = '24.144.114.69');

INSERT INTO infrastructure_servers (name, ip, provider, status) 
SELECT 'Server02', '104.248.238.193', 'DigitalOcean', 'active'
WHERE NOT EXISTS (SELECT 1 FROM infrastructure_servers WHERE ip = '104.248.238.193');

INSERT INTO infrastructure_servers (name, ip, provider, status) 
SELECT 'Server-simids-pos', '134.209.115.74', 'DigitalOcean', 'active'
WHERE NOT EXISTS (SELECT 1 FROM infrastructure_servers WHERE ip = '134.209.115.74');

INSERT INTO infrastructure_servers (name, ip, provider, status) 
SELECT 'Server-CRM', '147.182.173.202', 'DigitalOcean', 'active'
WHERE NOT EXISTS (SELECT 1 FROM infrastructure_servers WHERE ip = '147.182.173.202');
