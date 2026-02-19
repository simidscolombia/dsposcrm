
// Wrapper seguro para cargar la app y capturar errores de inicio
export default async function handler(req, res) {
    try {
        // Importamos server.js dinámicamente para capturar errores de carga
        const module = await import('../backend/src/server.js');
        const app = module.default;

        return app(req, res);
    } catch (error) {
        console.error('CRITICAL SERVERLESS ERROR:', error);
        res.status(500).json({
            status: 'CRASH',
            error: 'La aplicación no pudo iniciar',
            message: error.message,
            stack: error.stack,
            details: error.toString() // Often contains module resolution errors
        });
    }
}
