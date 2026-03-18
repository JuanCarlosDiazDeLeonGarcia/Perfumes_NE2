// ============================
// RUTAS CRUD - PROVEEDORES
// Archivo: proveedores.js (raíz del proyecto, junto a server.js)
// ============================

module.exports = function(app, pool) {


    // ── GET todos ─────────────────────────────────────────────────
    app.get('/api/proveedores', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT * FROM proveedores ORDER BY id ASC'
            );
            res.json(result.rows);
        } catch (err) {
            console.error('Error GET proveedores:', err.message);
            res.status(500).json({ error: 'Error al obtener proveedores' });
        }
    });

    // ── GET uno por ID ────────────────────────────────────────────
    app.get('/api/proveedores/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await pool.query(
                'SELECT * FROM proveedores WHERE id = $1', [id]
            );
            if (result.rows.length === 0)
                return res.status(404).json({ error: 'Proveedor no encontrado' });
            res.json(result.rows[0]);
        } catch (err) {
            console.error('Error GET proveedor por ID:', err.message);
            res.status(500).json({ error: 'Error al obtener proveedor' });
        }
    });

    // ── POST crear ────────────────────────────────────────────────
    app.post('/api/proveedores', async (req, res) => {
        const { nombre, contacto, email, telefono, ciudad, pais } = req.body;

        if (!nombre || !contacto || !email || !telefono || !ciudad || !pais)
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });

        try {
            const result = await pool.query(
                `INSERT INTO proveedores (nombre, contacto, email, telefono, ciudad, pais)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [nombre, contacto, email, telefono, ciudad, pais]
            );
            console.log('➕ Proveedor creado:', result.rows[0].nombre);
            res.status(201).json({ mensaje: 'Proveedor creado exitosamente ✅', proveedor: result.rows[0] });
        } catch (err) {
            console.error('Error POST proveedor:', err.message);
            res.status(500).json({ error: 'Error al crear proveedor' });
        }
    });

    // ── PUT actualizar ────────────────────────────────────────────
    app.put('/api/proveedores/:id', async (req, res) => {
        const { id } = req.params;
        const { nombre, contacto, email, telefono, ciudad, pais } = req.body;

        if (!nombre || !contacto || !email || !telefono || !ciudad || !pais)
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });

        try {
            const existe = await pool.query(
                'SELECT id FROM proveedores WHERE id = $1', [id]
            );
            if (existe.rows.length === 0)
                return res.status(404).json({ error: 'Proveedor no encontrado' });

           const result = await pool.query(
    `UPDATE proveedores
     SET nombre=$1, contacto=$2, email=$3, telefono=$4,
         ciudad=$5, pais=$6
     WHERE id=$7
     RETURNING *`,
    [nombre, contacto, email, telefono, ciudad, pais, id]
);
            console.log('✏️ Proveedor actualizado:', result.rows[0].nombre);
            res.json({ mensaje: 'Proveedor actualizado exitosamente ✅', proveedor: result.rows[0] });
        } catch (err) {
            console.error('Error PUT proveedor:', err.message);
            res.status(500).json({ error: 'Error al actualizar proveedor' });
        }
    });

    // ── DELETE eliminar ───────────────────────────────────────────
    app.delete('/api/proveedores/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const existe = await pool.query(
                'SELECT nombre FROM proveedores WHERE id = $1', [id]
            );
            if (existe.rows.length === 0)
                return res.status(404).json({ error: 'Proveedor no encontrado' });

            await pool.query('DELETE FROM proveedores WHERE id = $1', [id]);
            console.log('🗑️ Proveedor eliminado:', existe.rows[0].nombre);
            res.json({ mensaje: 'Proveedor eliminado exitosamente ✅' });
        } catch (err) {
            console.error('Error DELETE proveedor:', err.message);
            res.status(500).json({ error: 'Error al eliminar proveedor' });
        }
    });

};