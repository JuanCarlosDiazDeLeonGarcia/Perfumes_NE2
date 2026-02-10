const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'perfumes_ne2',
    password: '1234',
    port: 5432,
});

// Test de conexión
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error al conectar a PostgreSQL:', err.stack);
        return;
    }
    console.log('✅ Conectado a PostgreSQL - Base de datos: perfumes_ne2');
    release();
});


app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname, '..')));


app.get('/', (req, res) => {
    res.send('🚀 Backend Perfumes NE2 funcionando correctamente');
});

app.get('/api', (req, res) => {
    res.json({
        status: 'ok',
        message: '📡 API Perfumes NE2 activa'
    });
});


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    console.log('📧 Intento de login:', email);

    try {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('❌ Usuario no encontrado:', email);
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }

        const usuario = result.rows[0];
        console.log('✅ Usuario encontrado:', usuario.nombre, '- Rol:', usuario.rol);

        // Validación de contraseñas
        let passwordValida = false;

        if (email === 'admin@perfumesne2.com' && password === 'admin123') {
            passwordValida = true;
        } else if (email === 'juan@perfumesne2.com' && password === 'vendedor123') {
            passwordValida = true;
        } else if (email === 'maria@perfumesne2.com' && password === 'vendedor123') {
            passwordValida = true;
        } else if (email === 'fernando@perfumesne2.com' && password === 'admin123') {
            passwordValida = true;
        }

        if (!passwordValida) {
            console.log('❌ Contraseña incorrecta para:', email);
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }

        // Verificar que esté activo
        if (!usuario.activo) {
            console.log('⚠️ Usuario inactivo:', email);
            return res.status(401).json({ message: 'Usuario inactivo. Contacta al administrador.' });
        }

        console.log('🎉 Login exitoso para:', usuario.nombre);

        const { password_hash, ...usuarioSinPassword } = usuario;

        res.json({
            message: 'Login exitoso',
            usuario: usuarioSinPassword
        });

    } catch (error) {
        console.error('💥 Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});



// GET - Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre, email, telefono, rol, activo, ultimo_login, fecha_creacion FROM usuarios ORDER BY id ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
});

// GET - Obtener un usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT id, nombre, email, telefono, rol, activo, ultimo_login, fecha_creacion FROM usuarios WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
});

