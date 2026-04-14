const express = require('express');
const router = express.Router();

const { Pool } = require('pg');

// 🔥 Conexión directa a PostgreSQL (igual que en server.js)
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'perfumes_ne2',
    password: '1234',
    port: 5432,
});

// ================= VALIDAR CUPÓN =================
router.get('/validar/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const subtotal = parseFloat(req.query.subtotal) || 0;

    try {
        const result = await pool.query(
            `SELECT * FROM public.cupones WHERE UPPER(codigo) = UPPER($1)`,
            [codigo.trim()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cupón no encontrado' });
        }

        const cupon = result.rows[0];

        if (!cupon.activo) {
            return res.status(400).json({ error: 'Este cupón no está disponible' });
        }

        const ahora = new Date();

        if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) {
            return res.status(400).json({ error: 'Este cupón aún no está vigente' });
        }

        if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) {
            return res.status(400).json({ error: 'Este cupón ha expirado' });
        }

        if (cupon.usos_maximos !== null && cupon.usos_actuales >= cupon.usos_maximos) {
            return res.status(400).json({ error: 'Este cupón ha alcanzado su límite de usos' });
        }

        if (subtotal < parseFloat(cupon.minimo_compra)) {
            return res.status(400).json({
                error: `Compra mínima de $${parseFloat(cupon.minimo_compra).toFixed(2)}`
            });
        }

        let descuento = 0;
        let envio_gratis = false;

        if (cupon.tipo === 'porcentaje') {
            descuento = subtotal * (parseFloat(cupon.valor) / 100);
        } else if (cupon.tipo === 'monto_fijo') {
            descuento = Math.min(parseFloat(cupon.valor), subtotal);
        } else if (cupon.tipo === 'envio_gratis') {
            envio_gratis = true;
            descuento = 5;
        }

        return res.json({
            valido: true,
            cupon: {
                id: cupon.id,
                codigo: cupon.codigo,
                descripcion: cupon.descripcion,
                tipo: cupon.tipo,
                valor: parseFloat(cupon.valor)
            },
            descuento: parseFloat(descuento.toFixed(2)),
            envio_gratis
        });

    } catch (error) {
        console.error('Error validando cupón:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ================= LISTAR CUPONES =================
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT c.*, u.nombre as creado_por_nombre
             FROM public.cupones c
             LEFT JOIN public.usuarios u ON c.creado_por = u.id
             ORDER BY c.fecha_creacion DESC`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error listando cupones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ================= CREAR CUPÓN =================
router.post('/', async (req, res) => {
    const { codigo, descripcion, tipo, valor, minimo_compra, usos_maximos, fecha_fin, creado_por } = req.body;

    if (!codigo || !tipo || valor === undefined) {
        return res.status(400).json({ error: 'Código, tipo y valor son requeridos' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO public.cupones 
             (codigo, descripcion, tipo, valor, minimo_compra, usos_maximos, fecha_fin, creado_por)
             VALUES (UPPER($1), $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [codigo.trim(), descripcion, tipo, valor, minimo_compra || 0, usos_maximos || null, fecha_fin || null, creado_por || null]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya existe ese cupón' });
        }
        console.error('Error creando cupón:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ================= USAR CUPÓN =================
router.put('/:id/usar', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            `UPDATE public.cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1`,
            [id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Error actualizando uso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ================= DESACTIVAR CUPÓN =================
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            `UPDATE public.cupones SET activo = FALSE WHERE id = $1`,
            [id]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Error desactivando:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;