const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middlewares must be registered before any routes that read req.body
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'perfumes', //cambiar si el nombre de la BD es diferente
    password: '2244', //Cambiar por su contraseña segun su BD
    port: 5432,
});

function getSmtpConfigOrNull() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    const smtpSecure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true';

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) return null;

    const portNum = parseInt(smtpPort);
    if (!Number.isFinite(portNum) || portNum <= 0) return null;

    return {
        host: smtpHost,
        port: portNum,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
        secure: smtpSecure
    };
}

function createSmtpTransporterFromEnv() {
    const cfg = getSmtpConfigOrNull();
    if (!cfg) return null;
    return nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: {
            user: cfg.user,
            pass: cfg.pass
        }
    });
}

async function enviarCorreoConfirmacionCompra({ to, nombre, numero_orden, total, metodo_pago, itemsResumen }) {
    const cfg = getSmtpConfigOrNull();
    if (!cfg) {
        return { sent: false, skipped: true, reason: 'SMTP no configurado' };
    }

    if (!to || typeof to !== 'string') {
        return { sent: false, skipped: true, reason: 'Cliente sin correo' };
    }

    const email = to.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { sent: false, skipped: true, reason: 'Correo inválido' };
    }

    const transporter = createSmtpTransporterFromEnv();
    if (!transporter) {
        return { sent: false, skipped: true, reason: 'SMTP no configurado' };
    }

    const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    const nombreSafe = (typeof nombre === 'string' && nombre.trim()) ? nombre.trim() : 'cliente';
    const totalNum = Number.isFinite(parseFloat(total)) ? parseFloat(total) : null;
    const metodo = (typeof metodo_pago === 'string' && metodo_pago.trim()) ? metodo_pago.trim() : 'N/A';

    const lineasItems = Array.isArray(itemsResumen)
        ? itemsResumen
            .filter(i => i && i.nombre)
            .map(i => `- ${i.nombre} x${i.cantidad || 1}`)
            .slice(0, 50)
        : [];

    const text = [
        `Hola ${nombreSafe},`,
        '',
        'Gracias por tu compra en Perfumes & Aromas.',
        `Número de orden: ${numero_orden}`,
        `Método de pago: ${metodo}`,
        totalNum !== null ? `Total: $${totalNum.toFixed(2)}` : null,
        `Fecha: ${fecha}`,
        lineasItems.length ? '' : null,
        lineasItems.length ? 'Productos:' : null,
        lineasItems.length ? lineasItems.join('\n') : null,
        '',
        'Si tú no realizaste esta compra, por favor contáctanos.'
    ].filter(Boolean).join('\n');

    try {
        await transporter.sendMail({
            from: cfg.from,
            to: email,
            subject: `Confirmación de compra - ${numero_orden}`,
            text
        });
        return { sent: true };
    } catch (error) {
        return { sent: false, skipped: false, reason: error.message };
    }
}

async function ensureTarjetasCreditoTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.tarjetas_credito (
                id SERIAL PRIMARY KEY,
                cliente_id INTEGER REFERENCES public.clientes(id) ON DELETE CASCADE,
                tipo VARCHAR(20) NOT NULL,
                titular VARCHAR(150) NOT NULL,
                numero VARCHAR(20) NOT NULL,
                expiracion DATE NOT NULL,
                cvv VARCHAR(4) NOT NULL,
                principal BOOLEAN DEFAULT FALSE,
                activa BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(cliente_id, numero)
            )
        `);

        await pool.query(
            'CREATE INDEX IF NOT EXISTS idx_tarjetas_credito_cliente ON public.tarjetas_credito(cliente_id)'
        );

        console.log('✅ Tabla public.tarjetas_credito lista');
    } catch (error) {
        console.error('❌ Error verificando/creando tabla public.tarjetas_credito:', error.message);
    }
}

// Login para usuarios (tabla usuarios) - usado por adminlogin
app.post('/api/login-usuario', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    try {
        const result = await pool.query(
            `SELECT id, nombre, email, telefono, rol, activo, password_hash FROM usuarios WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        const usuario = result.rows[0];

        // Para pruebas: comparar texto plano con el campo password_hash
        // (acepta también el formato '$2b$10$' + password usado en algunos lugares)
        let passwordValida = false;
        if (usuario.password_hash) {
            if (usuario.password_hash === password) {
                passwordValida = true;
            } else if (usuario.password_hash === '$2b$10$' + password) {
                passwordValida = true;
            }
        }

        if (!passwordValida) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        if (!usuario.activo) {
            return res.status(403).json({ message: 'Cuenta inactiva' });
        }

        // Actualizar último login
        try {
            await pool.query('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1', [usuario.id]);
        } catch (e) {
            console.warn('No se pudo actualizar ultimo_login:', e.message);
        }

        const usuarioSinPass = { ...usuario };
        delete usuarioSinPass.password_hash;

        // Token simple (temporal)
        const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

        res.json({ success: true, message: 'Login exitoso', usuario: usuarioSinPass, token });
    } catch (error) {
        console.error('Error en login-usuario:', error);
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
});

// Test de conexión
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error al conectar a PostgreSQL:', err.stack);
        return;
    }
    console.log('✅ Conectado a PostgreSQL - Base de datos: perfumes');
    release();
});

// Verificar/crear tablas auxiliares al arrancar
ensureTarjetasCreditoTable();

app.use(express.static(path.join(__dirname, 'PerfumesYAromas', 'Scaffold')));


app.get('/', (req, res) => {
    res.send('🚀 Backend Perfumes NE2 funcionando correctamente');
});

app.get('/api', (req, res) => {
    res.json({
        status: 'ok',
        message: '📡 API Perfumes NE2 activa'
    });
});

// ==================== ENDPOINTS PARA PEDIDOS (ESTADÍSTICA) ====================

// Obtener todos los pedidos
app.get('/api/pedidos/todos', async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                numero_orden,
                cliente_id,
                vendedor_id,
                producto_id,
                cantidad,
                subtotal,
                impuestos,
                descuento,
                total,
                estado,
                metodo_pago,
                direccion_envio,
                notas,
                fecha_pedido,
                fecha_confirmacion,
                fecha_envio,
                fecha_entrega
            FROM pedidos 
            ORDER BY fecha_pedido DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({ error: 'Error al cargar pedidos' });
    }
});

// Obtener pedidos por rango de fechas (opcional)
app.get('/api/pedidos/rango', async (req, res) => {
    const { desde, hasta } = req.query;

    try {
        let query = 'SELECT * FROM pedidos';
        let params = [];

        if (desde && hasta) {
            query += ' WHERE fecha_pedido BETWEEN $1 AND $2';
            params = [desde, hasta];
        }

        query += ' ORDER BY fecha_pedido DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo pedidos por rango:', error);
        res.status(500).json({ error: 'Error al cargar pedidos' });
    }
});

