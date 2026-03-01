
// proveedores.js

module.exports = (app, pool) => {
    // GET - todos los proveedores
    app.get('/api/proveedores', async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT id, nombre, telefono, email, direccion FROM proveedores ORDER BY id ASC'
            );
            res.json(result.rows);
        } catch (error) {
            console.error('Error al obtener proveedores:', error);
            res.status(500).json({ message: 'Error al obtener proveedores' });
        }
    });

    // GET - proveedor por id
    app.get('/api/proveedores/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await pool.query(
                'SELECT id, nombre, telefono, email, direccion FROM proveedores WHERE id = $1',
                [id]
            );
            if (result.rows.length === 0)
                return res.status(404).json({ message: 'Proveedor no encontrado' });
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error al obtener proveedor:', error);
            res.status(500).json({ message: 'Error al obtener proveedor' });
        }
    });

    // POST - crear proveedor
    app.post('/api/proveedores', async (req, res) => {
        const { nombre, telefono, email, direccion } = req.body;
        try {
            const result = await pool.query(
                `INSERT INTO proveedores (nombre, telefono, email, direccion)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, nombre, telefono, email, direccion`,
                [nombre, telefono, email, direccion]
            );
            res.status(201).json({
                message: 'Proveedor creado exitosamente',
                proveedor: result.rows[0]
            });
        } catch (error) {
            console.error('Error al crear proveedor:', error);
            res.status(500).json({ message: 'Error al crear proveedor' });
        }
    });

    // PUT - actualizar proveedor
    app.put('/api/proveedores/:id', async (req, res) => {
        const { id } = req.params;
        const { nombre, telefono, email, direccion } = req.body;
        try {
            const result = await pool.query(
                `UPDATE proveedores
                 SET nombre=$1, telefono=$2, email=$3, direccion=$4
                 WHERE id=$5
                 RETURNING id, nombre, telefono, email, direccion`,
                [nombre, telefono, email, direccion, id]
            );
            if (result.rows.length === 0)
                return res.status(404).json({ message: 'Proveedor no encontrado' });
            res.json({ message: 'Proveedor actualizado', proveedor: result.rows[0] });
        } catch (error) {
            console.error('Error al actualizar proveedor:', error);
            res.status(500).json({ message: 'Error al actualizar proveedor' });
        }
    });

    // DELETE - eliminar proveedor
    app.delete('/api/proveedores/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const result = await pool.query(
                'DELETE FROM proveedores WHERE id=$1 RETURNING id',
                [id]
            );
            if (result.rows.length === 0)
                return res.status(404).json({ message: 'Proveedor no encontrado' });
            res.json({ message: 'Proveedor eliminado' });
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            res.status(500).json({ message: 'Error al eliminar proveedor' });
        }
    });
};
