

const API_URL = 'http://localhost:3000/api';


document.addEventListener('DOMContentLoaded', function() {
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));
    
    if (usuario) {
       
        redirigirSegunRol(usuario.rol);
    }
    
   
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
 

    if (!email || !password) {
        mostrarError('Por favor completa todos los campos');
        return;
    }
    
   
    const btnLogin = document.getElementById('btnLogin');
    const loader = document.getElementById('loader');
    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando...';
    loader.classList.add('show');
    ocultarMensajes();
    
    try {
        const response = await fetch(`${API_URL}/login`, {
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
        
       
        const usuario = data.usuario;
        
     
        if (!usuario.activo) {
            throw new Error('Tu cuenta está inactiva. Contacta al administrador.');
        }
        
   
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
       
        if (recordar) {
            localStorage.setItem('emailRecordado', email);
        } else {
            localStorage.removeItem('emailRecordado');
        }
        
      
        mostrarExito('¡Bienvenido! Redirigiendo...');
        
      
        await actualizarUltimoLogin(usuario.id);
        
       
        setTimeout(() => {
            redirigirSegunRol(usuario.rol);
        }, 1000);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
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
    switch(rol) {
        case 'admin':
            window.location.href = 'admins/paneladmin.html';
            break;
        case 'vendedor':
            window.location.href = 'admins/paneladmin.html'; 
            break;
        case 'usuario':
            window.location.href = 'index.html';
            break;
        default:
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

document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const form = document.getElementById('formLogin');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
});