// Obtener estadísticas de pedidos
app.get('/api/pedidos/estadisticas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_pedidos,
                COUNT(*) FILTER (WHERE estado = 'pendiente' OR estado = 'procesando') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'enviado') as enviados,
                COUNT(*) FILTER (WHERE estado = 'entregado') as entregados,
                COUNT(*) FILTER (WHERE estado = 'cancelado') as cancelados,
                COALESCE(SUM(total), 0) as ventas_totales,
                COALESCE(AVG(total), 0) as ticket_promedio
            FROM pedidos
        `);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas' });
    }
});

// Crear nuevo pedido
app.post('/api/pedidos', async (req, res) => {
    const {
        numero_orden,
        cliente_id,
        vendedor_id,
        producto_id,
        cantidad,
        subtotal,
        impuestos,
        descuento,
        total,
        estado,
        metodo_pago,
        direccion_envio,
        notas
    } = req.body;

    if (!numero_orden) {
        return res.status(400).json({ message: 'El número de orden es requerido' });
    }
    if (!total && total !== 0) {
        return res.status(400).json({ message: 'El total es requerido' });
    }

    try {
        const existeOrden = await pool.query(
            'SELECT id FROM pedidos WHERE numero_orden = $1',
            [numero_orden]
        );
        if (existeOrden.rows.length > 0) {
            return res.status(400).json({ message: 'El número de orden ya existe' });
        }

        const result = await pool.query(
            `INSERT INTO pedidos (
                numero_orden, cliente_id, vendedor_id, producto_id, cantidad,
                subtotal, impuestos, descuento, total, estado, metodo_pago,
                direccion_envio, notas, fecha_pedido
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
            RETURNING *`,
            [
                numero_orden,
                cliente_id || null,
                vendedor_id || null,
                producto_id || null,
                cantidad || 1,
                subtotal || 0,
                impuestos || 0,
                descuento || 0,
                total,
                estado || 'pendiente',
                metodo_pago || null,
                direccion_envio || null,
                notas || null
            ]
        );

        res.status(201).json({
            message: 'Pedido creado exitosamente',
            pedido: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando pedido:', error);
        res.status(500).json({ message: 'Error al crear pedido', error: error.message });
    }
});

// Actualizar estado de pedido
app.put('/api/pedidos/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    console.log('=== Actualizando estado de pedido ===');
    console.log('ID:', id, 'Nuevo estado:', estado);

    const estadosValidos = ['pendiente', 'confirmado', 'procesando', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ message: 'Estado no válido' });
    }

    try {
        // Primero obtenemos el pedido actual para verificar si ya tiene fecha_envio
        const pedidoActual = await pool.query('SELECT fecha_envio FROM pedidos WHERE id = $1', [id]);

        if (pedidoActual.rows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const pedido = pedidoActual.rows[0];
        console.log('Pedido actual:', pedido);

        let query = 'UPDATE pedidos SET estado = $1';

        if (estado === 'confirmado') {
            query += `, fecha_confirmacion = CURRENT_TIMESTAMP`;
        } else if (estado === 'enviado') {
            query += `, fecha_envio = CURRENT_TIMESTAMP`;
        } else if (estado === 'entregado') {
            // Siempre establecer fecha_entrega
            query += `, fecha_entrega = CURRENT_TIMESTAMP`;
            // Si no tiene fecha_envio, también establecerla
            if (!pedido.fecha_envio) {
                query += `, fecha_envio = CURRENT_TIMESTAMP`;
            }
        }

        query += ` WHERE id = $2 RETURNING *`;
        console.log('Query a ejecutar:', query);

        const result = await pool.query(query, [estado, id]);
        console.log('Resultado:', result.rows[0]);

        res.json({
            message: 'Estado actualizado exitosamente',
            pedido: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
    }
});

// ENDPOINT DE DIAGNÓSTICO - para verificar tablas y columnas
app.get('/api/debug-tablas', async (req, res) => {
    try {
        // 1. Listar todas las tablas
        const tablas = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' ORDER BY table_name
        `);

        // 2. Verificar si metricas_clientes existe
        const existeMetricas = tablas.rows.some(t => t.table_name === 'metricas_clientes');

        let colsMetricas = [];
        let datosMetricas = [];
        let colsClientes = [];

        if (existeMetricas) {
            const resCols = await pool.query(`
                SELECT column_name, data_type FROM information_schema.columns 
                WHERE table_name = 'metricas_clientes' ORDER BY ordinal_position
            `);
            colsMetricas = resCols.rows;

            const resDatos = await pool.query('SELECT * FROM metricas_clientes LIMIT 5');
            datosMetricas = resDatos.rows;
        }

        // 3. Verificar tabla clientes
        const existeClientes = tablas.rows.some(t => t.table_name === 'clientes');
        if (existeClientes) {
            const resCols = await pool.query(`
                SELECT column_name, data_type FROM information_schema.columns 
                WHERE table_name = 'clientes' ORDER BY ordinal_position
            `);
            colsClientes = resCols.rows;
        }

        res.json({
            tablas: tablas.rows.map(t => t.table_name),
            metricas_clientes: {
                existe: existeMetricas,
                columnas: colsMetricas,
                datos_ejemplo: datosMetricas
            },
            clientes: {
                existe: existeClientes,
                columnas: colsClientes
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Endpoint de login modificado para incluir el campo 'vendedor'
app.post('/api/login', async (req, res) => {
    console.log('Login attempt:', { email: req.body.email });

    const { email, password } = req.body;

    if (!email || !password) {
        console.log('Login failed: campos vacíos');
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son requeridos'
        });
    }

    try {
        console.log(`Buscando cliente con email: ${email}`);

        // Buscar cliente por email
        const query = `
            SELECT id, nombre, correo, telefono, empresa, ciudad, estado, 
                   estado_cliente, etapa_crm, password, direccion,
                   codigo_postal, fecha_registro
            FROM clientes 
            WHERE correo = $1 AND estado_cliente = 'activo'
        `;

        console.log('Ejecutando query:', query);
        const result = await pool.query(query, [email]);

        console.log(`Resultados encontrados: ${result.rows.length}`);

        if (result.rows.length === 0) {
            console.log(`No se encontró cliente activo con email: ${email}`);
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        const cliente = result.rows[0];
        console.log('Cliente encontrado:', {
            id: cliente.id,
            nombre: cliente.nombre
        });

        // Verificar contraseña
        if (!cliente.password) {
            console.log('Cliente no tiene contraseña en la BD');
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        // Para testing, comparación simple
        if (cliente.password.trim() !== password.trim()) {
            console.log('Contraseñas no coinciden');
            return res.status(401).json({
                success: false,
                message: 'Credenciales incorrectas'
            });
        }

        console.log('Contraseña válida para cliente ID:', cliente.id);

        // Remover la contraseña de la respuesta
        const clienteSinPassword = { ...cliente };
        delete clienteSinPassword.password;

        // Crear un token simple
        const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');

        // Actualizar último login
        try {
            await pool.query(
                'UPDATE clientes SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1',
                [cliente.id]
            );
            console.log('Último login actualizado');
        } catch (updateError) {
            console.warn('No se pudo actualizar último login:', updateError.message);
        }

        console.log('Login exitoso para:', email);

        res.json({
            success: true,
            message: 'Login exitoso',
            cliente: clienteSinPassword,
            token: token
        });

    } catch (error) {
        console.error('ERROR EN LOGIN:', error);
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: error.message
        });
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

// Ruta para login de clientes
app.post('/api/login-cliente', async (req, res) => {
    const { email, password } = req.body;

    console.log('📧 Intento de login cliente:', email);

    try {
        const result = await pool.query(
            'SELECT * FROM clientes WHERE correo = $1 AND estado_cliente = $2',
            [email, 'activo']
        );

        if (result.rows.length === 0) {
            console.log('❌ Cliente no encontrado o inactivo:', email);
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }

        const cliente = result.rows[0];
        console.log('✅ Cliente encontrado:', cliente.nombre);

        // Validar contraseña (en tu BD la columna es "password", no "password_hash")
        // IMPORTANTE: En producción deberías usar bcrypt para comparar contraseñas
        // Por ahora usaremos comparación simple para tu base de datos actual
        const passwordValida = (password === cliente.password);

        if (!passwordValida) {
            console.log('❌ Contraseña incorrecta para cliente:', email);
            return res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }

        console.log('🎉 Login cliente exitoso para:', cliente.nombre);

        // Preparar respuesta sin la contraseña
        const { password: pwd, ...clienteSinPassword } = cliente;

        res.json({
            message: 'Login exitoso',
            cliente: clienteSinPassword,
            token: 'cliente_' + cliente.id + '_' + Date.now() // Token simple
        });

    } catch (error) {
        console.error('💥 Error en login cliente:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Ruta para obtener métricas de un cliente
app.get('/api/metricas-cliente/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM metricas_clientes WHERE cliente_id = $1',
            [cliente_id]
        );

        if (result.rows.length === 0) {
            return res.json({
                total_compras: 0,
                valor_total_compras: 0,
                ticket_promedio: 0
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo métricas:', error);
        res.status(500).json({ message: 'Error obteniendo métricas del cliente' });
    }
});

// Ruta para actualizar datos del cliente - VERSIÓN CON DEBUGGING
app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const {
        nombre,
        correo,
        telefono,
        empresa,
        direccion,
        ciudad,
        estado,
        codigo_postal,
        fecha_nacimiento,
        genero
    } = req.body;

    console.log('📝 Intento de actualizar cliente ID:', id);
    console.log('📋 Datos recibidos:', req.body);

    try {
        // Verificar que el cliente existe
        const clienteExiste = await pool.query(
            'SELECT id, correo FROM clientes WHERE id = $1',
            [id]
        );

        if (clienteExiste.rows.length === 0) {
            console.log('❌ Cliente no encontrado:', id);
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        console.log('✅ Cliente encontrado:', clienteExiste.rows[0].correo);

        // Verificar si el correo ya está en uso por otro cliente
        if (correo) {
            const correoEnUso = await pool.query(
                'SELECT id FROM clientes WHERE correo = $1 AND id != $2',
                [correo, id]
            );

            if (correoEnUso.rows.length > 0) {
                console.log('❌ Correo ya en uso:', correo);
                return res.status(400).json({
                    message: 'El correo ya está en uso por otro cliente'
                });
            }
        }

        // Construir la consulta dinámicamente
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (nombre !== undefined) {
            updates.push(`nombre = $${paramCount}`);
            values.push(nombre);
            paramCount++;
        }
        if (correo !== undefined) {
            updates.push(`correo = $${paramCount}`);
            values.push(correo);
            paramCount++;
        }
        if (telefono !== undefined) {
            updates.push(`telefono = $${paramCount}`);
            values.push(telefono);
            paramCount++;
        }
        if (empresa !== undefined) {
            updates.push(`empresa = $${paramCount}`);
            values.push(empresa);
            paramCount++;
        }
        if (direccion !== undefined) {
            updates.push(`direccion = $${paramCount}`);
            values.push(direccion);
            paramCount++;
        }
        if (ciudad !== undefined) {
            updates.push(`ciudad = $${paramCount}`);
            values.push(ciudad);
            paramCount++;
        }
        if (estado !== undefined) {
            updates.push(`estado = $${paramCount}`);
            values.push(estado);
            paramCount++;
        }
        if (codigo_postal !== undefined) {
            updates.push(`codigo_postal = $${paramCount}`);
            values.push(codigo_postal);
            paramCount++;
        }
        if (fecha_nacimiento !== undefined) {
            updates.push(`fecha_nacimiento = $${paramCount}`);
            values.push(fecha_nacimiento);
            paramCount++;
        }
        if (genero !== undefined) {
            updates.push(`genero = $${paramCount}`);
            values.push(genero);
            paramCount++;
        }

        // Agregar fecha_actualizacion siempre
        updates.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);

        // Agregar el ID al final
        values.push(id);

        if (updates.length === 1) { // Solo fecha_actualizacion
            console.log('⚠️ No hay campos para actualizar');
            return res.status(400).json({ message: 'No hay campos para actualizar' });
        }

        const query = `
            UPDATE clientes
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, nombre, correo, telefono, empresa, direccion, ciudad,
                      estado, codigo_postal, fecha_nacimiento, genero,
                      fecha_registro, estado_cliente, etapa_crm
        `;

        console.log('📋 Query SQL:', query);
        console.log('📋 Valores:', values);

        const result = await pool.query(query, values);

        console.log('✅ Cliente actualizado exitosamente:', result.rows[0].nombre);

        res.json({
            message: 'Cliente actualizado exitosamente',
            cliente: result.rows[0]
        });

    } catch (error) {
        console.error('💥 Error actualizando cliente:', error);
        console.error('💥 Detalle del error:', error.message);
        console.error('💥 Stack trace:', error.stack);

        // Mensaje más específico según el tipo de error
        let mensajeError = 'Error al actualizar cliente';
        if (error.code === '23505') { // Violación de unique constraint
            mensajeError = 'El correo electrónico ya está en uso';
        } else if (error.code === '23514') { // Violación de check constraint
            mensajeError = 'Datos inválidos (verifica los valores ingresados)';
        } else if (error.code === '22007') { // Error de formato de fecha
            mensajeError = 'Formato de fecha inválido (usar YYYY-MM-DD)';
        }

        res.status(500).json({
            message: mensajeError,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Ruta para obtener pedidos de un cliente (versión simplificada)
app.get('/api/pedidos-cliente/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT p.*, 
                    pr.nombre as producto_nombre,
                    pr.marca as producto_marca,
                    pr.imagen_url as producto_imagen
             FROM pedidos p
             LEFT JOIN productos pr ON p.producto_id = pr.id
             WHERE p.cliente_id = $1
             ORDER BY p.fecha_pedido DESC
             LIMIT 10`,
            [cliente_id]
        );

        // Formatear productos para mostrar
        const rows = result.rows.map(row => ({
            ...row,
            productos: row.producto_nombre || 'Producto no disponible'
        }));

        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({ message: 'Error obteniendo pedidos del cliente' });
    }
});

// Ruta para obtener pedidos detallados de un cliente
app.get('/api/pedidos-detallados/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT p.*, 
                    pr.nombre as producto_nombre,
                    pr.marca as producto_marca,
                    pr.precio as producto_precio,
                    pr.imagen_url as producto_imagen
             FROM pedidos p
             LEFT JOIN productos pr ON p.producto_id = pr.id
             WHERE p.cliente_id = $1
             ORDER BY p.fecha_pedido DESC`,
            [cliente_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo pedidos detallados:', error);
        res.status(500).json({ message: 'Error obteniendo historial de compras' });
    }
});

// Ruta para obtener detalle completo de un pedido específico
app.get('/api/pedido-detalle/:pedido_id', async (req, res) => {
    const { pedido_id } = req.params;

    try {
        // Obtener información del pedido con datos del producto
        const pedidoResult = await pool.query(
            `SELECT p.*, 
                    pr.nombre as producto_nombre,
                    pr.marca as producto_marca,
                    pr.precio as producto_precio,
                    pr.descripcion as producto_descripcion,
                    pr.imagen_url as producto_imagen,
                    c.nombre as cliente_nombre,
                    c.correo as cliente_email,
                    c.telefono as cliente_telefono,
                    u.nombre as vendedor_nombre
             FROM pedidos p
             LEFT JOIN productos pr ON p.producto_id = pr.id
             LEFT JOIN clientes c ON p.cliente_id = c.id
             LEFT JOIN usuarios u ON p.vendedor_id = u.id
             WHERE p.id = $1`,
            [pedido_id]
        );

        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const pedido = pedidoResult.rows[0];

        // Agregar campo productos para compatibilidad con frontend
        pedido.productos = pedido.producto_nombre || 'Producto no disponible';

        res.json(pedido);
    } catch (error) {
        console.error('Error obteniendo detalle del pedido:', error);
        res.status(500).json({ message: 'Error obteniendo detalles del pedido' });
    }
});

// Actualizar seguimiento (solo campos que existen en pedidos)
app.put('/api/seguimiento/:id', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;  // Solo permitimos actualizar el estado

    try {
        if (!estado) {
            return res.status(400).json({ error: 'El estado es requerido' });
        }

        // Validar que el estado sea válido
        const estadosValidos = ['pendiente', 'confirmado', 'procesando', 'enviado', 'entregado', 'cancelado'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        const query = `
            UPDATE pedidos 
            SET estado = $1,
                ${estado === 'enviado' ? 'fecha_envio = CURRENT_TIMESTAMP,' : ''}
                ${estado === 'entregado' ? 'fecha_entrega = CURRENT_TIMESTAMP,' : ''}
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, numero_orden, estado, fecha_envio, fecha_entrega
        `;

        // Limpiamos la query de las comas extras
        const cleanQuery = query.replace(/,(\s*WHERE)/g, ' $1');

        const result = await pool.query(cleanQuery, [estado, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({
            message: 'Estado actualizado correctamente',
            pedido: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualizando seguimiento:', error);
        res.status(500).json({ error: 'Error al actualizar el estado' });
    }
});

// Marcar como entregado
app.put('/api/seguimiento/:id/entregar', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE pedidos
             SET estado = 'entregado', 
                 fecha_entrega = CURRENT_TIMESTAMP,
                 fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, numero_orden, estado, fecha_entrega`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({
            message: 'Pedido marcado como entregado',
            pedido: result.rows[0]
        });

    } catch (error) {
        console.error('Error marcando como entregado:', error);
        res.status(500).json({ error: 'Error al actualizar estado de entrega' });
    }
});

// Marcar seguimiento como entregado (en la tabla pedidos)
app.put('/api/seguimiento/:id/entregar', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE pedidos
             SET estado = 'entregado', fecha_entrega = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, numero_orden, cliente_id, vendedor_id, estado, fecha_entrega`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json({ message: 'Pedido marcado como entregado', seguimiento: result.rows[0] });
    } catch (error) {
        console.error('Error marcando como entregado:', error);
        res.status(500).json({ error: 'Error al actualizar estado de entrega' });
    }
});

// Primero, crea la tabla para tarjetas de crédito si no existe
app.post('/api/crear-tabla-tarjetas', async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tarjetas_credito (
                id SERIAL PRIMARY KEY,
                cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
                tipo VARCHAR(20) NOT NULL,
                titular VARCHAR(150) NOT NULL,
                numero VARCHAR(20) NOT NULL,
                expiracion DATE NOT NULL,
                cvv VARCHAR(4) NOT NULL,
                principal BOOLEAN DEFAULT FALSE,
                activa BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(cliente_id, numero)
            )
        `);

        console.log('✅ Tabla tarjetas_credito creada/verificada');
        res.json({ message: 'Tabla tarjetas_credito lista' });
    } catch (error) {
        console.error('Error creando tabla tarjetas:', error);
        res.status(500).json({ message: 'Error creando tabla' });
    }
});

// Ruta para obtener tarjetas de un cliente
app.get('/api/tarjetas-cliente/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM tarjetas_credito 
             WHERE cliente_id = $1 AND activa = true
             ORDER BY principal DESC, fecha_creacion DESC`,
            [cliente_id]
        );

        // Si no hay tarjetas, devolver array vacío
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo tarjetas:', error);
        res.status(500).json({ message: 'Error obteniendo tarjetas' });
    }
});

// Ruta para agregar nueva tarjeta
app.post('/api/tarjetas', async (req, res) => {
    const { tipo, titular, numero, expiracion, cvv, principal, cliente_id } = req.body;

    try {
        // Verificar que el cliente existe
        const clienteExiste = await pool.query(
            'SELECT id FROM clientes WHERE id = $1',
            [cliente_id]
        );

        if (clienteExiste.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Si esta tarjeta será principal, quitar principal de las demás
        if (principal) {
            await pool.query(
                'UPDATE tarjetas_credito SET principal = false WHERE cliente_id = $1',
                [cliente_id]
            );
        }

        // Verificar si la tarjeta ya está registrada
        const tarjetaExiste = await pool.query(
            'SELECT id FROM tarjetas_credito WHERE cliente_id = $1 AND numero = $2',
            [cliente_id, numero]
        );

        if (tarjetaExiste.rows.length > 0) {
            return res.status(400).json({ message: 'Esta tarjeta ya está registrada' });
        }

        // Insertar nueva tarjeta
        const result = await pool.query(
            `INSERT INTO tarjetas_credito 
             (cliente_id, tipo, titular, numero, expiracion, cvv, principal)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [cliente_id, tipo, titular, numero, expiracion, cvv, principal]
        );

        console.log('✅ Tarjeta agregada para cliente:', cliente_id);
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error agregando tarjeta:', error);
        res.status(500).json({ message: 'Error al agregar tarjeta' });
    }
});

// Ruta para información del monedero (simulada - podrías crear tabla después)
app.get('/api/monedero-cliente/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;

    try {
        // Por ahora, datos simulados
        // Podrías crear una tabla monedero_digital después

        // Simular saldo inicial de $500
        let saldo = 500.00;

        // Simular historial
        const historial = [
            {
                tipo: 'recarga',
                monto: 200.00,
                fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Hace 7 días
                descripcion: 'Recarga inicial'
            },
            {
                tipo: 'pago',
                monto: 120.00,
                fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
                descripcion: 'Pago pedido #P001'
            }
        ];

        res.json({
            saldo: saldo,
            historial: historial
        });

    } catch (error) {
        console.error('Error obteniendo monedero:', error);
        res.status(500).json({ message: 'Error obteniendo información del monedero' });
    }
});

// Ruta para recargar monedero
app.post('/api/recargar-monedero', async (req, res) => {
    const { cliente_id, monto } = req.body;

    try {
        // Verificar cliente
        const clienteExiste = await pool.query(
            'SELECT id FROM clientes WHERE id = $1',
            [cliente_id]
        );

        if (clienteExiste.rows.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        // Aquí podrías integrar con una pasarela de pagos
        // Por ahora, solo simulamos la recarga

        console.log(`💰 Recarga de $${monto} para cliente ${cliente_id}`);

        res.json({
            success: true,
            message: `Recarga de $${monto} realizada`,
            nuevo_saldo: 500 + monto // Saldo simulado
        });

    } catch (error) {
        console.error('Error recargando monedero:', error);
        res.status(500).json({ message: 'Error al realizar recarga' });
    }
});

// Ruta para obtener último pago
app.get('/api/ultimo-pago/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT p.* 
             FROM pedidos p
             WHERE p.cliente_id = $1 
             AND p.estado NOT IN ('cancelado', 'pendiente')
             ORDER BY p.fecha_pedido DESC
             LIMIT 1`,
            [cliente_id]
        );

        if (result.rows.length === 0) {
            return res.json(null);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error obteniendo último pago:', error);
        res.status(500).json({ message: 'Error obteniendo último pago' });
    }
});

// Primero, agregar columnas de seguimiento si no existen
app.post('/api/agregar-seguimiento-pedidos', async (req, res) => {
    try {
        // Agregar columnas para seguimiento si no existen (estandarizar nombres)
        await pool.query(`
            ALTER TABLE pedidos 
            ADD COLUMN IF NOT EXISTS numero_guia VARCHAR(50),
            ADD COLUMN IF NOT EXISTS transportista VARCHAR(100),
            ADD COLUMN IF NOT EXISTS ubicacion_actual TEXT,
            ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP,
            ADD COLUMN IF NOT EXISTS fecha_entrega_estimada DATE,
            ADD COLUMN IF NOT EXISTS estado_paquete VARCHAR(50) DEFAULT 'en_proceso'
        `);

        console.log('✅ Columnas de seguimiento agregadas a pedidos');
        res.json({ message: 'Columnas de seguimiento listas' });
    } catch (error) {
        console.error('Error agregando columnas:', error);
        res.status(500).json({ message: 'Error configurando seguimiento' });
    }
});

// Obtener pedidos con seguimiento (sin usar carrito)
app.get('/api/seguimiento-pedidos/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT p.*, 
                    pr.nombre as producto_nombre
             FROM pedidos p
             LEFT JOIN productos pr ON p.producto_id = pr.id
             WHERE p.cliente_id = $1
             ORDER BY 
                 CASE 
                     WHEN p.estado = 'enviado' THEN 1
                     WHEN p.estado = 'procesando' THEN 2
                     WHEN p.estado = 'confirmado' THEN 3
                     WHEN p.estado = 'pendiente' THEN 4
                     WHEN p.estado = 'entregado' THEN 5
                     WHEN p.estado = 'cancelado' THEN 6
                     ELSE 7
                 END,
                 p.fecha_pedido DESC`,
            [cliente_id]
        );

        // Formatear productos para mostrar
        const rows = result.rows.map(row => ({
            ...row,
            productos: row.producto_nombre || 'Producto no disponible',
            cantidad_items: row.cantidad || 1
        }));

        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo seguimiento:', error);
        res.status(500).json({ message: 'Error obteniendo seguimiento de pedidos' });
    }
});

// Obtener detalle completo de seguimiento (sin carrito)
app.get('/api/seguimiento-detalle/:pedido_id', async (req, res) => {
    const { pedido_id } = req.params;

    try {
        // Obtener información del pedido
        const pedidoResult = await pool.query(
            `SELECT p.*, 
                    pr.nombre as producto_nombre,
                    pr.marca as producto_marca,
                    pr.precio as producto_precio,
                    pr.imagen_url as producto_imagen
             FROM pedidos p
             LEFT JOIN productos pr ON p.producto_id = pr.id
             WHERE p.id = $1`,
            [pedido_id]
        );

        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const pedido = pedidoResult.rows[0];

        // Crear array de productos para compatibilidad
        pedido.productos_detalle = [{
            producto_id: pedido.producto_id,
            nombre: pedido.producto_nombre,
            marca: pedido.producto_marca,
            cantidad: pedido.cantidad || 1,
            precio_unitario: pedido.producto_precio || (pedido.total / (pedido.cantidad || 1))
        }];

        pedido.productos = pedido.producto_nombre || 'Producto no disponible';

        // Obtener historial de seguimiento (si existe tabla separada)
        try {
            const historialResult = await pool.query(
                `SELECT * FROM historial_seguimiento 
                 WHERE pedido_id = $1 
                 ORDER BY fecha DESC`,
                [pedido_id]
            );
            pedido.historial = historialResult.rows;
        } catch (error) {
            pedido.historial = [];
        }

        res.json(pedido);
    } catch (error) {
        console.error('Error obteniendo detalle de seguimiento:', error);
        res.status(500).json({ message: 'Error obteniendo detalle de seguimiento' });
    }
});
// Obtener seguimiento activo (solo pedidos no entregados)
app.get('/api/vendedor/:vendedorId/seguimiento-activo', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT 
                p.id,
                p.numero_orden,
                p.total,
                p.fecha_pedido,
                p.estado,
                p.direccion_envio,
                p.fecha_envio,
                p.fecha_entrega,
                c.id as cliente_id,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                -- Información del producto
                pr.nombre as producto_nombre,
                p.cantidad
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN productos pr ON p.producto_id = pr.id
            WHERE p.vendedor_id = $1
              AND p.estado NOT IN ('entregado', 'cancelado')
            ORDER BY 
                CASE p.estado
                    WHEN 'enviado' THEN 1
                    WHEN 'procesando' THEN 2
                    WHEN 'confirmado' THEN 3
                    WHEN 'pendiente' THEN 4
                    ELSE 5
                END,
                p.fecha_pedido ASC
        `;

        const result = await pool.query(query, [vendedorId]);
        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo seguimiento activo:', error);
        res.status(500).json({ error: 'Error al cargar seguimiento' });
    }
});


// Ruta para crear tabla de historial de seguimiento (opcional)
app.post('/api/crear-tabla-seguimiento', async (req, res) => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS historial_seguimiento (
                id SERIAL PRIMARY KEY,
                pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
                estado_anterior VARCHAR(30),
                estado_nuevo VARCHAR(30) NOT NULL,
                ubicacion TEXT,
                descripcion TEXT,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                usuario_id INTEGER REFERENCES usuarios(id)
            )
        `);

        console.log('✅ Tabla historial_seguimiento creada/verificada');
        res.json({ message: 'Tabla de historial lista' });
    } catch (error) {
        console.error('Error creando tabla seguimiento:', error);
        res.status(500).json({ message: 'Error creando tabla de seguimiento' });
    }
});

// Ruta para registrar nuevo cliente
app.post('/api/registrar-cliente', async (req, res) => {
    const {
        nombre,
        correo,
        password,
        telefono,
        empresa,
        direccion,
        ciudad,
        estado,
        codigo_postal,
        fecha_nacimiento,
        genero,
        newsletter
    } = req.body;

    console.log('📝 Registro de nuevo cliente:', correo);

    try {
        // Validar campos requeridos
        if (!nombre || !correo || !password) {
            return res.status(400).json({ message: 'Nombre, correo y contraseña son obligatorios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el correo ya está registrado
        const clienteExistente = await pool.query(
            'SELECT id FROM clientes WHERE correo = $1',
            [correo]
        );

        if (clienteExistente.rows.length > 0) {
            console.log('❌ Correo ya registrado:', correo);
            return res.status(400).json({ message: 'Este correo electrónico ya está registrado' });
        }

        // Insertar nuevo cliente
        const result = await pool.query(
            `INSERT INTO clientes 
             (nombre, correo, password, telefono, empresa, direccion, 
              ciudad, estado, codigo_postal, fecha_nacimiento, genero, 
              estado_cliente, etapa_crm, fecha_registro)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
             RETURNING id, nombre, correo, telefono, empresa, direccion, 
                       ciudad, estado, codigo_postal, fecha_nacimiento, genero,
                       fecha_registro, estado_cliente, etapa_crm`,
            [
                nombre, correo, password, telefono, empresa, direccion,
                ciudad, estado, codigo_postal, fecha_nacimiento, genero,
                'activo', 'Prospecto'
            ]
        );

        const nuevoCliente = result.rows[0];
        console.log('✅ Cliente registrado exitosamente:', nuevoCliente.nombre);

        // Crear métricas iniciales para el cliente
        try {
            await pool.query(
                `INSERT INTO metricas_clientes (cliente_id, total_interacciones, total_compras, valor_total_compras)
                 VALUES ($1, 0, 0, 0)`,
                [nuevoCliente.id]
            );
        } catch (error) {
            console.log('⚠️ No se pudieron crear métricas iniciales, pero el cliente se registró');
        }

        // Enviar correo de bienvenida (simulado)
        if (newsletter) {
            console.log('📧 Suscrito a newsletter:', correo);
        }

        // Preparar respuesta
        const { password: pwd, ...clienteSinPassword } = nuevoCliente;

        res.status(201).json({
            message: 'Cliente registrado exitosamente',
            cliente: clienteSinPassword,
            token: 'cliente_' + nuevoCliente.id + '_' + Date.now()
        });

    } catch (error) {
        console.error('💥 Error registrando cliente:', error);

        let mensajeError = 'Error al registrar cliente';
        if (error.code === '23505') { // Violación de unique constraint
            mensajeError = 'El correo electrónico ya está registrado';
        } else if (error.code === '23514') { // Violación de check constraint
            mensajeError = 'Datos inválidos en el formulario';
        }

        res.status(500).json({
            message: mensajeError,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ===================== MÉTRICAS DE CLIENTES =====================

app.get('/api/metricas', async (req, res) => {
    console.log('📊 Petición recibida en /api/metricas');

    try {
        // Paso 1: Verificar que la tabla existe
        const tablaExiste = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'metricas_clientes'
            ) AS existe
        `);

        if (!tablaExiste.rows[0].existe) {
            console.log('❌ La tabla metricas_clientes NO existe');
            return res.status(500).json({ 
                error: 'La tabla metricas_clientes no existe en la base de datos. Créala primero.' 
            });
        }

        // Paso 2: Obtener columnas disponibles
        const resCols = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'metricas_clientes'
        `);
        const cols = resCols.rows.map(r => r.column_name);
        console.log('📋 Columnas encontradas en metricas_clientes:', cols);

        const resColsCli = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'clientes'
        `);
        const colsCli = resColsCli.rows.map(r => r.column_name);
        console.log('📋 Columnas encontradas en clientes:', colsCli);

        // Paso 3: Obtener TODOS los registros de metricas_clientes (raw)
        const rawData = await pool.query('SELECT * FROM metricas_clientes');
        console.log('📊 Total registros en metricas_clientes:', rawData.rows.length);

        if (rawData.rows.length === 0) {
            console.log('⚠️ La tabla metricas_clientes está vacía');
            return res.json({
                total_clientes: 0,
                activos: 0,
                inactivos: 0,
                promedio_satisfaccion: 0,
                clientes_riesgo: [],
                interacciones_por_cliente: [],
                mensaje: 'La tabla metricas_clientes está vacía'
            });
        }

        // Paso 4: Construir campos dinámicos
        const has = (col) => cols.includes(col);
        const hasCli = (col) => colsCli.includes(col);

        // Campo nombre del cliente
        const campoNombre = hasCli('apellido')
            ? "CONCAT(COALESCE(c.nombre,''), ' ', COALESCE(c.apellido,''))"
            : "COALESCE(c.nombre, 'Sin nombre')";
        const campoCorreo = hasCli('correo') ? 'c.correo' : (hasCli('email') ? 'c.email' : "'' AS correo");

        // Campos de métricas con fallback a 0/NULL
        const f = (col, alias) => has(col) ? `mc.${col}` : `0 AS ${alias || col}`;
        const fn = (col, alias) => has(col) ? `mc.${col}` : `NULL AS ${alias || col}`;

        // Paso 5: Total
        const total = rawData.rows.length;

        // Paso 6: Activos/Inactivos
        let activos = 0;
        if (has('dias_sin_contacto') && has('total_interacciones')) {
            const r = await pool.query(
                "SELECT COUNT(*) AS n FROM metricas_clientes WHERE dias_sin_contacto <= 30 AND total_interacciones > 0"
            );
            activos = parseInt(r.rows[0].n);
        } else if (has('total_interacciones')) {
            const r = await pool.query(
                "SELECT COUNT(*) AS n FROM metricas_clientes WHERE total_interacciones > 0"
            );
            activos = parseInt(r.rows[0].n);
        } else {
            activos = total; // Si no hay columnas para determinar, asumir todos activos
        }
        const inactivos = total - activos;

        // Paso 7: Satisfacción promedio
        let promedioSat = 0;
        if (has('puntuacion_satisfaccion')) {
            const r = await pool.query(
                "SELECT ROUND(AVG(puntuacion_satisfaccion)::numeric, 1) AS p FROM metricas_clientes WHERE puntuacion_satisfaccion IS NOT NULL"
            );
            promedioSat = parseFloat(r.rows[0].p) || 0;
        }

        // Paso 8: Query principal - interacciones por cliente
        const queryInter = `
            SELECT mc.cliente_id,
                   ${campoNombre} AS nombre_completo,
                   ${f('total_interacciones', 'total_interacciones')},
                   ${f('dias_sin_contacto', 'dias_sin_contacto')},
                   ${f('total_compras', 'total_compras')},
                   ${f('valor_total_compras', 'valor_total_compras')},
                   ${f('ticket_promedio', 'ticket_promedio')},
                   ${fn('puntuacion_satisfaccion', 'puntuacion_satisfaccion')}
            FROM metricas_clientes mc
            LEFT JOIN clientes c ON c.id = mc.cliente_id
            ORDER BY mc.cliente_id ASC
        `;
        console.log('📊 Query interacciones:', queryInter);
        const resInter = await pool.query(queryInter);

        // Paso 9: Query riesgo
        let condRiesgo = 'TRUE';
        if (has('dias_sin_contacto') && has('total_interacciones')) {
            condRiesgo = 'mc.dias_sin_contacto > 30 OR mc.total_interacciones = 0';
        } else if (has('total_interacciones')) {
            condRiesgo = 'mc.total_interacciones = 0';
        }

        const queryRiesgo = `
            SELECT mc.cliente_id,
                   ${campoNombre} AS nombre_completo,
                   ${campoCorreo} AS correo,
                   ${f('total_interacciones', 'total_interacciones')},
                   ${f('dias_sin_contacto', 'dias_sin_contacto')},
                   ${fn('ultima_interaccion', 'ultima_interaccion')},
                   ${f('total_compras', 'total_compras')},
                   ${f('valor_total_compras', 'valor_total_compras')},
                   ${fn('puntuacion_satisfaccion', 'puntuacion_satisfaccion')}
            FROM metricas_clientes mc
            LEFT JOIN clientes c ON c.id = mc.cliente_id
            WHERE ${condRiesgo}
            ORDER BY mc.cliente_id ASC
        `;
        console.log('📊 Query riesgo:', queryRiesgo);
        const resRiesgo = await pool.query(queryRiesgo);

        const respuesta = {
            total_clientes: total,
            activos,
            inactivos,
            promedio_satisfaccion: promedioSat,
            clientes_riesgo: resRiesgo.rows,
            interacciones_por_cliente: resInter.rows
        };

        console.log('✅ Métricas enviadas correctamente - Total:', total);
        res.json(respuesta);

    } catch (error) {
        console.error('❌ Error en /api/metricas:', error.message);
        console.error('❌ Query que falló:', error.query || 'N/A');
        console.error('❌ Stack:', error.stack);
        res.status(500).json({ 
            error: 'Error al obtener métricas: ' + error.message,
            detalle: error.stack
        });
    }
});

// ===================== MÉTRICAS DE PRODUCTOS =====================
// Obtener estadísticas de productos (sin carrito)
app.get('/api/metricas-productos', async (req, res) => {
    console.log('📊 Petición recibida en /api/metricas-productos');

    try {
        // 1. Productos más vendidos (directamente desde pedidos)
        const masVendidos = await pool.query(`
            SELECT p.id, p.nombre, p.marca, p.stock, p.precio,
                   COUNT(pe.id) AS total_pedidos,
                   COALESCE(SUM(pe.cantidad), 0) AS total_unidades
            FROM productos p
            LEFT JOIN pedidos pe ON pe.producto_id = p.id AND pe.estado NOT IN ('cancelado')
            GROUP BY p.id, p.nombre, p.marca, p.stock, p.precio
            ORDER BY total_pedidos DESC, total_unidades DESC
            LIMIT 10
        `);

        // 2. Productos con inventario crítico
        const inventarioCritico = await pool.query(`
            SELECT id, nombre, marca, stock, stock_minimo,
                   CASE WHEN stock = 0 THEN 'agotado'
                        WHEN stock <= stock_minimo THEN 'critico'
                   END AS estado_stock
            FROM productos
            WHERE stock <= stock_minimo AND activo = true
            ORDER BY stock ASC
        `);

        // 3. Conteo restock
        const restockConteo = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE restock = 'push') AS push_count,
                COUNT(*) FILTER (WHERE restock = 'pull') AS pull_count,
                COUNT(*) FILTER (WHERE restock IS NULL OR restock = '') AS sin_definir
            FROM productos
            WHERE activo = true
        `);

        // 4. Stats generales
        const stats = await pool.query(`
            SELECT 
                COUNT(*) AS total_productos,
                COALESCE(SUM(stock), 0) AS stock_total,
                COUNT(*) FILTER (WHERE stock = 0) AS agotados,
                COUNT(*) FILTER (WHERE stock > 0 AND stock <= stock_minimo) AS criticos
            FROM productos
            WHERE activo = true
        `);

        res.json({
            mas_vendidos: masVendidos.rows,
            inventario_critico: inventarioCritico.rows,
            restock: restockConteo.rows[0],
            stats: stats.rows[0]
        });

    } catch (error) {
        console.error('❌ Error en /api/metricas-productos:', error.message);
        res.status(500).json({ error: 'Error al obtener métricas de productos' });
    }
});

// ==================== ENDPOINTS PARA VENDEDORES ====================
// Obtener clientes que han comprado con este vendedor
app.get('/api/vendedor/:vendedorId/clientes', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT DISTINCT 
                c.id,
                c.nombre,
                c.correo,
                c.telefono,
                c.ciudad,
                c.estado_cliente,
                MAX(p.fecha_pedido) as ultima_compra,
                COUNT(DISTINCT p.id) as total_compras,
                COALESCE(SUM(p.total), 0) as total_gastado
            FROM clientes c
            JOIN pedidos p ON c.id = p.cliente_id
            WHERE p.vendedor_id = $1  -- Ahora usa vendedor_id directamente
            GROUP BY c.id, c.nombre, c.correo, c.telefono, c.ciudad, c.estado_cliente
            ORDER BY ultima_compra DESC NULLS LAST
        `;

        const result = await pool.query(query, [vendedorId]);
        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo clientes del vendedor:', error);
        res.status(500).json({ error: 'Error al cargar clientes' });
    }
});

// Obtener pedidos del vendedor (sin usar carrito)
app.get('/api/vendedor/:vendedorId/pedidos', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT
                p.id,
                p.numero_orden,
                p.fecha_pedido,
                p.fecha_envio,
                p.fecha_entrega,
                p.total,
                p.subtotal,
                p.impuestos,
                p.estado,
                p.metodo_pago,
                p.vendedor_id,
                p.producto_id,
                p.cantidad,
                c.nombre as cliente_nombre,
                c.id as cliente_id,
                c.correo as cliente_email,
                p.direccion_envio,
                pr.nombre as producto_nombre,
                pr.marca as producto_marca
            FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN productos pr ON p.producto_id = pr.id
            WHERE p.vendedor_id = $1
            ORDER BY p.fecha_pedido DESC
            LIMIT 50
        `;

        const result = await pool.query(query, [vendedorId]);

        // Normalizar salida
        const rows = result.rows.map(r => ({
            id: r.id,
            numero_orden: r.numero_orden,
            fecha_pedido: r.fecha_pedido,
            fecha_envio: r.fecha_envio,
            fecha_entrega: r.fecha_entrega,
            total: r.total,
            subtotal: r.subtotal,
            impuestos: r.impuestos,
            estado: r.estado,
            metodo_pago: r.metodo_pago,
            vendedor_id: r.vendedor_id,
            producto_id: r.producto_id,
            cantidad: r.cantidad,
            cliente_nombre: r.cliente_nombre,
            cliente_id: r.cliente_id,
            cliente_email: r.cliente_email,
            direccion_envio: r.direccion_envio || null,
            productos: r.producto_nombre || 'Sin producto asignado'
        }));

        res.json(rows);

    } catch (error) {
        console.error('Error obteniendo pedidos del vendedor:', error);
        res.status(500).json({ error: 'Error al cargar pedidos' });
    }
});

// ==================== ENDPOINT PARA OBTENER TODOS LOS CLIENTES (COMPLETO) ====================
app.get('/api/clientes/todos', async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                nombre,
                correo,
                telefono,
                direccion,
                ciudad,
                fecha_registro,
                estado_cliente,
                empresa,
                codigo_postal,
                etapa_crm
            FROM clientes 
            ORDER BY id ASC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({ error: 'Error al cargar clientes' });
    }
});

// ==================== ENDPOINT PARA CLIENTES ACTIVOS (VERSIÓN MEJORADA) ====================
app.get('/api/clientes/activos', async (req, res) => {
    try {
        const query = `
            SELECT 
                id,
                nombre,
                correo,
                telefono,
                direccion,
                ciudad,
                fecha_registro,
                estado_cliente,
                empresa,
                etapa_crm
            FROM clientes 
            WHERE estado_cliente = 'activo'
            ORDER BY nombre ASC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo clientes activos:', error);
        res.status(500).json({ error: 'Error al cargar clientes' });
    }
});

// Crear pedido para un vendedor
app.post('/api/vendedor/:vendedorId/pedidos', async (req, res) => {
    const { vendedorId } = req.params;
    const { cliente_id, producto_id, cantidad = 1, metodo_pago, direccion_envio, notas, estado = 'pendiente', numero_orden: numero_orden_enviado } = req.body;

    if (!cliente_id || !producto_id) {
        return res.status(400).json({ message: 'cliente_id y producto_id son requeridos' });
    }

    try {
        // Obtener precio del producto
        const prod = await pool.query('SELECT precio FROM productos WHERE id = $1', [producto_id]);
        const precio = prod.rows[0] ? parseFloat(prod.rows[0].precio) : 0;
        const qty = parseInt(cantidad) || 1;
        const subtotal = precio * qty;
        const impuestos = 0;
        const descuento = 0;
        const total = subtotal + impuestos - descuento;

        // Usar el numero_orden enviado por el usuario, o generar uno automático si no se proporciona
        const seqResult = await pool.query("SELECT nextval('pedidos_numero_orden_seq')");
        const numero_orden = 'PED-' + seqResult.rows[0].nextval;

        const insert = await pool.query(
            `INSERT INTO pedidos (numero_orden, cliente_id, vendedor_id, producto_id, cantidad, subtotal, impuestos, descuento, total, estado, metodo_pago, direccion_envio, notas)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
            [numero_orden, cliente_id, vendedorId, producto_id, qty, subtotal, impuestos, descuento, total, estado, metodo_pago, direccion_envio, notas]
        );

        res.status(201).json(insert.rows[0]);
    } catch (error) {
        console.error('Error creando pedido:', error);
        res.status(500).json({ message: 'Error creando pedido' });
    }
});

// Actualizar pedido
app.put('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    const { cliente_id, producto_id, cantidad, metodo_pago, direccion_envio, notas, estado } = req.body;

    try {
        // Construir dinámicamente
        const updates = [];
        const values = [];
        let idx = 1;

        if (cliente_id !== undefined) { updates.push(`cliente_id = $${idx}`); values.push(cliente_id); idx++; }
        if (producto_id !== undefined) { updates.push(`producto_id = $${idx}`); values.push(producto_id); idx++; }
        if (cantidad !== undefined) { updates.push(`cantidad = $${idx}`); values.push(cantidad); idx++; }
        if (metodo_pago !== undefined) { updates.push(`metodo_pago = $${idx}`); values.push(metodo_pago); idx++; }
        if (direccion_envio !== undefined) { updates.push(`direccion_envio = $${idx}`); values.push(direccion_envio); idx++; }
        if (notas !== undefined) { updates.push(`notas = $${idx}`); values.push(notas); idx++; }
        if (estado !== undefined) { updates.push(`estado = $${idx}`); values.push(estado); idx++; }

        // Recalcular montos si cambiaron producto o cantidad
        if (producto_id !== undefined || cantidad !== undefined) {
            // obtener producto y cantidad actuales si faltan
            const cur = await pool.query('SELECT producto_id, cantidad FROM pedidos WHERE id = $1', [id]);
            if (cur.rows.length === 0) return res.status(404).json({ message: 'Pedido no encontrado' });
            const prodId = producto_id !== undefined ? producto_id : cur.rows[0].producto_id;
            const qty = cantidad !== undefined ? parseInt(cantidad) : parseInt(cur.rows[0].cantidad);
            const prod = await pool.query('SELECT precio FROM productos WHERE id = $1', [prodId]);
            const precio = prod.rows[0] ? parseFloat(prod.rows[0].precio) : 0;
            const subtotal = precio * (qty || 1);
            const impuestos = 0;
            const descuento = 0;
            const total = subtotal + impuestos - descuento;

            updates.push(`subtotal = $${idx}`); values.push(subtotal); idx++;
            updates.push(`impuestos = $${idx}`); values.push(impuestos); idx++;
            updates.push(`descuento = $${idx}`); values.push(descuento); idx++;
            updates.push(`total = $${idx}`); values.push(total); idx++;
        }

        if (updates.length === 0) return res.status(400).json({ message: 'No hay campos para actualizar' });

        values.push(id);
        const query = `UPDATE pedidos SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error actualizando pedido:', error);
        res.status(500).json({ message: 'Error actualizando pedido' });
    }
});

// Eliminar pedido
app.delete('/api/pedidos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const exists = await pool.query('SELECT id FROM pedidos WHERE id = $1', [id]);
        if (exists.rows.length === 0) return res.status(404).json({ message: 'Pedido no encontrado' });
        await pool.query('DELETE FROM pedidos WHERE id = $1', [id]);
        res.json({ message: 'Pedido eliminado' });
    } catch (error) {
        console.error('Error eliminando pedido:', error);
        res.status(500).json({ message: 'Error eliminando pedido' });
    }
});

app.get('/api/vendedor/:vendedorId/seguimiento-activo', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT 
                p.id as pedido_id,
                p.numero_orden,
                p.total,
                p.fecha_pedido,
                p.estado,
                p.direccion_envio,
                p.fecha_envio,
                p.fecha_entrega,
                c.id as cliente_id,
                c.nombre as cliente_nombre,
                c.telefono as cliente_telefono,
                pr.nombre as producto_nombre,
                p.cantidad
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN productos pr ON p.producto_id = pr.id
            WHERE p.vendedor_id = $1
              AND p.estado NOT IN ('entregado', 'cancelado')
            ORDER BY 
                CASE p.estado
                    WHEN 'enviado' THEN 1
                    WHEN 'procesando' THEN 2
                    WHEN 'confirmado' THEN 3
                    WHEN 'pendiente' THEN 4
                    ELSE 5
                END,
                p.fecha_pedido ASC
        `;

        const result = await pool.query(query, [vendedorId]);

        // Formatear para compatibilidad
        const rows = result.rows.map(r => ({
            id: r.pedido_id,
            pedido_id: r.pedido_id,
            pedido_numero: r.numero_orden,
            cliente_nombre: r.cliente_nombre,
            productos: r.producto_nombre || 'Producto no disponible',
            estado_paquete: r.estado,
            ubicacion_actual: r.direccion_envio || 'En preparación',
            fecha_estimada_entrega: null,
            fecha_actualizacion: r.fecha_envio || r.fecha_pedido
        }));

        res.json(rows);

    } catch (error) {
        console.error('Error obteniendo seguimiento activo:', error);
        res.status(500).json({ error: 'Error al cargar seguimiento' });
    }
});

// Obtener estadísticas del vendedor
app.get('/api/vendedor/:vendedorId/estadisticas', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT 
                COUNT(DISTINCT p.id) as total_pedidos,
                COUNT(DISTINCT p.cliente_id) as total_clientes,
                COALESCE(SUM(p.total) FILTER (WHERE p.estado NOT IN ('cancelado')), 0) as ventas_totales,
                COALESCE(AVG(p.total) FILTER (WHERE p.estado NOT IN ('cancelado')), 0) as ticket_promedio,
                COUNT(DISTINCT s.id) FILTER (WHERE s.estado_paquete NOT IN ('entregado', 'cancelado')) as pedidos_pendientes
            FROM pedidos p
            LEFT JOIN seguimiento_pedidos s ON p.id = s.pedido_id
            WHERE p.vendedor_id = $1
        `;

        const result = await pool.query(query, [vendedorId]);
        res.json(result.rows[0] || {});

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas' });
    }
});

