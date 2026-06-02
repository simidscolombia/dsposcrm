import cloudController from './src/controllers/cloudController.js';
import dotenv from 'dotenv';
dotenv.config();

cloudController.sendSSE = (data) => {
  console.log('[SSE] ->', data.message || data);
};

async function forceClone() {
  const folderName = 'harsoma1';
  const cloneFrom = 'harsoma';
  
  console.log(`Forzando clonación de ${cloneFrom} a ${folderName} en un nuevo clúster...`);

  const preciseData = cloudController._getPreciseData();
  const sourceClient = preciseData.find(c => c.folderName === cloneFrom);

  if (!sourceClient) throw new Error(`Source client ${cloneFrom} not found`);
  
  const cloneFromUri = sourceClient.mongoUri || sourceClient.envVars.DB_CNN;
  
  // Usamos el clúster de restaurantes porque simids5 está lleno (500/500)
  const destDbCnn = `mongodb+srv://restaurantes:Rp96sjhyiYsUsJeC@restaurantes.rzc5oqb.mongodb.net/simids_harsoma1`;

  // 2. Clone database
  await cloudController.seedNewClientDatabase(folderName, destDbCnn, cloneFromUri);

  // 3. Update or Add to preciseData so it uses the new DB
  let destClient = preciseData.find(c => c.folderName === folderName);
  const portNumber = destClient ? parseInt(destClient.port) : await cloudController._getNextFreePort();
  
  if (destClient) {
      destClient.mongoUri = destDbCnn;
      if (!destClient.envVars) destClient.envVars = {};
      destClient.envVars.DB_CNN = destDbCnn;
  } else {
      destClient = {
          folderName,
          port: portNumber,
          envVars: {
              PORT: String(portNumber),
              DB_CNN: destDbCnn,
              SECRET_SEED_JWT: 'v2_' + folderName
          }
      };
      preciseData.push(destClient);
  }
  cloudController._savePreciseData(preciseData);

  const clientObj = {
      folderName,
      envVars: destClient.envVars
  };

  const ok = await cloudController.deployClientWorker(clientObj, 1, 1, portNumber);
  
  if (ok) {
      console.log('✅ Despliegue completado con éxito!');
      await cloudController.sshExec('pm2 save 2>/dev/null || true');
      await cloudController.sshExec('systemctl reload nginx 2>/dev/null || true');
      console.log('🔄 Nginx recargado.');
  } else {
      console.log('❌ Falló el despliegue.');
  }
}

forceClone().catch(console.error);
