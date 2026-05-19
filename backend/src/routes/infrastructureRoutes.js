import { Router } from 'express';
import controller from '../controllers/infrastructureController.js';

const router = Router();

router.get('/overview', controller.getOverview);
router.get('/servers', controller.getServers);
router.get('/clusters', controller.getClusters);
router.get('/pos-clients', controller.getPosClients);
router.get('/orphans', controller.getOrphans);
router.get('/stats', controller.getStats);
router.put('/pos-clients/:id', controller.updatePosClient);
router.post('/audit-integrity', controller.auditIntegrity);

// Level 1: PM2
router.get('/pm2/:server_id', controller.getPm2Status);
router.post('/pm2/:server_id/:action', controller.pm2Action);
router.get('/pm2/:server_id/logs/:process_name', controller.pm2Logs);

// Level 2: File System
router.post('/fs/:server_id/list', controller.fsList);
router.post('/fs/:server_id/read', controller.fsRead);
router.post('/fs/:server_id/write', controller.fsWrite);

// Level 3: MongoDB Explorer
router.get('/mongo/clusters', controller.mongoGetClusters);
router.get('/mongo/:cluster_id/dbs', controller.mongoListDbs);
router.get('/mongo/:cluster_id/:db_name/collections', controller.mongoListCollections);
router.get('/mongo/activity/:cluster_id/:db_name', controller.mongoGetDbActivity);
router.get('/mongo/:cluster_id/:db_name/:col_name/documents', controller.mongoGetDocuments);
router.put('/mongo/:cluster_id/:db_name/:col_name/:doc_id', controller.mongoUpdateDocument);
router.delete('/mongo/:cluster_id/:db_name/:col_name/:doc_id', controller.mongoDeleteDocument);

router.get('/clients/:id/backup', controller.backupClient);
router.post('/clients/:id/restore', controller.restoreClient);
router.delete('/clients/:id', controller.deleteClient);

export default router;