// Obtener detalles de un pedido específico (CORREGIDO - solo campos existentes)
app.get('/api/pedido/:pedidoId/detalle', async (req, res) => {
    const { pedidoId } = req.params;

    try {
        const query = `
            SELECT 
                p.id,
                p.numero_orden,
                p.cliente_id,
                p.vendedor_id,
                p.producto_id,
                p.cantidad,
                p.subtotal,
                p.impuestos,
                p.descuento,
                p.total,
                p.estado,
                p.metodo_pago,
                p.direccion_envio,
                p.notas,
                p.fecha_pedido,
                p.fecha_confirmacion,
                p.fecha_envio,
                p.fecha_entrega,
                -- Datos del cliente (existentes)
                c.nombre as cliente_nombre,
                c.correo as cliente_email,
                c.telefono as cliente_telefono,
                c.direccion as cliente_direccion,
                -- Datos del vendedor (desde usuarios)
                u.nombre as vendedor_nombre,
                u.email as vendedor_email,
                -- Datos del producto (si existe relación)
                pr.nombre as producto_nombre,
                pr.precio as producto_precio,
                pr.marca as producto_marca
            FROM pedidos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            LEFT JOIN usuarios u ON p.vendedor_id = u.id
            LEFT JOIN productos pr ON p.producto_id = pr.id
            WHERE p.id = $1
        `;

        const result = await pool.query(query, [pedidoId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo detalle del pedido:', error);
        res.status(500).json({ error: 'Error al cargar detalle del pedido' });
    }
});

// Obtener perfil del vendedor (desde usuarios)
app.get('/api/vendedor/:vendedorId/perfil', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT 
                id,
                nombre,
                email,
                telefono,
                -- Si no existe zona_asignada en usuarios, puedes agregarla o calcularla
                'Centro' as zona_asignada,  -- Valor por defecto
                direccion,
                ciudad,
                codigo_postal,
                fecha_creacion as fecha_contratacion,
                activo,
                CASE WHEN rol = 'vendedor' THEN 50000 ELSE 0 END as meta_ventas_mensual,
                10 as comision_porcentaje  -- Comisión por defecto
            FROM usuarios 
            WHERE id = $1 AND rol = 'vendedor' AND activo = true
        `;

        const result = await pool.query(query, [vendedorId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo perfil del vendedor:', error);
        res.status(500).json({ error: 'Error al cargar perfil' });
    }
});

// Actualizar perfil del vendedor (en usuarios)
app.put('/api/vendedor/:vendedorId/actualizar', async (req, res) => {
    const { vendedorId } = req.params;
    const {
        nombre,
        telefono,
        direccion,
        ciudad,
        codigo_postal,
        password_actual,
        password_nueva
    } = req.body;

    try {
        // Verificar que el usuario existe y es vendedor
        const usuarioCheck = await pool.query(
            'SELECT * FROM usuarios WHERE id = $1 AND rol = $2',
            [vendedorId, 'vendedor']
        );

        if (usuarioCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }

        const usuario = usuarioCheck.rows[0];

        // Si se quiere cambiar la contraseña
        if (password_nueva) {
            // Verificar contraseña actual
            const passwordValida = (usuario.password_hash === '$2b$10$' + password_actual);
            if (!passwordValida) {
                return res.status(401).json({ error: 'Contraseña actual incorrecta' });
            }

            // Actualizar con nueva contraseña
            await pool.query(
                `UPDATE usuarios 
                 SET nombre = COALESCE($1, nombre),
                     telefono = COALESCE($2, telefono),
                     direccion = COALESCE($3, direccion),
                     ciudad = COALESCE($4, ciudad),
                     codigo_postal = COALESCE($5, codigo_postal),
                     password_hash = $6,
                     fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE id = $7`,
                [nombre, telefono, direccion, ciudad, codigo_postal, '$2b$10$' + password_nueva, vendedorId]
            );
        } else {
            // Actualizar sin cambiar contraseña
            await pool.query(
                `UPDATE usuarios 
                 SET nombre = COALESCE($1, nombre),
                     telefono = COALESCE($2, telefono),
                     direccion = COALESCE($3, direccion),
                     ciudad = COALESCE($4, ciudad),
                     codigo_postal = COALESCE($5, codigo_postal),
                     fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE id = $6`,
                [nombre, telefono, direccion, ciudad, codigo_postal, vendedorId]
            );
        }

        // Obtener datos actualizados
        const result = await pool.query(
            'SELECT id, nombre, email, telefono, rol FROM usuarios WHERE id = $1',
            [vendedorId]
        );

        res.json({
            message: 'Perfil actualizado correctamente',
            vendedor: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualizando vendedor:', error);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
});

// Obtener estadísticas completas del vendedor
app.get('/api/vendedor/:vendedorId/estadisticas', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT 
                COUNT(DISTINCT p.cliente_id) as total_clientes,
                COALESCE(SUM(p.total), 0) as ventas_totales,
                COALESCE(SUM(p.total) FILTER (
                    WHERE DATE_TRUNC('month', p.fecha_pedido) = DATE_TRUNC('month', CURRENT_DATE)
                ), 0) as ventas_mes,
                COUNT(DISTINCT p.id) FILTER (
                    WHERE DATE_TRUNC('month', p.fecha_pedido) = DATE_TRUNC('month', CURRENT_DATE)
                ) as pedidos_mes,
                MIN(p.fecha_pedido) as primera_venta,
                (SELECT fecha_contratacion FROM vendedores WHERE id = $1) as fecha_ingreso
            FROM pedidos p
            WHERE p.vendedor_id = $1
                AND p.estado NOT IN ('cancelado')
        `;

        const result = await pool.query(query, [vendedorId]);
        res.json(result.rows[0] || {});

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas' });
    }
});

