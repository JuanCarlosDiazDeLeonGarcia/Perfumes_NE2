
let restockProductoId   = null;
let restockNombreActual = '';

// <button onclick="abrirRestock(${p.id}, '${p.nombre}', ${p.stock})">🔄 Restock</button>
function abrirRestock(productoId, nombreProducto, stockActual) {
    restockProductoId   = productoId;
    restockNombreActual = nombreProducto;

    document.getElementById('restockNombre').textContent  = nombreProducto;
    document.getElementById('restockStock').textContent   = stockActual + ' unidades';
    document.getElementById('restockCantidad').value      = 10;
    document.getElementById('restockMotivo').value        = '';
    document.getElementById('modalRestock').style.display = 'flex';
}

// Cierra el modal
function cerrarRestock() {
    document.getElementById('modalRestock').style.display = 'none';
    restockProductoId = null;
}

// Confirmar restock → llama al servidor → WhatsApp llega a Juan Carlos
async function confirmarRestock() {
    const cantidad = parseInt(document.getElementById('restockCantidad').value);
    const motivo   = document.getElementById('restockMotivo').value.trim();

    if (!cantidad || cantidad < 1) {
        alert('⚠️ Ingresa una cantidad válida (mínimo 1)');
        return;
    }

    const btn = document.getElementById('btnConfirmarRestock');
    btn.textContent = '⏳ Enviando...';
    btn.disabled    = true;

    try {
        const response = await fetch(`http://localhost:3000/api/restock/${restockProductoId}`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ cantidad, motivo })
        });

        const data = await response.json();

        if (data.success) {
            alert(
                `✅ ¡Restock exitoso!\n\n` +
                `📦 Producto: ${data.producto}\n` +
                `📊 Stock anterior: ${data.stock_anterior}\n` +
                `✅ Stock nuevo: ${data.stock_nuevo}\n\n` +
                `📱 WhatsApp enviado a Juan Carlos`
            );
            cerrarRestock();
            // Recarga la tabla de productos si tienes esa función
            if (typeof cargarProductos === 'function') cargarProductos();
        } else {
            alert('❌ Error: ' + (data.error || 'Error desconocido'));
        }
    } catch (error) {
        alert('❌ Error de conexión: ' + error.message);
    } finally {
        btn.textContent = '✅ Confirmar y Notificar';
        btn.disabled    = false;
    }
}