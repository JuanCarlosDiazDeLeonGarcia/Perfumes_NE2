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
    database: 'perfumes', //cambiar si el nombre de la BD es diferente
    password: '2244', //Cambiar por su contraseña segun su BD
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
             LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
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
             LEFT JOIN detalle_pedidos dp ON p.id = dp.pedido_id
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
             FROM detalle_pedidos dp
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

/////   SEPARACION DEL LISTEN Y RUTAS           /////////

app.listen(PORT, () => {
    console.log('🚀 Servidor corriendo en http://localhost:' + PORT);
    console.log('📡 API disponible en http://localhost:' + PORT + '/api');
    console.log('');
});