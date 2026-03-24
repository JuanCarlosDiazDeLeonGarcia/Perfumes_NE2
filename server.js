const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 3000;

// Middlewares must be registered before any routes that read req.body
app.use(cors());
app.use(express.json());


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'perfumes_ne2', //cambiar si el nombre de la BD es diferente
    password: '1234', //Cambiar por su contraseña segun su BD
    port: 5432,
});

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

// Ruta para obtener pedidos de un cliente
app.get('/api/pedidos-cliente/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT p.*, 
                    STRING_AGG(pr.nombre, ', ') as productos
             FROM pedidos p
             LEFT JOIN carrito dp ON p.id = dp.pedido_id
             LEFT JOIN productos pr ON dp.producto_id = pr.id
             WHERE p.cliente_id = $1
             GROUP BY p.id
             ORDER BY p.fecha_pedido DESC
             LIMIT 5`,
            [cliente_id]
        );

        res.json(result.rows);
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
                    STRING_AGG(pr.nombre, ', ') as productos,
                    SUM(dp.cantidad) as cantidad_total
             FROM pedidos p
             LEFT JOIN carrito dp ON p.id = dp.pedido_id
             LEFT JOIN productos pr ON dp.producto_id = pr.id
             WHERE p.cliente_id = $1
             GROUP BY p.id
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
        // Obtener información del pedido
        const pedidoResult = await pool.query(
            `SELECT * FROM pedidos WHERE id = $1`,
            [pedido_id]
        );

        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const pedido = pedidoResult.rows[0];

        // Obtener detalles del pedido
        const detallesResult = await pool.query(
            `SELECT dp.*, p.nombre as nombre_producto
             FROM carrito dp
             JOIN productos p ON dp.producto_id = p.id
             WHERE dp.pedido_id = $1`,
            [pedido_id]
        );

        // Agregar detalles al objeto pedido
        pedido.detalles = detallesResult.rows;

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

// Ruta para obtener pedidos con seguimiento
app.get('/api/seguimiento-pedidos/:cliente_id', async (req, res) => {
    const { cliente_id } = req.params;

    try {
        const result = await pool.query(
            `SELECT p.*, 
                    STRING_AGG(pr.nombre, ', ') as productos,
                    COUNT(dp.id) as cantidad_items
             FROM pedidos p
             LEFT JOIN carrito dp ON p.id = dp.pedido_id
             LEFT JOIN productos pr ON dp.producto_id = pr.id
             WHERE p.cliente_id = $1
             GROUP BY p.id
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

        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo seguimiento:', error);
        res.status(500).json({ message: 'Error obteniendo seguimiento de pedidos' });
    }
});

