const API_URL = 'http://localhost:3000/api';

let captchaTextoActual = '';

function generarCaptchaTexto(longitud = 5) {
    // Evitar caracteres ambiguos: 0 O o 1 I l
    const caracteres = '23456789abcdefghjkmnpqrstuvwxyz';
    let resultado = '';
    for (let i = 0; i < longitud; i++) {
        resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado;
}

function dibujarCaptchaEnCanvas(texto) {
    const canvas = document.getElementById('captchaCanvas');
    if (!canvas || !canvas.getContext) {
        return;
    }

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Fondo
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Ruido (puntos)
    for (let i = 0; i < 120; i++) {
        ctx.fillStyle = `rgba(${Math.floor(Math.random() * 120)}, ${Math.floor(Math.random() * 120)}, ${Math.floor(Math.random() * 120)}, 0.35)`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.8, 0, Math.PI * 2);
        ctx.fill();
    }

    // Líneas
    for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)}, ${Math.floor(Math.random() * 80)}, 0.35)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, Math.random() * h);
        ctx.bezierCurveTo(w * 0.25, Math.random() * h, w * 0.75, Math.random() * h, w, Math.random() * h);
        ctx.stroke();
    }

    // Texto con ligera rotación por caracter
    const fontSize = 44;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = `bold ${fontSize}px Arial`;

    const paddingX = 18;
    const step = (w - paddingX * 2) / texto.length;
    for (let i = 0; i < texto.length; i++) {
        const ch = texto[i];
        const x = paddingX + step * (i + 0.5);
        const y = h / 2 + (Math.random() * 10 - 5);
        const angle = (Math.random() * 0.45 - 0.225);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = `rgb(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)})`;
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 2;
        ctx.fillText(ch, 0, 0);
        ctx.restore();
    }
}

function generarCaptcha() {
    captchaTextoActual = generarCaptchaTexto(5);
    dibujarCaptchaEnCanvas(captchaTextoActual);

    const captchaInput = document.getElementById('captchaInput');
    if (captchaInput) {
        captchaInput.value = '';
    }
}

function validarCaptcha() {
    const captchaInput = document.getElementById('captchaInput');
    if (!captchaInput) {
        return true; // Si falta el input, no bloquear el login
    }

    const valor = (captchaInput.value || '').trim().toLowerCase();
    const esperado = (captchaTextoActual || '').trim().toLowerCase();

    if (!valor) {
        mostrarError('Por favor confirma el captcha.');
        return false;
    }

    if (!esperado || valor !== esperado) {
        mostrarError('Captcha incorrecto. Inténtalo de nuevo.');
        generarCaptcha();
        captchaInput.focus();
        return false;
    }

    return true;
}

// Verificar sesión al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));

    if (usuario) {
        const rolLower = (usuario.rol || '').toLowerCase();
        if (rolLower) {
            // Reparar userType si quedó como "cliente" u otro valor
            localStorage.setItem('userType', rolLower);
        }
        // Normalizar rol guardado para que otros scripts comparen bien
        if (usuario.rol && usuario.rol !== rolLower) {
            usuario.rol = rolLower;
            localStorage.setItem('usuarioActual', JSON.stringify(usuario));
        }
        // Si ya hay sesión activa, redirigir según el rol
        redirigirSegunRol(usuario.rol);
    }

    // Cargar email recordado si existe
    const emailRecordado = localStorage.getItem('emailRecordado');
    if (emailRecordado) {
        document.getElementById('email').value = emailRecordado;
        document.getElementById('recordar').checked = true;
    }

    // Inicializar captcha
    generarCaptcha();
    const btnRefresh = document.getElementById('captchaRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', generarCaptcha);
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

    // Validar captcha antes de continuar
    if (!validarCaptcha()) {
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
        localStorage.setItem('userType', (usuario.rol || '').toLowerCase()); // Guardar el rol normalizado

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