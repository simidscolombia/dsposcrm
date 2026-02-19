
// Controlador Dummy para PDFs mientras se migra a servicio externo

class PdfController {
    async generateQuotePdf(req, res) {
        try {
            console.log('Solicitud de PDF recibida (DUMMY)');
            // Simulamos que funcionó pero decimos que está deshabilitado
            // O devolvemos un PDF dummy si es necesario
            res.status(503).json({
                success: false,
                message: 'La generación de PDFs está temporalmente deshabilitada en el servidor Serverless. Por favor contacte a soporte.'
            });
        } catch (error) {
            console.error('Error generando PDF:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new PdfController();