// Ruta para obtener detalle completo de seguimiento
app.get('/api/seguimiento-detalle/:pedido_id', async (req, res) => {
    const { pedido_id } = req.params;

    try {
        // Obtener información del pedido
        const pedidoResult = await pool.query(
            `SELECT * FROM pedidos WHERE id = $1`,
            [pedido_id]
        );

        if (pedidoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Pedido no encontrado' });
        }

        const pedido = pedidoResult.rows[0];

        // Obtener detalles del pedido
        const detallesResult = await pool.query(
            `SELECT dp.*, p.nombre, p.marca
             FROM carrito dp
             JOIN productos p ON dp.producto_id = p.id
             WHERE dp.pedido_id = $1`,
            [pedido_id]
        );

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
            // Si no existe la tabla, no hay problema
            pedido.historial = [];
        }

        // Agregar detalles al objeto pedido
        pedido.productos_detalle = detallesResult.rows;

        // Crear string de productos para mostrar
        if (detallesResult.rows.length > 0) {
            pedido.productos = detallesResult.rows.map(p => p.nombre).join(', ');
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

app.get('/api/metricas-productos', async (req, res) => {
    console.log('📊 Petición recibida en /api/metricas-productos');

    try {
        // 1. Productos más vendidos (por cantidad de pedidos)
        const masVendidos = await pool.query(`
            SELECT p.id, p.nombre, p.marca, p.stock, p.precio,
                   COUNT(pe.id) AS total_pedidos,
                   COALESCE(SUM(pe.cantidad), 0) AS total_unidades
            FROM productos p
            LEFT JOIN pedidos pe ON pe.producto_id = p.id
            GROUP BY p.id, p.nombre, p.marca, p.stock, p.precio
            ORDER BY total_pedidos DESC, total_unidades DESC
            LIMIT 10
        `);

        // 2. Productos con inventario crítico (stock <= stock_minimo)
        const inventarioCritico = await pool.query(`
            SELECT id, nombre, marca, stock, stock_minimo,
                   CASE WHEN stock = 0 THEN 'agotado'
                        WHEN stock <= stock_minimo THEN 'critico'
                   END AS estado_stock
            FROM productos
            WHERE stock <= stock_minimo AND activo = true
            ORDER BY stock ASC
        `);

        // 3. Conteo restock push vs pull
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
                p.total,
                p.estado,
                p.vendedor_id,
                p.producto_id,
                p.cantidad,
                c.nombre as cliente_nombre,
                c.id as cliente_id,
                c.correo as cliente_email,
                p.direccion_envio,
                pr.nombre as producto_nombre
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
            total: r.total,
            estado: r.estado,
            vendedor_id: r.vendedor_id,
            producto_id: r.producto_id,
            cantidad: r.cantidad,
            cliente_nombre: r.cliente_nombre,
            cliente_id: r.cliente_id,
            cliente_email: r.cliente_email,
            ubicacion_actual: r.direccion_envio || null,
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
    const { cliente_id, producto_id, cantidad = 1, metodo_pago, direccion_envio, notas, estado = 'pendiente' } = req.body;

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

        const numero_orden = 'P' + Date.now();

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

// Obtener seguimiento activo (pedidos no entregados)
app.get('/api/vendedor/:vendedorId/seguimiento-activo', async (req, res) => {
    const { vendedorId } = req.params;

    try {
        const query = `
            SELECT 
                s.id,
                s.pedido_id,
                s.estado_paquete,
                s.ubicacion_actual,
                s.fecha_estimada_entrega,
                s.fecha_actualizacion,
                p.numero_orden,
                p.total,
                p.fecha_pedido,
                c.nombre as cliente_nombre,
                c.id as cliente_id,
                -- Info básica del pedido
                'Pedido #' || p.numero_orden as productos
            FROM seguimiento_pedidos s
            JOIN pedidos p ON s.pedido_id = p.id
            JOIN clientes c ON p.cliente_id = c.id
            WHERE p.vendedor_id = $1
                AND s.estado_paquete NOT IN ('entregado', 'cancelado', 'devuelto')
            ORDER BY 
                CASE s.estado_paquete
                    WHEN 'en_reparto' THEN 1
                    WHEN 'en_transito' THEN 2
                    WHEN 'en_proceso' THEN 3
                    WHEN 'pendiente' THEN 4
                    ELSE 5
                END,
                s.fecha_estimada_entrega ASC
        `;

        const result = await pool.query(query, [vendedorId]);
        res.json(result.rows);

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

// Eliminar producto (solo si no tiene ventas asociadas)
app.delete('/api/productos/:productoId', async (req, res) => {
    const { productoId } = req.params;

    try {
        // Verificar si el producto tiene ventas
        const ventasCheck = await pool.query(
            'SELECT id FROM carrito WHERE producto_id = $1 LIMIT 1',
            [productoId]
        );

        if (ventasCheck.rows.length > 0) {
            return res.status(400).json({
                error: 'No se puede eliminar el producto porque tiene ventas asociadas. Desactívelo en su lugar.'
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
    const { items } = req.body; // [{ producto_id, cantidad }]

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Se requiere un arreglo de items' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const resultados = [];
        const alertasPush = [];

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

            resultados.push({ id: prodId, nombre: producto.nombre, stock_anterior: producto.stock, stock_nuevo: stockNuevo });

            // Si es push y llegó al stock mínimo → auto-restock hasta el mínimo y alerta
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

                // Actualizar el resultado para que refleje el stock final correcto
                const idx = resultados.findIndex(r => r.id === prodId);
                if (idx >= 0) resultados[idx].stock_nuevo = stockFinal;

                alertasPush.push({ ...producto, stock_nuevo: stockFinal, stock_antes_restock: stockNuevo, stock_anterior: producto.stock, auto_restock: autoRestock });
            }
        }

        await client.query('COMMIT');

        // Enviar WhatsApp para productos push que alcanzaron stock mínimo
        for (const prod of alertasPush) {
            const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
            const mensaje =
`⚠️ *RESTOCK AUTOMÁTICO - Perfumes NE2*

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
                console.log(`⚠️ Alerta push enviada: ${prod.nombre} stock: ${prod.stock_nuevo}/${prod.stock_minimo || 10}`);
            } catch (waErr) {
                prod.whatsapp_enviado = false;
                prod.whatsapp_error = waErr.message;
                console.error(`❌ Error WhatsApp push para ${prod.nombre}:`, waErr.message);
            }
        }

        res.json({
            success: true,
            resultados,
            alertas_push: alertasPush.map(p => ({
                nombre: p.nombre, stock_antes_restock: p.stock_antes_restock,
                stock_nuevo: p.stock_nuevo, auto_restock: p.auto_restock,
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


/////   SEPARACION DEL LISTEN Y RUTAS           /////////

app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en http://localhost:' + PORT);
    console.log('📡 API disponible en http://localhost:' + PORT + '/api');
    console.log('');
});

const proveedoresRoutes = require('./proveedores');
proveedoresRoutes(app, pool);
