const API_URL = 'http://localhost:3000/api';

let usuarioIdEliminar = null;
let modoEdicion = false;
let usuarios = [];

document.addEventListener('DOMContentLoaded', function() {
    verificarSesion();
    cargarUsuarios();
    
    const inputTelefono = document.getElementById('telefono');
    if (inputTelefono) {
        inputTelefono.addEventListener('input', formatearTelefono);
    }
});

function verificarSesion() {
    const usuario = JSON.parse(localStorage.getItem('usuarioActual'));
    
    if (!usuario) {
        window.location.href = 'clientelogin.html';
        return;
    }
    
    if (usuario.rol !== 'admin') {
        alert('Acceso denegado. Solo administradores pueden gestionar usuarios.');
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('usuarioActual').textContent = usuario.nombre;
}

function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('usuarioActual');
        window.location.href = '../catalog.html';
    }
}

async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        
        if (!response.ok) {
            throw new Error('Error al cargar usuarios');
        }
        
        usuarios = await response.json();
        
        // Mostrar todos los usuarios obtenidos de la API
        mostrarUsuarios(usuarios);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar los usuarios. Verifica la conexión con el servidor.', 'error');
    }
}

function mostrarUsuarios(listaUsuarios) {
    const tbody = document.getElementById('cuerpoTabla');
    tbody.innerHTML = '';
    
    if (listaUsuarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    No se encontraron usuarios
                </td>
            </tr>
        `;
        return;
    }
    
    listaUsuarios.forEach(usuario => {
        const tr = document.createElement('tr');
        
        let badgeRol = '';
        switch(usuario.rol) {
            case 'admin':
                badgeRol = '<span class="badge-rol badge-admin">ADMIN</span>';
                break;
            case 'vendedor':
                badgeRol = '<span class="badge-rol badge-vendedor">VENDEDOR</span>';
                break;
            case 'logistica':
                badgeRol = '<span class="badge-rol badge-usuario">LOGISTICA</span>';
                break;
        }
        
        const estadoClass = usuario.activo ? 'activo' : 'inactivo';
        const estadoTexto = usuario.activo ? 'Activo' : 'Inactivo';
        
        let ultimoLogin = 'Nunca';
        if (usuario.ultimo_login) {
            const fecha = new Date(usuario.ultimo_login);
            ultimoLogin = fecha.toLocaleDateString('es-MX') + ' ' + fecha.toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'});
        }
        
        tr.innerHTML = `
            <td style="font-weight: bold; color: purple;">${usuario.id}</td>
            <td>${usuario.nombre}</td>
            <td style="font-family: 'Courier New', monospace; color: #666;">${usuario.email}</td>
            <td style="font-family: 'Courier New', monospace;">+52 ${usuario.telefono || 'N/A'}</td>
            <td>${badgeRol}</td>
            <td><span class="estado ${estadoClass}">${estadoTexto}</span></td>
            <td style="font-size: 0.9rem;">${ultimoLogin}</td>
            <td>
                <div class="acciones">
                    <button class="btn-accion btn-editar" onclick="editarUsuario(${usuario.id})" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-accion btn-eliminar" onclick="abrirModalEliminar(${usuario.id}, '${usuario.nombre}')" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function buscarUsuarios() {
    const termino = document.getElementById('buscarUsuario').value.toLowerCase().trim();
    
    if (termino === '') {
        // Mostrar todos si no hay término de búsqueda
        mostrarUsuarios(usuarios);
        return;
    }
    
    const usuariosFiltrados = usuarios.filter(usuario => {
        return (
            usuario.nombre.toLowerCase().includes(termino) ||
            usuario.email.toLowerCase().includes(termino) ||
            (usuario.telefono && usuario.telefono.includes(termino))
        );
    });
    
    mostrarUsuarios(usuariosFiltrados);
}

function abrirModalNuevo() {
    modoEdicion = false;
    document.getElementById('tituloModal').textContent = 'Nuevo Usuario';
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('password').required = true;
    document.getElementById('passwordHelp').style.display = 'none';
    document.getElementById('activo').checked = true;
    
    document.getElementById('modalUsuario').classList.add('show');
}

async function editarUsuario(id) {
    modoEdicion = true;
    document.getElementById('tituloModal').textContent = 'Editar Usuario';
    document.getElementById('password').required = false;
    document.getElementById('passwordHelp').style.display = 'block';
    
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar el usuario');
        }
        
        const usuario = await response.json();
        
        document.getElementById('usuarioId').value = usuario.id;
        document.getElementById('nombre').value = usuario.nombre;
        document.getElementById('email').value = usuario.email;
        document.getElementById('telefono').value = usuario.telefono || '';
        document.getElementById('rol').value = usuario.rol;
        document.getElementById('activo').checked = usuario.activo;
        document.getElementById('password').value = '';
        
        document.getElementById('modalUsuario').classList.add('show');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al cargar los datos del usuario', 'error');
    }
}

