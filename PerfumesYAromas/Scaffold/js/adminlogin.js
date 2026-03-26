const API_URL = 'http://localhost:3000/api';

// Verificar sesión al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));

    if (usuario) {
        // Si ya hay sesión activa, redirigir según el rol
        redirigirSegunRol(usuario.rol);
    }

    // Cargar email recordado si existe
    const emailRecordado = localStorage.getItem('emailRecordado');
    if (emailRecordado) {
        document.getElementById('email').value = emailRecordado;
        document.getElementById('recordar').checked = true;
    }
});

async function iniciarSesion(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const recordar = document.getElementById('recordar').checked;

    // Validar campos vacíos
    if (!email || !password) {
        mostrarError('Por favor completa todos los campos');
        return;
    }

    // Mostrar loader
    const btnLogin = document.getElementById('btnLogin');
    const loader = document.getElementById('loader');
    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';
    loader.classList.add('show');
    ocultarMensajes();

    try {
        // Intentar login con el endpoint de usuarios
        const response = await fetch(`${API_URL}/login-usuario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Credenciales incorrectas');
        }

        // Obtener usuario de la respuesta
        const usuario = data.usuario;

        // Verificar si la cuenta está activa
        if (!usuario.activo) {
            throw new Error('Tu cuenta está inactiva. Contacta al administrador.');
        }

        // Guardar datos de sesión
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        localStorage.setItem('token', data.token || '');
        localStorage.setItem('userType', usuario.rol); // Guardar el rol como tipo de usuario

        // Guardar email si se seleccionó "recordar"
        if (recordar) {
            localStorage.setItem('emailRecordado', email);
        } else {
            localStorage.removeItem('emailRecordado');
        }

        // Mostrar mensaje de éxito
        mostrarExito(`¡Bienvenido, ${usuario.nombre || 'Usuario'}! Redirigiendo...`);

        // Actualizar último login (opcional)
        await actualizarUltimoLogin(usuario.id);

        // Redirigir según el rol
        setTimeout(() => {
            redirigirSegunRol(usuario.rol);
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);

        // Restaurar botón
        btnLogin.disabled = false;
        btnLogin.textContent = '🔐 Iniciar Sesión';
        loader.classList.remove('show');
    }
}

async function actualizarUltimoLogin(usuarioId) {
    try {
        await fetch(`${API_URL}/usuarios/${usuarioId}/ultimo-login`, {
            method: 'PUT'
        });
    } catch (error) {
        console.error('Error al actualizar último login:', error);
    }
}

function redirigirSegunRol(rol) {
    console.log('Redirigiendo según rol:', rol); // Para depuración

    // Normalizar el rol a minúsculas para comparación
    const rolLower = (rol || '').toLowerCase();

    switch (rolLower) {
        case 'admin':
            window.location.href = 'admins/paneladmin.html';
            break;
        case 'vendedor':
            window.location.href = 'vendedores/vendedormenu.html';
            break;
        case 'logistica':
            window.location.href = 'logistica/statspanel.html'; // Ruta actualizada
            break;
        case 'usuario':
            window.location.href = 'index.html';
            break;
        default:
            console.warn('Rol no reconocido:', rol);
            window.location.href = 'index.html';
    }
}

function mostrarError(mensaje) {
    const div = document.getElementById('mensajeError');
    div.textContent = '❌ ' + mensaje;
    div.classList.add('show');

    setTimeout(() => {
        div.classList.remove('show');
    }, 5000);
}

function mostrarExito(mensaje) {
    const div = document.getElementById('mensajeExito');
    div.textContent = '✅ ' + mensaje;
    div.classList.add('show');
}

function ocultarMensajes() {
    document.getElementById('mensajeError').classList.remove('show');
    document.getElementById('mensajeExito').classList.remove('show');
}

// Permitir envío con tecla Enter
document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const form = document.getElementById('formLogin');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
});