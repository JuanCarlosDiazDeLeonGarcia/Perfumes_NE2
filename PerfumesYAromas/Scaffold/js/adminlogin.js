const API_URL = 'http://localhost:3000/api';

async function iniciarSesionAdmin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const recordar = document.getElementById('recordar').checked;

    if (!email || !password) {
        mostrarError('Por favor completa todos los campos');
        return;
    }

    const btnLogin = document.getElementById('btnLogin');
    const loader = document.getElementById('loader');
    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';
    if (loader) loader.classList.add('show');
    ocultarMensajes();

    try {
        const response = await fetch(`${API_URL}/login-usuario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Credenciales incorrectas');
        }

        const usuario = data.usuario;
        if (!usuario) throw new Error('Usuario inválido');

        if (!usuario.activo) throw new Error('Cuenta inactiva');

        // Guardar sesión y redirigir según rol en la tabla usuarios
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        if (usuario.rol === 'admin') {
            localStorage.setItem('userType', 'admin');
        } else if (usuario.rol === 'vendedor') {
            localStorage.setItem('userType', 'vendedor');
        } else {
            throw new Error('Acceso restringido: rol no permitido');
        }

        if (recordar) localStorage.setItem('emailRecordado', email);
        else localStorage.removeItem('emailRecordado');

        mostrarExito('Acceso concedido. Redirigiendo...');

        // actualizar ultimo login
        try { await fetch(`${API_URL}/usuarios/${usuario.id}/ultimo-login`, { method: 'PUT' }); } catch (e) {}

        // Redirigir según rol
        setTimeout(() => {
            if (usuario.rol === 'admin') window.location.href = 'admins/paneladmin.html';
            else if (usuario.rol === 'vendedor') window.location.href = 'vendedores/vendedormenu.html';
        }, 800);

    } catch (error) {
        console.error('Error login admin:', error);
        mostrarError(error.message || 'Error en el servidor');
        btnLogin.disabled = false;
        btnLogin.textContent = '🔐 Iniciar Sesión';
        if (loader) loader.classList.remove('show');
    }
}

function mostrarError(mensaje) {
    const div = document.getElementById('mensajeError');
    if (!div) return;
    div.textContent = '❌ ' + mensaje;
    div.classList.add('show');
    setTimeout(() => div.classList.remove('show'), 5000);
}

function mostrarExito(mensaje) {
    const div = document.getElementById('mensajeExito');
    if (!div) return;
    div.textContent = '✅ ' + mensaje;
    div.classList.add('show');
}

function ocultarMensajes() {
    const e = document.getElementById('mensajeError');
    const s = document.getElementById('mensajeExito');
    if (e) e.classList.remove('show');
    if (s) s.classList.remove('show');
}
