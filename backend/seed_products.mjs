// Script para actualizar el catálogo usando la API REST
import fetch from 'node-fetch';
const API_URL = 'https://dspos.vercel.app/api';

const PRODUCTS = [
    // === COMBOS ===
    { name: 'Sistema POS PRO - Táctil', description: 'Equipo Táctil Core i3 Gen 15.6" 4GB SSD 120GB + Cajón + Lector Omni + Impresora 80mm + Software POS Multicaja Vitalicio. Instalación y pago contra entrega.', price: 2850000, category: 'Combos', image_url: '/products/pos-pro.png', stock: 5 },
    { name: 'Sistema POS Avanzado', description: 'Equipo Corporativo Core i5 20/22" 8GB RAM SSD 240GB + Kit POS (Cajón + Lector Omni + Impresora 80mm) + Software POS Multicaja Vitalicio. Soporte gratis de por vida.', price: 2350000, category: 'Combos', image_url: '/products/pos-avanzado.png', stock: 8 },
    { name: 'Sistema POS Básico', description: 'Equipo Corporativo Core i5 19" 8GB RAM SSD 240GB + Kit POS (Cajón + Lector 1D + Impresora 58mm) + Software POS Monocaja Vitalicio. Pago contra entrega.', price: 1450000, category: 'Combos', image_url: '/products/pos-basico.png', stock: 10 },

    // === SOFTWARE ===
    { name: 'Software POS Mono-Caja (1 PC)', description: 'Licencia vitalicia. Facturación, Ventas, Inventarios, Kardex, Cierre de caja. Capacitación y soporte gratuitos. Un solo pago.', price: 450000, category: 'Software', image_url: '/products/software-pos.png', stock: 999 },
    { name: 'Software POS Multi-Caja', description: 'Licencia vitalicia para múltiples puntos de venta. Facturación, Ventas, Inventarios, Kardex, Cierre de caja. Capacitación y soporte gratuitos.', price: 650000, category: 'Software', image_url: '/products/software-pos.png', stock: 999 },

    // === SEGURIDAD ===
    { name: 'Kit Cámaras Seguridad 4 Full HD', description: 'Kit HiLook by Hikvision: DVR 8ch + 4 cámaras 1080p (bullet + domo) + Cable + Rack. Configuración celular e instalación incluida.', price: 1150000, category: 'Seguridad', image_url: '/products/camaras-seguridad.png', stock: 3 },

    // === HARDWARE INDIVIDUAL ===
    { name: 'Computador All-in-One Táctil 15.6"', description: 'Equipo táctil All-in-One Core i3, pantalla 15.6", 4GB RAM, SSD 120GB.', price: 1500000, category: 'Hardware', image_url: '/products/pos-pro.png', stock: 10 },
    { name: 'Impresora Térmica 80mm', description: 'Impresora POS térmica de recibos 80mm, conexión USB, alta velocidad.', price: 350000, category: 'Hardware', image_url: '/products/pos-avanzado.png', stock: 50 },
    { name: 'Impresora Térmica 58mm', description: 'Impresora POS térmica compacta 58mm, conexión USB.', price: 180000, category: 'Hardware', image_url: '/products/pos-basico.png', stock: 30 },
    { name: 'Lector Código de Barras Omni', description: 'Lector omnidireccional 1D/2D tipo domo, conexión USB.', price: 280000, category: 'Hardware', image_url: '/products/pos-avanzado.png', stock: 20 },
    { name: 'Lector Código de Barras 1D Láser', description: 'Lector láser 1D con base/soporte, conexión USB.', price: 120000, category: 'Hardware', image_url: '/products/pos-basico.png', stock: 25 },
    { name: 'Cajón Monedero', description: 'Cajón monedero metálico, 4 compartimentos, apertura automática o llave.', price: 180000, category: 'Hardware', image_url: '/products/pos-avanzado.png', stock: 15 },

    // === SERVICIOS ===
    { name: 'Mensualidad Nube POS', description: 'Servicio mensual de nube para POS. Acceso remoto, backups, actualizaciones.', price: 50000, category: 'Servicios', image_url: '/products/software-pos.png', stock: 999 },
];

async function run() {
    console.log('🚀 Actualizando catálogo en producción...\n');

    // 1. Delete existing products
    try {
        const existingRes = await fetch(`${API_URL}/products`);
        const existingData = await existingRes.json();
        if (existingData.success && existingData.products) {
            for (const p of existingData.products) {
                await fetch(`${API_URL}/products/${p.id}`, { method: 'DELETE' });
                console.log(`  🗑️  Eliminado: ${p.name}`);
            }
        }
    } catch (e) {
        console.log('  ⚠️ No se pudieron eliminar productos existentes:', e.message);
    }

    // 2. Create new products
    console.log('\n📦 Creando productos nuevos...\n');
    for (const prod of PRODUCTS) {
        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prod)
            });
            const data = await res.json();
            if (data.success || data.product) {
                console.log(`  ✅ ${prod.name} - $${prod.price.toLocaleString('es-CO')}`);
            } else {
                console.log(`  ❌ ${prod.name}: ${data.error || 'Error desconocido'}`);
            }
        } catch (error) {
            console.log(`  ❌ ${prod.name}: ${error.message}`);
        }
    }

    console.log(`\n🎉 ¡Catálogo actualizado con ${PRODUCTS.length} productos!`);
}

run();
