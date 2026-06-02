import express from 'express';
import cloudController from '../controllers/cloudController.js';

const router = express.Router();

// Live streaming log SSE
router.get('/deploy/stream', cloudController.getDeployStream);

// List cloud instances (clients catalogs)
router.get('/instances', cloudController.getInstances);

// List installed clients on VPS filesystem
router.get('/installed', cloudController.getInstalledClients);

// Deploy existing clients
router.post('/deploy', cloudController.deployInstance);

// Quick PM2 actions (restart/stop/start/delete)
router.post('/action', cloudController.executeAction);

// Get cluster configurations list
router.get('/clusters', cloudController.getClusters);

// Query cluster storage size and status
router.get('/cluster/status', cloudController.getClusterStatus);

// Create, seed database and deploy a brand new client
router.post('/clients/create', cloudController.createAndDeployClient);

// Patch Management Endpoints
router.get('/patches', cloudController.getPatches);
router.post('/patches/apply', cloudController.applyPatch);

export default router;