async function guardarUsuario(event) {
    event.preventDefault();
    
    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const telefono = document.getElementById('telefono').value.trim();
    const rol = document.getElementById('rol').value;
    const activo = document.getElementById('activo').checked;
    
    if (!nombre || !email || !rol) {
        mostrarMensaje('Por favor completa todos los campos obligatorios', 'error');
        return;
    }
    
    if (!modoEdicion && !password) {
        mostrarMensaje('La contraseña es obligatoria para nuevos usuarios', 'error');
        return;
    }
    
    if (password && password.length < 6) {
        mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    const regexTelefono = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
    if (telefono && !regexTelefono.test(telefono)) {
        mostrarMensaje('El teléfono debe tener el formato: 449-123-4567', 'error');
        return;
    }
    
    const usuario = {
        nombre,
        email,
        telefono,
        rol,
        activo
    };
    
    if (password) {
        usuario.password = password;
    }
    
    try {
        let response;
        
        if (modoEdicion) {
            response = await fetch(`${API_URL}/usuarios/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(usuario)
            });
        } else {
            response = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(usuario)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al guardar usuario');
        }
        
        const mensaje = modoEdicion ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente';
        mostrarMensaje(mensaje, 'exito');
        
        cerrarModal();
        cargarUsuarios();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje(error.message, 'error');
    }
}

function abrirModalEliminar(id, nombre) {
    usuarioIdEliminar = id;
    document.getElementById('nombreEliminar').textContent = nombre;
    document.getElementById('modalEliminar').classList.add('show');
}

async function confirmarEliminar() {
    if (!usuarioIdEliminar) return;
    
    try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioIdEliminar}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el usuario');
        }
        
        mostrarMensaje('Usuario eliminado exitosamente', 'exito');
        cerrarModalEliminar();
        cargarUsuarios();
        
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error al eliminar el usuario', 'error');
    }
}

function cerrarModal() {
    document.getElementById('modalUsuario').classList.remove('show');
    document.getElementById('formUsuario').reset();
}

function cerrarModalEliminar() {
    document.getElementById('modalEliminar').classList.remove('show');
    usuarioIdEliminar = null;
}

window.onclick = function(event) {
    const modalUsuario = document.getElementById('modalUsuario');
    const modalEliminar = document.getElementById('modalEliminar');
    
    if (event.target === modalUsuario) {
        cerrarModal();
    }
    if (event.target === modalEliminar) {
        cerrarModalEliminar();
    }
}

function formatearTelefono(e) {
    let valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length <= 3) {
        e.target.value = valor;
    } else if (valor.length <= 6) {
        e.target.value = valor.slice(0, 3) + '-' + valor.slice(3);
    } else {
        e.target.value = valor.slice(0, 3) + '-' + valor.slice(3, 6) + '-' + valor.slice(6, 10);
    }
}

function mostrarMensaje(texto, tipo) {
    const container = document.getElementById('mensajeContainer');
    const clase = tipo === 'exito' ? 'mensaje-exito' : 'mensaje-error';
    
    container.innerHTML = `<div class="mensaje ${clase}">${texto}</div>`;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}