// ==================== ENDPOINTS ADMIN PRODUCTOS ====================

// Obtener todos los productos (admin)
app.get('/api/admin/productos', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, nombre, descripcion, precio, stock, stock_minimo,
                marca, genero, tamanio_ml, notas_olfativas, imagen_url,
                proveedor_id, activo, restock, fecha_creacion
            FROM productos
            ORDER BY id ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo productos admin:', error);
        res.status(500).json({ error: 'Error al cargar productos' });
    }
});

// Crear producto (admin)
app.post('/api/admin/productos', async (req, res) => {
    const {
        nombre, descripcion, precio, stock, stock_minimo,
        marca, genero, tamanio_ml, notas_olfativas, imagen_url,
        proveedor_id, activo, restock
    } = req.body;

    if (!nombre || !precio || precio < 0) {
        return res.status(400).json({ error: 'Nombre y precio válido son requeridos' });
    }

    try {
        const query = `
            INSERT INTO productos (
                nombre, descripcion, precio, stock, stock_minimo,
                marca, genero, tamanio_ml, notas_olfativas, imagen_url,
                proveedor_id, activo, restock
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            RETURNING *
        `;
        const result = await pool.query(query, [
            nombre, descripcion || '', precio, stock || 0, stock_minimo || 10,
            marca || '', genero || null, tamanio_ml || null, notas_olfativas || '',
            imagen_url || '', proveedor_id || 2,
            activo !== undefined ? activo : true, restock || null
        ]);
        res.status(201).json({ message: 'Producto creado', producto: result.rows[0] });
    } catch (error) {
        console.error('Error creando producto admin:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// ==================== ENDPOINTS PARA PRODUCTOS DEL VENDEDOR ====================

// Obtener todos los productos del vendedor
app.get('/api/vendedor/:vendedorId/productos', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT 
                id,
                nombre,
                descripcion,
                precio,
                stock,
                stock_minimo,
                marca,
                genero,
                tamanio_ml,
                notas_olfativas,
                imagen_url,
                proveedor_id,
                activo,
                restock,
                fecha_creacion
            FROM productos 
            WHERE vendedor_id = $1
            ORDER BY fecha_creacion DESC
        `;

        const result = await pool.query(query, [vendedorId]);
        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error al cargar productos' });
    }
});

// Obtener movimientos de inventario (admin)
app.get('/api/movimientos-inventario', async (req, res) => {
    try {
        const query = `
            SELECT m.id, m.producto_id, p.nombre as producto_nombre,
                   m.tipo, m.cantidad, m.motivo, m.fecha
            FROM movimientos_inventario m
            LEFT JOIN productos p ON m.producto_id = p.id
            ORDER BY m.fecha DESC
            LIMIT 1000
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo movimientos de inventario:', error);
        res.status(500).json({ error: 'Error al cargar movimientos' });
    }
});

// Crear nuevo producto
app.post('/api/vendedor/:vendedorId/productos', async (req, res) => {
    const { vendedorId } = req.params;
    const {
        nombre,
        descripcion,
        precio,
        stock,
        stock_minimo,
        marca,
        genero,
        tamanio_ml,
        notas_olfativas,
        imagen_url,
        proveedor_id,
        activo,
        restock
    } = req.body;

    // Validaciones básicas
    if (!nombre || !precio || precio < 0) {
        return res.status(400).json({ error: 'Nombre y precio válido son requeridos' });
    }

    try {
        const query = `
            INSERT INTO productos (
                nombre, descripcion, precio, stock, stock_minimo,
                marca, genero, tamanio_ml, notas_olfativas, imagen_url,
                vendedor_id, proveedor_id, activo, restock
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `;

        const result = await pool.query(query, [
            nombre, descripcion || '', precio, stock || 0, stock_minimo || 5,
            marca || '', genero || '', tamanio_ml || null, notas_olfativas || '',
            imagen_url || '', vendedorId, proveedor_id || 2,
            activo !== undefined ? activo : true, restock || 'push'
        ]);

        res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: result.rows[0]
        });

    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// Actualizar producto
app.put('/api/productos/:productoId', async (req, res) => {
    const { productoId } = req.params;
    const {
        nombre,
        descripcion,
        precio,
        stock,
        stock_minimo,
        marca,
        genero,
        tamanio_ml,
        notas_olfativas,
        imagen_url,
        proveedor_id,
        activo,
        restock
    } = req.body;

    try {
        // Verificar que el producto existe y pertenece al vendedor
        const productoExistente = await pool.query(
            'SELECT * FROM productos WHERE id = $1',
            [productoId]
        );

        if (productoExistente.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const query = `
            UPDATE productos 
            SET 
                nombre = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                precio = COALESCE($3, precio),
                stock = COALESCE($4, stock),
                stock_minimo = COALESCE($5, stock_minimo),
                marca = COALESCE($6, marca),
                genero = COALESCE($7, genero),
                tamanio_ml = COALESCE($8, tamanio_ml),
                notas_olfativas = COALESCE($9, notas_olfativas),
                imagen_url = COALESCE($10, imagen_url),
                proveedor_id = COALESCE($11, proveedor_id),
                activo = COALESCE($12, activo),
                restock = COALESCE($13, restock),
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $14
            RETURNING *
        `;

        const result = await pool.query(query, [
            nombre, descripcion, precio, stock, stock_minimo,
            marca, genero, tamanio_ml, notas_olfativas, imagen_url,
            proveedor_id, activo, restock, productoId
        ]);

        res.json({
            message: 'Producto actualizado exitosamente',
            producto: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// Cambiar estado del producto (activar/desactivar)
app.put('/api/productos/:productoId/estado', async (req, res) => {
    const { productoId } = req.params;
    const { activo } = req.body;

    try {
        const result = await pool.query(
            `UPDATE productos 
             SET activo = $1, fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, nombre, activo`,
            [activo, productoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            message: `Producto ${activo ? 'activado' : 'desactivado'}`,
            producto: result.rows[0]
        });

    } catch (error) {
        console.error('Error cambiando estado:', error);
        res.status(500).json({ error: 'Error al cambiar estado' });
    }
});

// Eliminar producto (sin usar carrito obsoleto)
app.delete('/api/productos/:productoId', async (req, res) => {
    const { productoId } = req.params;

    try {
        // Verificar si el producto tiene pedidos asociados
        const pedidosCheck = await pool.query(
            'SELECT id FROM pedidos WHERE producto_id = $1 LIMIT 1',
            [productoId]
        );

        if (pedidosCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el producto porque tiene pedidos asociados. Desactívelo en su lugar.'
            });
        }

        const result = await pool.query(
            'DELETE FROM productos WHERE id = $1 RETURNING id, nombre',
            [productoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            message: 'Producto eliminado exitosamente',
            producto: result.rows[0]
        });

    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// Obtener proveedores activos para el select
app.get('/api/proveedores/activos', async (req, res) => {
    try {
        const query = `
            SELECT 
                id, 
                nombre, 
                contacto,
                email,
                telefono
            FROM proveedores 
            WHERE activo = true 
            ORDER BY nombre ASC
        `;

        const result = await pool.query(query);
        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo proveedores:', error);
        res.status(500).json({ error: 'Error al cargar proveedores' });
    }
});

// Obtener estadísticas de productos del vendedor
app.get('/api/vendedor/:vendedorId/productos/stats', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE activo = true) as activos,
                COALESCE(SUM(stock), 0) as stock_total,
                COALESCE(SUM(precio * stock), 0) as valor_total
            FROM productos 
            WHERE vendedor_id = $1
        `;

        const result = await pool.query(query, [vendedorId]);
        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas' });
    }
});

// Obtener productos activos para el catálogo
app.get('/api/productos/activos', async (req, res) => {
    try {
        const query = `
        SELECT 
                id,
                nombre,
                descripcion,
                precio,
                stock,
                stock_minimo,
                marca,
                genero,
                tamanio_ml,
                notas_olfativas,
                imagen_url,
                vendedor_id,
                activo
            FROM productos 
            WHERE activo = true AND stock > 0
            ORDER BY nombre ASC
        `;

        const result = await pool.query(query);
        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error al cargar productos' });
    }
});

// Obtener movimientos de inventario (admin)
app.get('/api/movimientos-inventario', async (req, res) => {
    try {
        const query = `
            SELECT m.id, m.producto_id, p.nombre as producto_nombre,
                   m.tipo, m.cantidad, m.motivo, m.fecha
            FROM movimientos_inventario m
            LEFT JOIN productos p ON m.producto_id = p.id
            ORDER BY m.fecha DESC
            LIMIT 1000
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo movimientos de inventario:', error);
        res.status(500).json({ error: 'Error al cargar movimientos' });
    }
});



const twilio = require('twilio');

const TWILIO_SID   = 'AC84ebe74f3ed5eedec7e702734fbbfcee';
const TWILIO_TOKEN = '440737f06c5f36078bdb20ed96c6772d';
const TWILIO_FROM  = 'whatsapp:+14155238886';   // número de Twilio sandbox
const ADMIN_WA     = [                          // números que reciben alertas
    'whatsapp:+5214495128713',  // Juan Carlos
    // 'whatsapp:+5214651620340',  // Diego (desactivado para ahorrar mensajes)
];

const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);

// ---------- 2. CREAR TABLA SI NO EXISTE (al arrancar server) ----
pool.query(`
    CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
        id          SERIAL PRIMARY KEY,
        producto_id INTEGER REFERENCES public.productos(id) ON DELETE SET NULL,
        tipo        VARCHAR(20) NOT NULL DEFAULT 'entrada',
        cantidad    INTEGER NOT NULL,
        motivo      TEXT,
        fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).then(() => console.log('✅ Tabla movimientos_inventario lista'))
  .catch(e  => console.error('❌ Error tabla movimientos:', e.message));

// ---------- 3. ENDPOINT RESTOCK ---------------------------------
// Llama a este endpoint desde el frontend cuando el admin presione
// el botón 🔄 Restock en un producto.
// Actualiza el stock en productos + guarda movimiento + manda WhatsApp

app.post('/api/restock/:productoId', async (req, res) => {
    const { productoId } = req.params;
    const { cantidad, motivo } = req.body;

    if (!cantidad || parseInt(cantidad) < 1) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }

    try {
        // Buscar producto
        const prodResult = await pool.query(
            'SELECT p.*, pr.nombre AS proveedor_nombre, pr.telefono AS proveedor_tel FROM public.productos p LEFT JOIN public.proveedores pr ON p.proveedor_id = pr.id WHERE p.id = $1',
            [parseInt(productoId)]
        );

        if (prodResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const producto      = prodResult.rows[0];
        const stockAnterior = producto.stock;
        const stockNuevo    = stockAnterior + parseInt(cantidad);

        // Actualizar stock
        await pool.query(
            'UPDATE public.productos SET stock = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2',
            [stockNuevo, parseInt(productoId)]
        );

        // Registrar movimiento
        await pool.query(
            `INSERT INTO public.movimientos_inventario (producto_id, tipo, cantidad, motivo)
             VALUES ($1, 'entrada', $2, $3)`,
            [parseInt(productoId), parseInt(cantidad), motivo || 'Restock manual desde admin']
        );

        // Mandar WhatsApp a tu celular
        const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

        const mensaje =
`🔔 *ALERTA DE RESTOCK - Perfumes NE2*

📦 *Producto:* ${producto.nombre}
🏷️ *Marca:* ${producto.marca || 'N/A'}
📊 *Stock anterior:* ${stockAnterior} unidades
✅ *Stock nuevo:* ${stockNuevo} unidades
➕ *Cantidad agregada:* ${cantidad}
🏪 *Proveedor:* ${producto.proveedor_nombre || 'No asignado'} ${producto.proveedor_tel ? '(' + producto.proveedor_tel + ')' : ''}
📝 *Motivo:* ${motivo || 'Restock manual'}
🕐 *Fecha:* ${fecha}`;

        await Promise.all(ADMIN_WA.map(numero =>
            twilioClient.messages.create({ from: TWILIO_FROM, to: numero, body: mensaje })
        ));

        console.log(`📦 Restock OK: ${producto.nombre} ${stockAnterior} → ${stockNuevo} | WhatsApp enviado a ${ADMIN_WA.length} números ✅`);

        res.json({
            success:       true,
            mensaje:       '✅ Restock aplicado y WhatsApp enviado a Juan Carlos',
            producto:      producto.nombre,
            stock_anterior: stockAnterior,
            stock_nuevo:   stockNuevo
        });

    } catch (error) {
        console.error('❌ Error en restock:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ---------- 4. ENDPOINT VER MOVIMIENTOS (opcional) --------------
app.get('/api/movimientos-inventario', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT mi.*, p.nombre AS producto_nombre, p.marca
            FROM public.movimientos_inventario mi
            LEFT JOIN public.productos p ON mi.producto_id = p.id
            ORDER BY mi.fecha DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== ENDPOINTS PARA RECURSOS EMPRESARIALES ====================

// Obtener todos los recursos de la empresa
app.get('/api/recursos-empresa', async (req, res) => {
    try {
        const query = `
            SELECT id, nombre, categoria, descripcion, numero_serie, marca, modelo,
                   ubicacion, estado, cantidad, fecha_adquisicion, costo_adquisicion,
                   activo, fecha_creacion, fecha_actualizacion
            FROM recursos_empresa
            WHERE activo = true
            ORDER BY categoria, nombre
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo recursos empresa:', error);
        res.status(500).json({ error: 'Error al cargar recursos de la empresa' });
    }
});

// Obtener movimientos de recursos empresariales
app.get('/api/movimientos-recursos', async (req, res) => {
    try {
        const query = `
            SELECT m.id, m.recurso_id, r.nombre as recurso_nombre, r.categoria,
                   m.tipo, m.cantidad, m.motivo, m.responsable, m.observaciones, m.fecha
            FROM movimientos_recursos m
            LEFT JOIN recursos_empresa r ON m.recurso_id = r.id
            ORDER BY m.fecha DESC
            LIMIT 1000
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo movimientos de recursos:', error);
        res.status(500).json({ error: 'Error al cargar movimientos de recursos' });
    }
});

// ---------- 5. ENDPOINT COMPRA (descuenta stock + registra movimiento + alerta push) ------
app.post('/api/comprar', async (req, res) => {
    const { items, item_ids, cliente_id, session_id, carrito_id, metodo_pago, direccion_envio, notas } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Se requiere un arreglo de items' });
    }

    const clienteIdNum = cliente_id ? parseInt(cliente_id) : null;

    if (!clienteIdNum) {
        return res.status(400).json({ error: 'cliente_id es requerido para registrar el pedido' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // DEFINIR carritoIdsParaVaciar AQUÍ
        const carritoIdsParaVaciar = new Set();
        const carritoIdNum = carrito_id ? parseInt(carrito_id) : null;
        const sessionIdStr = session_id ? String(session_id) : null;

        if (carritoIdNum) carritoIdsParaVaciar.add(carritoIdNum);

        if (clienteIdNum) {
            const carritoRes = await client.query(
                `SELECT id FROM carritos_persistentes
                 WHERE cliente_id = $1 AND session_id IS NULL
                 ORDER BY fecha_creacion DESC LIMIT 1`,
                [clienteIdNum]
            );
            if (carritoRes.rows[0]?.id) carritoIdsParaVaciar.add(carritoRes.rows[0].id);
        }

        if (sessionIdStr) {
            const carritoRes = await client.query(
                'SELECT id FROM carritos_persistentes WHERE session_id = $1 LIMIT 1',
                [sessionIdStr]
            );
            if (carritoRes.rows[0]?.id) carritoIdsParaVaciar.add(carritoRes.rows[0].id);
        }

        const resultados = [];
        const alertasPush = [];

        // Obtener info del cliente
        let clienteCorreo = null;
        let clienteNombre = null;
        try {
            const clienteRes = await client.query(
                'SELECT nombre, correo FROM public.clientes WHERE id = $1 LIMIT 1',
                [clienteIdNum]
            );
            if (clienteRes.rows[0]) {
                clienteNombre = clienteRes.rows[0].nombre || null;
                clienteCorreo = clienteRes.rows[0].correo || null;
            }
        } catch (e) {
            console.warn('No se pudo obtener correo del cliente para confirmación:', e.message);
        }

        // Generar número de orden único
        const crypto = require('crypto');
        const generarNumeroOrdenUnico = async () => {
            for (let i = 0; i < 5; i++) {
                const candidate = `PED-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
                const exists = await client.query('SELECT 1 FROM pedidos WHERE numero_orden = $1 LIMIT 1', [candidate]);
                if (exists.rowCount === 0) return candidate;
            }
            return `PED-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        };

        const numero_orden_unico = await generarNumeroOrdenUnico();
        const pedidos_creados = [];
        const itemsResumen = [];
        let totalOrden = 0;

        for (const item of items) {
            const prodId = parseInt(item.producto_id);
            const cant = parseInt(item.cantidad);
            if (!prodId || !cant || cant < 1) continue;

            // Obtener producto con lock
            const prodRes = await client.query(
                'SELECT p.*, pr.nombre AS proveedor_nombre, pr.telefono AS proveedor_tel FROM public.productos p LEFT JOIN public.proveedores pr ON p.proveedor_id = pr.id WHERE p.id = $1 FOR UPDATE OF p',
                [prodId]
            );
            if (prodRes.rows.length === 0) continue;

            const producto = prodRes.rows[0];
            if (producto.stock < cant) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}` });
            }

            const stockNuevo = producto.stock - cant;

            // Actualizar stock
            await client.query(
                'UPDATE public.productos SET stock = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2',
                [stockNuevo, prodId]
            );

            // Registrar movimiento de salida
            await client.query(
                `INSERT INTO public.movimientos_inventario (producto_id, tipo, cantidad, motivo)
                 VALUES ($1, 'salida', $2, 'Venta desde catálogo')`,
                [prodId, cant]
            );

            // Calcular montos
            const precio = parseFloat(producto.precio) || 0;
            const ivaPorcentaje = Number.isFinite(parseFloat(producto.iva_porcentaje)) ? parseFloat(producto.iva_porcentaje) : 0;
            const subtotal = precio * cant;
            const impuestos = subtotal * (ivaPorcentaje / 100);
            const descuento = 0;
            const totalItem = subtotal + impuestos - descuento;
            totalOrden += totalItem;
            const vendedorId = producto.vendedor_id ? parseInt(producto.vendedor_id) : null;

            // Crear pedido con el MISMO numero_orden para todos los productos
            const pedidoIns = await client.query(
                `INSERT INTO public.pedidos (
                    numero_orden, cliente_id, vendedor_id, producto_id, cantidad,
                    subtotal, impuestos, descuento, total,
                    estado, metodo_pago, direccion_envio, notas
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9,
                    'pendiente', $10, $11, $12
                ) RETURNING id`,
                [
                    numero_orden_unico,
                    clienteIdNum,
                    vendedorId,
                    prodId,
                    cant,
                    subtotal,
                    impuestos,
                    descuento,
                    totalItem,
                    metodo_pago || null,
                    direccion_envio || null,
                    notas || null
                ]
            );

            if (pedidoIns.rows[0]?.id) {
                pedidos_creados.push(pedidoIns.rows[0].id);
            }

            resultados.push({ id: prodId, nombre: producto.nombre, stock_anterior: producto.stock, stock_nuevo: stockNuevo });
            itemsResumen.push({ nombre: producto.nombre, cantidad: cant });

            // Si es push y llegó al stock mínimo → auto-restock
            if (producto.restock === 'push' && stockNuevo <= (producto.stock_minimo || 10)) {
                const minimo = producto.stock_minimo || 10;
                const autoRestock = minimo - stockNuevo;
                const stockFinal = minimo;

                await client.query(
                    'UPDATE public.productos SET stock = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2',
                    [stockFinal, prodId]
                );

                await client.query(
                    `INSERT INTO public.movimientos_inventario (producto_id, tipo, cantidad, motivo)
                     VALUES ($1, 'entrada', $2, 'Restock automático (push) - stock mínimo alcanzado')`,
                    [prodId, autoRestock]
                );

                const idx = resultados.findIndex(r => r.id === prodId);
                if (idx >= 0) resultados[idx].stock_nuevo = stockFinal;

                alertasPush.push({
                    ...producto,
                    stock_nuevo: stockFinal,
                    stock_antes_restock: stockNuevo,
                    stock_anterior: producto.stock,
                    auto_restock: autoRestock
                });
            }
        }

        // Vaciar carritos persistentes
        const carritoVaciado = [];

        // Opción: borrar por item_ids explícitos
        const itemIds = Array.isArray(item_ids) ? item_ids.map(x => parseInt(x)).filter(n => Number.isFinite(n)) : [];
        if (itemIds.length > 0) {
            const carritosAfectadosRes = await client.query(
                'SELECT DISTINCT carrito_id FROM carrito_items_persistentes WHERE id = ANY($1::int[])',
                [itemIds]
            );
            const carritosAfectados = carritosAfectadosRes.rows.map(r => r.carrito_id).filter(Boolean);

            const delRes = await client.query(
                'DELETE FROM carrito_items_persistentes WHERE id = ANY($1::int[])',
                [itemIds]
            );

            for (const cid of carritosAfectados) {
                await client.query('UPDATE carritos_persistentes SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $1', [cid]);
                carritoVaciado.push({ carrito_id: cid, cleared: null });
            }

            carritoIdsParaVaciar.clear();
            carritoVaciado.unshift({ mode: 'by_item_ids', cleared: delRes.rowCount || 0, item_ids: itemIds.length });
        }

        // Fallback: vaciar por carrito_id
        for (const cid of carritoIdsParaVaciar) {
            const delRes = await client.query('DELETE FROM carrito_items_persistentes WHERE carrito_id = $1', [cid]);
            await client.query('UPDATE carritos_persistentes SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $1', [cid]);
            carritoVaciado.push({ carrito_id: cid, cleared: delRes.rowCount || 0, mode: 'by_carrito_id' });
        }

        if (carritoVaciado.length > 0) {
            console.log('🧹 Carrito vaciado en compra:', {
                cliente_id: cliente_id || null,
                session_id: session_id || null,
                carrito_id: carrito_id || null,
                resumen: carritoVaciado
            });
        }

        await client.query('COMMIT');  // Solo un COMMIT

        // Enviar WhatsApp para productos push
        for (const prod of alertasPush) {
            const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
            const mensaje = `⚠️ *RESTOCK AUTOMÁTICO - Perfumes NE2*

📦 *Producto:* ${prod.nombre}
🏷️ *Marca:* ${prod.marca || 'N/A'}
🔻 *Stock llegó a:* ${prod.stock_antes_restock} unidades (mínimo: ${prod.stock_minimo || 10})
➕ *Se agregaron:* ${prod.auto_restock} unidades automáticamente
✅ *Stock nuevo:* ${prod.stock_nuevo} unidades
🔄 *Modo:* Automático (push)
🏪 *Proveedor:* ${prod.proveedor_nombre || 'No asignado'} ${prod.proveedor_tel ? '(' + prod.proveedor_tel + ')' : ''}
🕐 *Fecha:* ${fecha}`;

            try {
                await Promise.all(ADMIN_WA.map(numero =>
                    twilioClient.messages.create({ from: TWILIO_FROM, to: numero, body: mensaje })
                ));
                prod.whatsapp_enviado = true;
                console.log(`⚠️ Alerta push enviada: ${prod.nombre}`);
            } catch (waErr) {
                prod.whatsapp_enviado = false;
                prod.whatsapp_error = waErr.message;
                console.error(`❌ Error WhatsApp push para ${prod.nombre}:`, waErr.message);
            }
        }

        // Email de confirmación
        let email_confirmacion = { sent: false, skipped: true, reason: null };
        try {
            const r = await enviarCorreoConfirmacionCompra({
                to: clienteCorreo,
                nombre: clienteNombre,
                numero_orden: numero_orden_unico,
                total: totalOrden,
                metodo_pago,
                itemsResumen
            });
            email_confirmacion = r;
            if (r.sent) {
                console.log('📧 Correo de confirmación enviado a cliente:', { cliente_id: clienteIdNum, to: clienteCorreo, numero_orden: numero_orden_unico });
            } else {
                console.warn('⚠️ No se envió correo de confirmación:', { cliente_id: clienteIdNum, to: clienteCorreo, reason: r.reason });
            }
        } catch (e) {
            console.warn('⚠️ Error inesperado enviando correo de confirmación:', e.message);
            email_confirmacion = { sent: false, skipped: false, reason: e.message };
        }

        res.json({
            success: true,
            numero_orden: numero_orden_unico,
            pedidos_creados,
            resultados,
            carrito_vaciado: carritoVaciado,
            email_confirmacion,
            alertas_push: alertasPush.map(p => ({
                nombre: p.nombre,
                stock_antes_restock: p.stock_antes_restock,
                stock_nuevo: p.stock_nuevo,
                auto_restock: p.auto_restock,
                stock_minimo: p.stock_minimo || 10,
                whatsapp_enviado: p.whatsapp_enviado || false,
                whatsapp_error: p.whatsapp_error || null
            }))
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en compra:', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// ---------- 6. ENDPOINT PUSH RESTOCK (solicitud manual a proveedor) ------
app.post('/api/restock-push', async (req, res) => {
    const { producto_id, proveedor_id, cantidad, mensaje_extra } = req.body;

    if (!producto_id || !cantidad || parseInt(cantidad) < 1) {
        return res.status(400).json({ error: 'Producto y cantidad son requeridos' });
    }

    try {
        const prodRes = await pool.query(
            'SELECT p.*, pr.nombre AS proveedor_nombre, pr.telefono AS proveedor_tel, pr.email AS proveedor_email FROM public.productos p LEFT JOIN public.proveedores pr ON pr.id = $2 WHERE p.id = $1',
            [parseInt(producto_id), parseInt(proveedor_id) || null]
        );

        if (prodRes.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const producto = prodRes.rows[0];
        const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

        const mensaje =
`📋 *SOLICITUD DE PEDIDO - Perfumes NE2*

📦 *Producto:* ${producto.nombre}
🏷️ *Marca:* ${producto.marca || 'N/A'}
📊 *Stock actual:* ${producto.stock} unidades
🔻 *Stock mínimo:* ${producto.stock_minimo || 10}
➕ *Cantidad solicitada:* ${cantidad}
🏪 *Proveedor:* ${producto.proveedor_nombre || 'No asignado'}
📝 *Nota:* ${mensaje_extra || 'Pedido de restock push'}
🕐 *Fecha:* ${fecha}

✅ *Favor de confirmar disponibilidad y tiempo de entrega.*`;

        await Promise.all(ADMIN_WA.map(numero =>
            twilioClient.messages.create({ from: TWILIO_FROM, to: numero, body: mensaje })
        ));

        console.log(`📋 Solicitud push enviada: ${producto.nombre} x${cantidad} | Proveedor: ${producto.proveedor_nombre || 'N/A'}`);

        res.json({
            success: true,
            mensaje: 'Solicitud de pedido enviada por WhatsApp',
            producto: producto.nombre,
            proveedor: producto.proveedor_nombre || 'No asignado'
        });

    } catch (error) {
        console.error('❌ Error en restock-push:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ---------- 7. PRODUCTOS PUSH CON STOCK BAJO ------
app.get('/api/productos-push-bajo', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.nombre, p.marca, p.stock, p.stock_minimo, p.proveedor_id,
                   pr.nombre AS proveedor_nombre
            FROM public.productos p
            LEFT JOIN public.proveedores pr ON p.proveedor_id = pr.id
            WHERE p.restock = 'push' AND p.activo = true
            ORDER BY p.stock ASC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== RUTAS FALTANTES PARA REPORTE ERP ====================

// Alias para movimientos (el HTML llama /api/movimientos)
app.get('/api/movimientos', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT mi.*, p.nombre AS producto_nombre, p.marca
            FROM public.movimientos_inventario mi
            LEFT JOIN public.productos p ON mi.producto_id = p.id
            ORDER BY mi.fecha DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Alias para proveedores (el HTML llama /api/proveedores)
app.get('/api/proveedores', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM proveedores ORDER BY nombre ASC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== FACTURA POR EMAIL (PDF) ====================
app.post('/api/factura/enviar-pdf', async (req, res) => {
    const { to, pdf_base64, filename, subject, message } = req.body || {};

    if (!to || typeof to !== 'string') {
        return res.status(400).json({ error: 'El correo destino (to) es requerido' });
    }
    const email = to.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Correo destino inválido' });
    }

    if (!pdf_base64 || typeof pdf_base64 !== 'string') {
        return res.status(400).json({ error: 'pdf_base64 es requerido' });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    const smtpSecure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true';

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !smtpFrom) {
        return res.status(500).json({
            error: 'SMTP no configurado. Define SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y (opcional) SMTP_FROM, SMTP_SECURE.'
        });
    }

    let pdfBuffer;
    try {
        pdfBuffer = Buffer.from(pdf_base64, 'base64');
    } catch {
        return res.status(400).json({ error: 'pdf_base64 inválido' });
    }

    if (!pdfBuffer || pdfBuffer.length < 100) {
        return res.status(400).json({ error: 'El PDF recibido está vacío o corrupto' });
    }
    if (pdfBuffer.length > 25 * 1024 * 1024) {
        return res.status(413).json({ error: 'El PDF excede el tamaño máximo (25MB)' });
    }

    const safeFilename = (typeof filename === 'string' && filename.trim())
        ? filename.trim().replace(/[^a-zA-Z0-9._-]/g, '_')
        : 'factura.pdf';

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        await transporter.sendMail({
            from: smtpFrom,
            to: email,
            subject: (typeof subject === 'string' && subject.trim()) ? subject.trim() : 'Factura - Perfumes & Aromas',
            text: (typeof message === 'string' && message.trim())
                ? message.trim()
                : 'Adjunto encontrarás tu factura en formato PDF.',
            attachments: [
                {
                    filename: safeFilename,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error enviando factura por email:', error);
        res.status(500).json({ error: 'No se pudo enviar el correo', detail: error.message });
    }
});

// Manejo de errores del body parser (payload demasiado grande)
app.use((err, req, res, next) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
        return res.status(413).json({
            error: 'El archivo es demasiado grande para enviarse por correo. Intenta con una factura más corta o reduce la escala del PDF.'
        });
    }
    return next(err);
});

// Alias para clientes (el HTML llama /api/clientes)
app.get('/api/clientes', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre, correo, telefono, ciudad, estado_cliente, etapa_crm FROM clientes ORDER BY id ASC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pedidos para admin (el HTML llama /api/admin/pedidos)
app.get('/api/admin/pedidos', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM pedidos ORDER BY fecha_pedido DESC'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== ENDPOINTS PARA SISTEMA DE TICKETS ====================

// Obtener tickets de un vendedor específico
app.get('/api/vendedor/:vendedorId/tickets', async (req, res) => {
    const { vendedorId } = req.params;
    const { estado, prioridad } = req.query;

    try {
        let query = `
            SELECT t.*, 
                   c.nombre as cliente_nombre,
                   c.correo as cliente_email,
                   c.telefono as cliente_telefono,
                   p.numero_orden as pedido_numero,
                   (SELECT COUNT(*) FROM respuestas_tickets WHERE ticket_id = t.num_ticket) as total_respuestas
            FROM tickets t
            LEFT JOIN clientes c ON t.cliente = c.id
            LEFT JOIN pedidos p ON t.pedido = p.id
            WHERE t.vendedor = $1
        `;

        let params = [vendedorId];
        let paramIndex = 2;

        if (estado) {
            query += ` AND t.estado = $${paramIndex}`;
            params.push(estado);
            paramIndex++;
        }

        if (prioridad) {
            query += ` AND t.prioridad = $${paramIndex}`;
            params.push(prioridad);
            paramIndex++;
        }

        query += ` ORDER BY 
            CASE t.estado
                WHEN 'abierto' THEN 1
                WHEN 'en_proceso' THEN 2
                WHEN 'resuelto' THEN 3
                WHEN 'cerrado' THEN 4
                ELSE 5
            END,
            t.fecha_creacion DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo tickets:', error);
        res.status(500).json({ error: 'Error al cargar tickets' });
    }
});

// Obtener detalles de un ticket específico (con conversación completa)
app.get('/api/tickets/:ticketId', async (req, res) => {
    const { ticketId } = req.params;

    try {
        // Obtener información del ticket
        const ticketResult = await pool.query(`
            SELECT t.*, 
                   c.nombre as cliente_nombre,
                   c.correo as cliente_email,
                   c.telefono as cliente_telefono,
                   p.numero_orden as pedido_numero,
                   u.nombre as vendedor_nombre
            FROM tickets t
            LEFT JOIN clientes c ON t.cliente = c.id
            LEFT JOIN pedidos p ON t.pedido = p.id
            LEFT JOIN usuarios u ON t.vendedor = u.id
            WHERE t.num_ticket = $1
        `, [ticketId]);

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        // Obtener todas las respuestas (conversación)
        const respuestasResult = await pool.query(`
            SELECT r.*,
                   CASE 
                       WHEN r.remitente_type = 'vendedor' THEN u.nombre
                       WHEN r.remitente_type = 'cliente' THEN c.nombre
                   END as remitente_nombre
            FROM respuestas_tickets r
            LEFT JOIN usuarios u ON r.remitente_type = 'vendedor' AND r.remitente_id = u.id
            LEFT JOIN clientes c ON r.remitente_type = 'cliente' AND r.remitente_id = c.id
            WHERE r.ticket_id = $1
            ORDER BY r.fecha ASC
        `, [ticketId]);

        const ticket = ticketResult.rows[0];
        ticket.respuestas = respuestasResult.rows;

        res.json(ticket);

    } catch (error) {
        console.error('Error obteniendo detalle del ticket:', error);
        res.status(500).json({ error: 'Error al cargar detalle del ticket' });
    }
});

// Crear nuevo ticket (desde cliente)
app.post('/api/tickets', async (req, res) => {
    const { cliente_id, vendedor_id, asunto, mensaje, pedido_id, prioridad, categoria } = req.body;

    if (!cliente_id || !vendedor_id || !asunto || !mensaje) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO tickets (vendedor, cliente, asunto, mensaje, pedido, prioridad, categoria, estado, fecha_creacion)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'abierto', CURRENT_TIMESTAMP)
            RETURNING *
        `, [vendedor_id, cliente_id, asunto, mensaje, pedido_id || null, prioridad || 'media', categoria || null]);

        // Registrar la primera respuesta (el mensaje inicial)
        await pool.query(`
            INSERT INTO respuestas_tickets (ticket_id, remitente_type, remitente_id, mensaje)
            VALUES ($1, 'cliente', $2, $3)
        `, [result.rows[0].num_ticket, cliente_id, mensaje]);

        res.status(201).json({
            message: 'Ticket creado exitosamente',
            ticket: result.rows[0]
        });

    } catch (error) {
        console.error('Error creando ticket:', error);
        res.status(500).json({ error: 'Error al crear ticket' });
    }
});

// Responder a un ticket (vendedor)
app.post('/api/tickets/:ticketId/respuesta', async (req, res) => {
    const { ticketId } = req.params;
    const { vendedor_id, mensaje } = req.body;

    if (!vendedor_id || !mensaje) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        // Verificar que el ticket existe y pertenece al vendedor
        const ticketCheck = await pool.query(`
            SELECT estado FROM tickets WHERE num_ticket = $1 AND vendedor = $2
        `, [ticketId, vendedor_id]);

        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado o no te pertenece' });
        }

        // Actualizar estado a 'en_proceso' si estaba abierto
        let newState = ticketCheck.rows[0].estado;
        if (newState === 'abierto') {
            newState = 'en_proceso';
        }

        // Registrar respuesta
        await pool.query(`
            INSERT INTO respuestas_tickets (ticket_id, remitente_type, remitente_id, mensaje)
            VALUES ($1, 'vendedor', $2, $3)
        `, [ticketId, vendedor_id, mensaje]);

        // Actualizar ticket
        await pool.query(`
            UPDATE tickets 
            SET vendedor_respuesta = $1,
                fecha_respuesta = CURRENT_TIMESTAMP,
                estado = $2,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE num_ticket = $3
        `, [mensaje, newState, ticketId]);

        res.json({ message: 'Respuesta enviada exitosamente' });

    } catch (error) {
        console.error('Error respondiendo ticket:', error);
        res.status(500).json({ error: 'Error al enviar respuesta' });
    }
});

// Actualizar estado del ticket
app.put('/api/tickets/:ticketId/estado', async (req, res) => {
    const { ticketId } = req.params;
    const { estado, vendedor_id } = req.body;

    const estadosValidos = ['abierto', 'en_proceso', 'resuelto', 'cerrado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }

    try {
        const result = await pool.query(`
            UPDATE tickets 
            SET estado = $1,
                fecha_actualizacion = CURRENT_TIMESTAMP,
                ${estado === 'cerrado' ? 'fecha_cierre = CURRENT_TIMESTAMP,' : ''}
                ${estado === 'resuelto' ? 'fecha_actualizacion = CURRENT_TIMESTAMP' : ''}
            WHERE num_ticket = $2 AND vendedor = $3
            RETURNING *
        `, [estado, ticketId, vendedor_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json({ message: 'Estado actualizado', ticket: result.rows[0] });

    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// Obtener estadísticas de tickets para un vendedor
app.get('/api/vendedor/:vendedorId/tickets/stats', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_tickets,
                COUNT(*) FILTER (WHERE estado = 'abierto') as abiertos,
                COUNT(*) FILTER (WHERE estado = 'en_proceso') as en_proceso,
                COUNT(*) FILTER (WHERE estado = 'resuelto') as resueltos,
                COUNT(*) FILTER (WHERE estado = 'cerrado') as cerrados,
                COUNT(*) FILTER (WHERE prioridad = 'alta') as prioridad_alta,
                COUNT(*) FILTER (WHERE prioridad = 'media') as prioridad_media,
                COUNT(*) FILTER (WHERE prioridad = 'baja') as prioridad_baja,
                ROUND(AVG(EXTRACT(EPOCH FROM (fecha_respuesta - fecha_creacion))/3600)::numeric, 2) as tiempo_respuesta_promedio_horas
            FROM tickets
            WHERE vendedor = $1
        `, [vendedorId]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas' });
    }
});

// Obtener tickets de un cliente específico
app.get('/api/cliente/:clienteId/tickets', async (req, res) => {
    const { clienteId } = req.params;
    const { estado } = req.query;

    try {
        let query = `
            SELECT t.*, 
                   (SELECT COUNT(*) FROM respuestas_tickets WHERE ticket_id = t.num_ticket) as total_respuestas
            FROM tickets t
            WHERE t.cliente = $1
        `;

        let params = [clienteId];

        if (estado) {
            query += ` AND t.estado = $2`;
            params.push(estado);
        }

        query += ` ORDER BY t.fecha_creacion DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (error) {
        console.error('Error obteniendo tickets del cliente:', error);
        res.status(500).json({ error: 'Error al cargar tickets' });
    }
});

// Estadísticas de tickets para cliente
app.get('/api/cliente/:clienteId/tickets/stats', async (req, res) => {
    const { clienteId } = req.params;

    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE estado = 'abierto') as abiertos,
                COUNT(*) FILTER (WHERE estado = 'en_proceso') as en_proceso,
                COUNT(*) FILTER (WHERE estado = 'resuelto') as resueltos,
                COUNT(*) FILTER (WHERE estado = 'cerrado') as cerrados
            FROM tickets
            WHERE cliente = $1
        `, [clienteId]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al cargar estadísticas' });
    }
});

// Responder a ticket como cliente
app.post('/api/tickets/:ticketId/respuesta-cliente', async (req, res) => {
    const { ticketId } = req.params;
    const { cliente_id, mensaje } = req.body;

    if (!cliente_id || !mensaje) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        // Verificar que el ticket existe y pertenece al cliente
        const ticketCheck = await pool.query(`
            SELECT estado, vendedor FROM tickets WHERE num_ticket = $1 AND cliente = $2
        `, [ticketId, cliente_id]);

        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        // Actualizar estado a 'en_proceso' si estaba resuelto o cerrado
        const estadoActual = ticketCheck.rows[0].estado;
        let nuevoEstado = estadoActual;
        if (estadoActual === 'resuelto' || estadoActual === 'cerrado') {
            nuevoEstado = 'en_proceso';
        }

        // Registrar respuesta
        await pool.query(`
            INSERT INTO respuestas_tickets (ticket_id, remitente_type, remitente_id, mensaje)
            VALUES ($1, 'cliente', $2, $3)
        `, [ticketId, cliente_id, mensaje]);

        // Actualizar ticket
        await pool.query(`
            UPDATE tickets 
            SET cliente_respuesta = $1,
                fecha_actualizacion = CURRENT_TIMESTAMP,
                estado = $2
            WHERE num_ticket = $3
        `, [mensaje, nuevoEstado, ticketId]);

        res.json({ message: 'Respuesta enviada exitosamente' });

    } catch (error) {
        console.error('Error respondiendo ticket:', error);
        res.status(500).json({ error: 'Error al enviar respuesta' });
    }
});

// ==================== ENDPOINTS PARA CARRITO PERSISTENTE ====================

// Obtener o crear carrito para cliente
app.get('/api/carrito', async (req, res) => {
    const clienteId = req.query.cliente_id;
    const sessionId = req.headers['x-session-id'] || req.query.session_id;

    if (!clienteId && !sessionId) {
        return res.status(400).json({ error: 'Se requiere cliente_id o session_id' });
    }

    try {
        let carrito;

        if (clienteId) {
            // Buscar carrito del cliente logueado
            const result = await pool.query(
                `SELECT c.* FROM carritos_persistentes c 
                 WHERE c.cliente_id = $1 AND c.session_id IS NULL
                 ORDER BY c.fecha_creacion DESC LIMIT 1`,
                [clienteId]
            );
            carrito = result.rows[0];
        } else if (sessionId) {
            // Buscar carrito por sesión (usuario no logueado)
            const result = await pool.query(
                'SELECT * FROM carritos_persistentes WHERE session_id = $1',
                [sessionId]
            );
            carrito = result.rows[0];
        }

        // Si no existe, crear uno nuevo
        if (!carrito) {
            const insertResult = await pool.query(
                `INSERT INTO carritos_persistentes (cliente_id, session_id) 
                 VALUES ($1, $2) RETURNING *`,
                [clienteId || null, sessionId || null]
            );
            carrito = insertResult.rows[0];
        }

        // Obtener items del carrito
        const itemsResult = await pool.query(
            `SELECT ci.*, p.nombre, p.marca, p.imagen_url, p.stock
             FROM carrito_items_persistentes ci
             JOIN productos p ON ci.producto_id = p.id
             WHERE ci.carrito_id = $1`,
            [carrito.id]
        );

        res.json({
            id: carrito.id,
            cliente_id: carrito.cliente_id,
            items: itemsResult.rows,
            total_items: itemsResult.rows.reduce((sum, item) => sum + item.cantidad, 0),
            subtotal: itemsResult.rows.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0)
        });

    } catch (error) {
        console.error('Error obteniendo carrito:', error);
        res.status(500).json({ error: 'Error al obtener carrito' });
    }
});

// Agregar item al carrito
app.post('/api/carrito/items', async (req, res) => {
    const { cliente_id, session_id, producto_id, cantidad } = req.body;

    if (!producto_id || !cantidad || cantidad < 1) {
        return res.status(400).json({ error: 'Producto y cantidad son requeridos' });
    }

    try {
        // Verificar stock disponible
        const productoResult = await pool.query(
            'SELECT id, nombre, precio, stock FROM productos WHERE id = $1 AND activo = true',
            [producto_id]
        );

        if (productoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        const producto = productoResult.rows[0];

        if (producto.stock < cantidad) {
            return res.status(400).json({ error: `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles` });
        }

        // Obtener o crear carrito
        let carrito;
        let carritoResult;

        if (cliente_id) {
            carritoResult = await pool.query(
                `SELECT id FROM carritos_persistentes 
                 WHERE cliente_id = $1 AND session_id IS NULL
                 ORDER BY fecha_creacion DESC LIMIT 1`,
                [cliente_id]
            );
        } else if (session_id) {
            carritoResult = await pool.query(
                'SELECT id FROM carritos_persistentes WHERE session_id = $1',
                [session_id]
            );
        }

        if (carritoResult.rows.length === 0) {
            const insertResult = await pool.query(
                `INSERT INTO carritos_persistentes (cliente_id, session_id) 
                 VALUES ($1, $2) RETURNING id`,
                [cliente_id || null, session_id || null]
            );
            carrito = insertResult.rows[0];
        } else {
            carrito = carritoResult.rows[0];
        }

        // Verificar si el producto ya está en el carrito
        const itemExistente = await pool.query(
            'SELECT id, cantidad FROM carrito_items_persistentes WHERE carrito_id = $1 AND producto_id = $2',
            [carrito.id, producto_id]
        );

        if (itemExistente.rows.length > 0) {
            // Actualizar cantidad
            const nuevaCantidad = itemExistente.rows[0].cantidad + cantidad;

            if (producto.stock < nuevaCantidad) {
                return res.status(400).json({ error: `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles` });
            }

            await pool.query(
                'UPDATE carrito_items_persistentes SET cantidad = $1 WHERE id = $2',
                [nuevaCantidad, itemExistente.rows[0].id]
            );
        } else {
            // Insertar nuevo item
            await pool.query(
                `INSERT INTO carrito_items_persistentes (carrito_id, producto_id, cantidad, precio_unitario) 
                 VALUES ($1, $2, $3, $4)`,
                [carrito.id, producto_id, cantidad, producto.precio]
            );
        }

        // Actualizar fecha del carrito
        await pool.query(
            'UPDATE carritos_persistentes SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $1',
            [carrito.id]
        );

        res.json({
            success: true,
            message: 'Producto agregado al carrito',
            carrito_id: carrito.id
        });

    } catch (error) {
        console.error('Error agregando al carrito:', error);
        res.status(500).json({ error: 'Error al agregar producto al carrito' });
    }
});

// Actualizar cantidad de un item
app.put('/api/carrito/items/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const { cantidad } = req.body;

    if (!cantidad || cantidad < 1) {
        return res.status(400).json({ error: 'Cantidad válida es requerida' });
    }

    try {
        // Obtener información del item y producto
        const itemResult = await pool.query(
            `SELECT ci.*, p.stock, p.nombre 
             FROM carrito_items_persistentes ci
             JOIN productos p ON ci.producto_id = p.id
             WHERE ci.id = $1`,
            [itemId]
        );

        if (itemResult.rows.length === 0) {
            return res.status(404).json({ error: 'Item no encontrado' });
        }

        const item = itemResult.rows[0];

        if (item.stock < cantidad) {
            return res.status(400).json({ error: `Stock insuficiente. Solo hay ${item.stock} unidades disponibles` });
        }

        await pool.query(
            'UPDATE carrito_items_persistentes SET cantidad = $1 WHERE id = $2',
            [cantidad, itemId]
        );

        // Actualizar fecha del carrito
        await pool.query(
            `UPDATE carritos_persistentes 
             SET fecha_actualizacion = CURRENT_TIMESTAMP 
             WHERE id = (SELECT carrito_id FROM carrito_items_persistentes WHERE id = $1)`,
            [itemId]
        );

        res.json({ success: true, message: 'Cantidad actualizada' });

    } catch (error) {
        console.error('Error actualizando cantidad:', error);
        res.status(500).json({ error: 'Error al actualizar cantidad' });
    }
});

// Eliminar item del carrito
app.delete('/api/carrito/items/:itemId', async (req, res) => {
    const { itemId } = req.params;

    try {
        await pool.query('DELETE FROM carrito_items_persistentes WHERE id = $1', [itemId]);
        res.json({ success: true, message: 'Item eliminado' });
    } catch (error) {
        console.error('Error eliminando item:', error);
        res.status(500).json({ error: 'Error al eliminar item' });
    }
});

// Vaciar carrito completo
app.post('/api/carrito/vaciar', async (req, res) => {
    const { carrito_id, cliente_id, session_id } = req.body || {};

    try {
        const carritoIds = new Set();
        const carritoIdNum = carrito_id ? parseInt(carrito_id) : null;
        const clienteIdNum = cliente_id ? parseInt(cliente_id) : null;
        const sessionIdStr = session_id ? String(session_id) : null;

        if (carritoIdNum) carritoIds.add(carritoIdNum);

        if (clienteIdNum) {
            const carritoRes = await pool.query(
                `SELECT id FROM carritos_persistentes
                 WHERE cliente_id = $1 AND session_id IS NULL
                 ORDER BY fecha_creacion DESC LIMIT 1`,
                [clienteIdNum]
            );
            if (carritoRes.rows[0]?.id) carritoIds.add(carritoRes.rows[0].id);
        }

        if (sessionIdStr) {
            const carritoRes = await pool.query(
                'SELECT id FROM carritos_persistentes WHERE session_id = $1 LIMIT 1',
                [sessionIdStr]
            );
            if (carritoRes.rows[0]?.id) carritoIds.add(carritoRes.rows[0].id);
        }

        if (carritoIds.size === 0) {
            return res.json({ success: true, cleared: 0, carritos: [] });
        }

        const carritos = [];
        let clearedTotal = 0;
        for (const cid of carritoIds) {
            const delRes = await pool.query('DELETE FROM carrito_items_persistentes WHERE carrito_id = $1', [cid]);
            await pool.query('UPDATE carritos_persistentes SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $1', [cid]);
            const cleared = delRes.rowCount || 0;
            clearedTotal += cleared;
            carritos.push({ carrito_id: cid, cleared });
        }

        res.json({ success: true, cleared: clearedTotal, carritos });
        console.log('🧹 Carrito vaciar endpoint:', { carrito_id, cliente_id, session_id, cleared: clearedTotal, carritos });
    } catch (error) {
        console.error('Error vaciando carrito:', error);
        res.status(500).json({ error: 'Error al vaciar carrito' });
    }
});

// Obtener métodos de pago disponibles
app.get('/api/metodos-pago', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM metodos_pago WHERE activo = true ORDER BY orden ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo métodos de pago:', error);
        res.status(500).json({ error: 'Error al cargar métodos de pago' });
    }
});

// Sincronizar carrito después de login
app.post('/api/carrito/sincronizar', async (req, res) => {
    const { cliente_id, session_id } = req.body;

    if (!cliente_id || !session_id) {
        return res.status(400).json({ error: 'Se requiere cliente_id y session_id' });
    }

    try {
        // Buscar carrito de sesión (anónimo)
        const carritoSesion = await pool.query(
            'SELECT id FROM carritos_persistentes WHERE session_id = $1',
            [session_id]
        );

        // Buscar carrito del cliente logueado
        let carritoCliente = await pool.query(
            'SELECT id FROM carritos_persistentes WHERE cliente_id = $1 AND session_id IS NULL',
            [cliente_id]
        );

        // Si el cliente no tiene carrito, crear uno
        if (carritoCliente.rows.length === 0) {
            const insertResult = await pool.query(
                'INSERT INTO carritos_persistentes (cliente_id) VALUES ($1) RETURNING id',
                [cliente_id]
            );
            carritoCliente = insertResult;
        }

        // Si hay carrito de sesión, mover items al carrito del cliente
        if (carritoSesion.rows.length > 0) {
            // Mover items del carrito de sesión al carrito del cliente
            await pool.query(
                `UPDATE carrito_items_persistentes 
                 SET carrito_id = $1 
                 WHERE carrito_id = $2`,
                [carritoCliente.rows[0].id, carritoSesion.rows[0].id]
            );

            // Eliminar carrito de sesión
            await pool.query('DELETE FROM carritos_persistentes WHERE id = $1', [carritoSesion.rows[0].id]);
        }

        res.json({ success: true, message: 'Carrito sincronizado' });

    } catch (error) {
        console.error('Error sincronizando carrito:', error);
        res.status(500).json({ error: 'Error al sincronizar carrito' });
    }
});

// Editar tarjeta
app.put('/api/tarjetas/:tarjetaId', async (req, res) => {
    const { tarjetaId } = req.params;
    const { tipo, titular, numero, expiracion, cvv, principal, cliente_id } = req.body;

    if (!cliente_id) {
        return res.status(400).json({ error: 'Se requiere cliente_id' });
    }
    if (!tipo || !titular || !numero || !expiracion) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        // Verificar tarjeta existe y pertenece al cliente
        const tarjetaActual = await pool.query(
            'SELECT id, cliente_id FROM tarjetas_credito WHERE id = $1',
            [tarjetaId]
        );

        if (tarjetaActual.rows.length === 0) {
            return res.status(404).json({ error: 'Tarjeta no encontrada' });
        }

        if (String(tarjetaActual.rows[0].cliente_id) !== String(cliente_id)) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Validar duplicado de número (en otra tarjeta del mismo cliente)
        const dup = await pool.query(
            'SELECT id FROM tarjetas_credito WHERE cliente_id = $1 AND numero = $2 AND id <> $3',
            [cliente_id, numero, tarjetaId]
        );
        if (dup.rows.length > 0) {
            return res.status(400).json({ error: 'Esta tarjeta ya está registrada' });
        }

        await pool.query('BEGIN');

        // Si será principal, quitar principal a las demás
        if (principal === true) {
            await pool.query(
                'UPDATE tarjetas_credito SET principal = false WHERE cliente_id = $1 AND id <> $2',
                [cliente_id, tarjetaId]
            );
        }

        const setParts = [];
        const values = [];
        let idx = 1;

        setParts.push(`tipo = $${idx++}`);
        values.push(tipo);

        setParts.push(`titular = $${idx++}`);
        values.push(titular);

        setParts.push(`numero = $${idx++}`);
        values.push(numero);

        setParts.push(`expiracion = $${idx++}`);
        values.push(expiracion);

        // CVV opcional en edición (si viene vacío/no viene, se conserva)
        if (cvv && String(cvv).trim() !== '') {
            setParts.push(`cvv = $${idx++}`);
            values.push(cvv);
        }

        setParts.push(`principal = $${idx++}`);
        values.push(principal === true);

        setParts.push('fecha_actualizacion = CURRENT_TIMESTAMP');

        const tarjetaIdParam = idx++;
        const clienteIdParam = idx++;
        values.push(tarjetaId, cliente_id);

        const updateQuery = `
            UPDATE tarjetas_credito
            SET ${setParts.join(', ')}
            WHERE id = $${tarjetaIdParam} AND cliente_id = $${clienteIdParam}
            RETURNING *
        `;

        const updated = await pool.query(updateQuery, values);

        await pool.query('COMMIT');

        if (updated.rows.length === 0) {
            return res.status(404).json({ error: 'Tarjeta no encontrada' });
        }

        res.json(updated.rows[0]);
    } catch (error) {
        try { await pool.query('ROLLBACK'); } catch (e) {}
        console.error('Error editando tarjeta:', error);
        res.status(500).json({ error: 'Error al editar tarjeta' });
    }
});

// Establecer tarjeta como principal
app.put('/api/tarjetas/:tarjetaId/principal', async (req, res) => {
    const { tarjetaId } = req.params;

    try {
        // Primero obtener el cliente_id de la tarjeta
        const tarjetaResult = await pool.query(
            'SELECT cliente_id FROM tarjetas_credito WHERE id = $1',
            [tarjetaId]
        );

        if (tarjetaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Tarjeta no encontrada' });
        }

        const clienteId = tarjetaResult.rows[0].cliente_id;

        // Quitar principal de todas las tarjetas del cliente
        await pool.query(
            'UPDATE tarjetas_credito SET principal = false WHERE cliente_id = $1',
            [clienteId]
        );

        // Establecer la nueva tarjeta como principal
        await pool.query(
            'UPDATE tarjetas_credito SET principal = true WHERE id = $1',
            [tarjetaId]
        );

        res.json({ message: 'Tarjeta principal actualizada' });

    } catch (error) {
        console.error('Error actualizando tarjeta principal:', error);
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

// Eliminar tarjeta
app.delete('/api/tarjetas/:tarjetaId', async (req, res) => {
    const { tarjetaId } = req.params;

    try {
        await pool.query('DELETE FROM tarjetas_credito WHERE id = $1', [tarjetaId]);
        res.json({ message: 'Tarjeta eliminada' });

    } catch (error) {
        console.error('Error eliminando tarjeta:', error);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

// ==================== FACTURAS (DESDE PEDIDOS) ====================

// Listar facturas (agrupadas por numero_orden) de un cliente
app.get('/api/facturas/cliente/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;
    const clienteIdNum = cliente_id ? parseInt(cliente_id) : null;

    if (!clienteIdNum) {
        return res.status(400).json({ error: 'cliente_id inválido' });
    }

    try {
        const result = await pool.query(
            `SELECT
                p.numero_orden,
                MIN(p.fecha_pedido) AS fecha_pedido,
                SUM(COALESCE(p.subtotal, 0)) AS subtotal,
                SUM(COALESCE(p.impuestos, 0)) AS impuestos,
                SUM(COALESCE(p.descuento, 0)) AS descuento,
                SUM(COALESCE(p.total, 0)) AS total,
                MAX(p.metodo_pago) AS metodo_pago,
                MAX(p.estado) AS estado,
                SUM(COALESCE(p.cantidad, 0)) AS items_count,
                STRING_AGG(DISTINCT COALESCE(pr.nombre, 'Producto'), ', ') AS productos
             FROM pedidos p
             LEFT JOIN productos pr ON pr.id = p.producto_id
             WHERE p.cliente_id = $1
             GROUP BY p.numero_orden
             ORDER BY fecha_pedido DESC
             LIMIT 100`,
            [clienteIdNum]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error listando facturas:', error);
        res.status(500).json({ error: 'Error al listar facturas' });
    }
});

// Obtener detalle de una factura por numero_orden
app.get('/api/facturas/cliente/:cliente_id/:numero_orden', async (req, res) => {
    const { cliente_id, numero_orden } = req.params;
    const clienteIdNum = cliente_id ? parseInt(cliente_id) : null;

    if (!clienteIdNum) {
        return res.status(400).json({ error: 'cliente_id inválido' });
    }
    if (!numero_orden || typeof numero_orden !== 'string') {
        return res.status(400).json({ error: 'numero_orden es requerido' });
    }

    try {
        const clienteRes = await pool.query(
            `SELECT id, nombre, correo, telefono, direccion, ciudad, estado, codigo_postal
             FROM clientes
             WHERE id = $1`,
            [clienteIdNum]
        );

        if (clienteRes.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const rowsRes = await pool.query(
            `SELECT
                p.id,
                p.numero_orden,
                p.fecha_pedido,
                p.estado,
                p.metodo_pago,
                p.direccion_envio,
                p.notas,
                p.producto_id,
                p.cantidad,
                p.subtotal,
                p.impuestos,
                p.descuento,
                p.total,
                pr.nombre AS producto_nombre,
                pr.marca AS producto_marca,
                pr.descripcion AS producto_descripcion,
                pr.precio AS producto_precio
             FROM pedidos p
             LEFT JOIN productos pr ON pr.id = p.producto_id
             WHERE p.cliente_id = $1 AND p.numero_orden = $2
             ORDER BY p.id ASC`,
            [clienteIdNum, numero_orden]
        );

        if (rowsRes.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada para ese número de orden' });
        }

        const items = rowsRes.rows.map(r => {
            const qty = parseInt(r.cantidad) || 0;
            const precioUnit = r.producto_precio !== null && r.producto_precio !== undefined ? parseFloat(r.producto_precio) : 0;
            return {
                producto_id: r.producto_id,
                cantidad: qty,
                nombre: r.producto_nombre || 'Producto',
                descripcion: r.producto_descripcion || r.producto_marca || '—',
                precio_unitario: precioUnit,
                importe: (Number.isFinite(precioUnit) ? precioUnit : 0) * qty
            };
        });

        const subtotalSum = rowsRes.rows.reduce((s, r) => s + (parseFloat(r.subtotal) || 0), 0);
        const impuestosSum = rowsRes.rows.reduce((s, r) => s + (parseFloat(r.impuestos) || 0), 0);
        const descuentoSum = rowsRes.rows.reduce((s, r) => s + (parseFloat(r.descuento) || 0), 0);
        const totalSum = rowsRes.rows.reduce((s, r) => s + (parseFloat(r.total) || 0), 0);

        const crypto = require('crypto');
        const txn = crypto.createHash('sha1').update(String(numero_orden)).digest('hex').slice(0, 12).toUpperCase();
        const fechaPedido = rowsRes.rows.reduce((min, r) => {
            const d = r.fecha_pedido ? new Date(r.fecha_pedido) : null;
            if (!d || isNaN(d.getTime())) return min;
            if (!min) return d;
            return d < min ? d : min;
        }, null);

        res.json({
            numero_orden,
            folio: `FCT-${String(numero_orden).replace(/[^a-zA-Z0-9-]/g, '')}`,
            transactionId: `TXN-${txn}`,
            fecha: fechaPedido ? fechaPedido.toISOString() : null,
            estado: rowsRes.rows[0].estado || null,
            metodo_pago: rowsRes.rows[0].metodo_pago || null,
            direccion_envio: rowsRes.rows[0].direccion_envio || null,
            notas: rowsRes.rows[0].notas || null,
            cliente: clienteRes.rows[0],
            productos: items,
            totals: {
                subtotal: subtotalSum,
                impuestos: impuestosSum,
                descuento: descuentoSum,
                shipping: 0,
                total: totalSum
            }
        });
    } catch (error) {
        console.error('Error obteniendo factura:', error);
        res.status(500).json({ error: 'Error al obtener factura' });
    }
});

// ==================== ENDPOINTS PARA CUPONES ====================

// Validar cupón
app.get('/api/cupones/validar/:codigo', async (req, res) => {
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

        // Verificar si está activo
        if (!cupon.activo) {
            return res.status(400).json({ error: 'Este cupón no está disponible' });
        }

        // Verificar fechas de vigencia
        const ahora = new Date();

        if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) {
            return res.status(400).json({ error: 'Este cupón aún no está vigente' });
        }

        if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) {
            return res.status(400).json({ error: 'Este cupón ha expirado' });
        }

        // Verificar límite de usos
        if (cupon.usos_maximos !== null && cupon.usos_actuales >= cupon.usos_maximos) {
            return res.status(400).json({ error: 'Este cupón ha alcanzado su límite de usos' });
        }

        // Verificar monto mínimo de compra
        if (subtotal < parseFloat(cupon.minimo_compra)) {
            return res.status(400).json({
                error: `Compra mínima de $${parseFloat(cupon.minimo_compra).toFixed(2)}`
            });
        }

        // Calcular descuento
        let descuento = 0;
        let envio_gratis = false;

        if (cupon.tipo === 'porcentaje') {
            descuento = subtotal * (parseFloat(cupon.valor) / 100);
        } else if (cupon.tipo === 'monto_fijo') {
            descuento = Math.min(parseFloat(cupon.valor), subtotal);
        } else if (cupon.tipo === 'envio_gratis') {
            envio_gratis = true;
            descuento = 0; // El envío gratis se maneja aparte
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

// Listar todos los cupones (admin)
app.get('/api/cupones', async (req, res) => {
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

// Crear nuevo cupón (admin)
app.post('/api/cupones', async (req, res) => {
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

// Incrementar uso de cupón
app.put('/api/cupones/:id/usar', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE public.cupones SET usos_actuales = usos_actuales + 1 WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cupón no encontrado' });
        }

        res.json({ success: true, cupon: result.rows[0] });

    } catch (error) {
        console.error('Error actualizando uso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Desactivar cupón (soft delete)
app.delete('/api/cupones/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE public.cupones SET activo = FALSE WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cupón no encontrado' });
        }

        res.json({ success: true, cupon: result.rows[0] });

    } catch (error) {
        console.error('Error desactivando cupón:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener un cupón específico por ID
app.get('/api/cupones/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM public.cupones WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cupón no encontrado' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error obteniendo cupón:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ==================== CONFIGURACIÓN GLOBAL ====================

// Obtener configuración global (ej: IVA)
app.get('/api/configuracion/:clave', async (req, res) => {
    const { clave } = req.params;

    try {
        const result = await pool.query(
            'SELECT valor FROM configuracion_global WHERE clave = $1',
            [clave]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        res.json({ clave, valor: result.rows[0].valor });

    } catch (error) {
        console.error('Error obteniendo configuración:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// Actualizar configuración (solo para admin)
app.put('/api/configuracion/:clave', async (req, res) => {
    const { clave } = req.params;
    const { valor, usuario_id } = req.body;

    // Verificar que el usuario sea admin (puedes ajustar según tu lógica)
    if (!usuario_id) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const result = await pool.query(
            `UPDATE configuracion_global 
             SET valor = $1, actualizado_por = $2, fecha_actualizacion = CURRENT_TIMESTAMP
             WHERE clave = $3
             RETURNING *`,
            [valor, usuario_id, clave]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }

        res.json({ message: 'Configuración actualizada', config: result.rows[0] });

    } catch (error) {
        console.error('Error actualizando configuración:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

// ================= LISTEN =================
app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en http://localhost:' + PORT);
    console.log('📡 API disponible en http://localhost:' + PORT + '/api');
});