// POST - Crear nuevo usuario
app.post('/api/usuarios', async (req, res) => {
    const { nombre, email, password, telefono, rol, activo } = req.body;

    try {
        const emailExiste = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email]
        );

        if (emailExiste.rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        const passwordHash = '$2b$10$' + password;

        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, password_hash, telefono, rol, activo)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, nombre, email, telefono, rol, activo, fecha_creacion`,
            [nombre, email, passwordHash, telefono, rol, activo]
        );

        console.log('➕ Usuario creado:', result.rows[0].nombre);

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
});

// PUT - Actualizar usuario
app.put('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, email, password, telefono, rol, activo } = req.body;

    try {
        const usuarioExiste = await pool.query(
            'SELECT id FROM usuarios WHERE id = $1',
            [id]
        );

        if (usuarioExiste.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const emailEnUso = await pool.query(
            'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
            [email, id]
        );

        if (emailEnUso.rows.length > 0) {
            return res.status(400).json({ message: 'El email ya está en uso por otro usuario' });
        }

        let query;
        let params;

        if (password) {
            const passwordHash = '$2b$10$' + password;
            query = `
                UPDATE usuarios
                SET nombre=$1, email=$2, password_hash=$3, telefono=$4, rol=$5, activo=$6, fecha_actualizacion=CURRENT_TIMESTAMP
                WHERE id=$7
                RETURNING id, nombre, email, telefono, rol, activo, fecha_actualizacion
            `;
            params = [nombre, email, passwordHash, telefono, rol, activo, id];
        } else {
            query = `
                UPDATE usuarios
                SET nombre=$1, email=$2, telefono=$3, rol=$4, activo=$5, fecha_actualizacion=CURRENT_TIMESTAMP
                WHERE id=$6
                RETURNING id, nombre, email, telefono, rol, activo, fecha_actualizacion
            `;
            params = [nombre, email, telefono, rol, activo, id];
        }

        const result = await pool.query(query, params);

        console.log('✏️ Usuario actualizado:', result.rows[0].nombre);

        res.json({
            message: 'Usuario actualizado exitosamente',
            usuario: result.rows[0]
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
});

// DELETE - Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const usuarioExiste = await pool.query(
            'SELECT nombre FROM usuarios WHERE id = $1',
            [id]
        );

        if (usuarioExiste.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const nombreUsuario = usuarioExiste.rows[0].nombre;

        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

        console.log('🗑️ Usuario eliminado:', nombreUsuario);

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
});

// PUT - Actualizar último login
app.put('/api/usuarios/:id/ultimo-login', async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );
        res.json({ message: 'Último login actualizado' });
    } catch (error) {
        console.error('Error al actualizar último login:', error);
        res.status(500).json({ message: 'Error al actualizar último login' });
    }
});

// ===================== MÉTRICAS DE CLIENTES =====================

app.get('/api/metricas', async (req, res) => {
    try {
        // Primero verificar qué columnas tiene la tabla clientes
        let columnasClientes = [];
        try {
            const resCols = await pool.query(`
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'clientes'
            `);
            columnasClientes = resCols.rows.map(r => r.column_name);
        } catch(e) {
            console.log('⚠️ No se pudo leer columnas de clientes:', e.message);
        }

        const tieneApellido = columnasClientes.includes('apellido');
        const tieneCorreo = columnasClientes.includes('correo');
        const tieneEmail = columnasClientes.includes('email');

        const campoNombre = tieneApellido
            ? "CONCAT(COALESCE(c.nombre, ''), ' ', COALESCE(c.apellido, ''))"
            : "COALESCE(c.nombre, '')";
        const campoCorreo = tieneCorreo ? 'c.correo' : (tieneEmail ? 'c.email' : "'' AS correo");

        // Total de clientes en métricas
        const resTotal = await pool.query("SELECT COUNT(*) AS total FROM metricas_clientes");
        const total = parseInt(resTotal.rows[0].total);

        // Activos: dias_sin_contacto <= 30 e interacciones > 0
        const resActivos = await pool.query("SELECT COUNT(*) AS total FROM metricas_clientes WHERE dias_sin_contacto <= 30 AND total_interacciones > 0");
        const activos = parseInt(resActivos.rows[0].total);
        const inactivos = total - activos;

        // Clientes en riesgo
        const resRiesgo = await pool.query(`
            SELECT mc.cliente_id, 
                   ${campoNombre} AS nombre_completo,
                   ${campoCorreo} AS correo,
                   mc.total_interacciones, mc.dias_sin_contacto,
                   mc.ultima_interaccion, mc.total_compras,
                   mc.valor_total_compras, mc.puntuacion_satisfaccion
            FROM metricas_clientes mc
            LEFT JOIN clientes c ON c.id = mc.cliente_id
            WHERE mc.dias_sin_contacto > 30 OR mc.total_interacciones = 0
            ORDER BY mc.dias_sin_contacto DESC
        `);

        // Interacciones por cliente
        const resInter = await pool.query(`
            SELECT mc.cliente_id,
                   ${campoNombre} AS nombre_completo,
                   mc.total_interacciones, mc.dias_sin_contacto,
                   mc.total_compras, mc.valor_total_compras,
                   mc.ticket_promedio, mc.puntuacion_satisfaccion
            FROM metricas_clientes mc
            LEFT JOIN clientes c ON c.id = mc.cliente_id
            ORDER BY mc.cliente_id ASC
        `);

        // Promedio satisfacción
        const resSat = await pool.query("SELECT ROUND(AVG(puntuacion_satisfaccion), 1) AS promedio FROM metricas_clientes WHERE puntuacion_satisfaccion IS NOT NULL");
        const promedioSat = parseFloat(resSat.rows[0].promedio) || 0;

        console.log('📊 Métricas enviadas - Total:', total, 'Activos:', activos, 'Inactivos:', inactivos);

        res.json({
            total_clientes: total,
            activos,
            inactivos,
            promedio_satisfaccion: promedioSat,
            clientes_riesgo: resRiesgo.rows,
            interacciones_por_cliente: resInter.rows
        });

    } catch (error) {
        console.error('❌ Error en métricas:', error.message);
        res.status(500).json({ error: 'Error al obtener métricas: ' + error.message });
    }
});

// ================================================================

app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en http://localhost:' + PORT);
    console.log('📡 API disponible en http://localhost:' + PORT + '/api');
    console.log('');
});