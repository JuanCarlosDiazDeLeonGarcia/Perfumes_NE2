
let proveedorEditando = null;


function mostrarFormularioNuevo() {
    proveedorEditando = null;
    limpiarFormulario();
    document.getElementById("modalProveedor").classList.add("show");
}

function cerrarModal() {
    document.getElementById("modalProveedor").classList.remove("show");
}

// ============================
// CARGAR PROVEEDORES
// ============================

document.addEventListener("DOMContentLoaded", () => {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    if (!usuario) {
        window.location.href = "/views/adminlogin.html";
        return;
    }
    cargarProveedores();
});

function cargarProveedores() {
    fetch("http://localhost:3000/api/proveedores")
        .then(res => res.json())
        .then(data => {
            const tabla = document.getElementById("tablaProveedores");
            tabla.innerHTML = "";

            const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
            const rol = usuario ? usuario.rol : null;

            data.forEach(p => {
                tabla.innerHTML += `
                    <tr>
                        <td>${p.nombre}</td>
                        <td>${p.contacto}</td>
                        <td>${p.email}</td>
                        <td>${p.telefono}</td>
                        <td>${p.ciudad}</td>
                        <td>${p.pais}</td>
                        <td>
                            ${rol === "admin" ? `
                                <button onclick="editarProveedor(${p.id})">✏️</button>
                                <button onclick="eliminarProveedor(${p.id})">🗑</button>
                            ` : ""}
                        </td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error("Error al cargar proveedores:", err));
}

// ============================
// GUARDAR (CREAR O ACTUALIZAR)
// ============================

function guardarProveedor() {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    const rol = usuario ? usuario.rol : null;

    if (rol !== "admin") {
        alert("❌ Solo los administradores pueden modificar proveedores");
        return;
    }

    const proveedor = {
        nombre: document.getElementById("nombre").value.trim(),
        contacto: document.getElementById("contacto").value.trim(),
        email: document.getElementById("email").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        ciudad: document.getElementById("ciudad").value.trim(),
        pais: document.getElementById("pais").value.trim()
    };

    for (let key in proveedor) {
        if (!proveedor[key]) {
            alert(`❌ El campo "${key}" es obligatorio`);
            return;
        }
    }

    let metodo = "POST";
    let url = "http://localhost:3000/api/proveedores";

    if (proveedorEditando !== null) {
        metodo = "PUT";
        url = `http://localhost:3000/api/proveedores/${parseInt(proveedorEditando)}`;
    }

    console.log("📤 Enviando:", metodo, url, proveedor);

    fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedor)
    })
    .then(res => {
        console.log("📡 Status:", res.status);
        return res.json();
    })
    .then(data => {
        console.log("✅ Respuesta:", data);
        if (data.error) {
            alert("❌ Error: " + data.error);
            return;
        }
        alert(data.mensaje || "Operación exitosa ✅");
        proveedorEditando = null;
        cerrarModal();
        limpiarFormulario();
        cargarProveedores();
    })
    .catch(err => console.error("Error:", err));
}

// ============================
// EDITAR  
// ============================

function editarProveedor(id) {
    proveedorEditando = parseInt(id);
    console.log("✏️ Editando proveedor ID:", proveedorEditando, typeof proveedorEditando);

    fetch(`http://localhost:3000/api/proveedores/${proveedorEditando}`)
        .then(res => res.json())
        .then(proveedor => {
            if (!proveedor || proveedor.error) {
                alert("❌ No se encontró el proveedor");
                return;
            }

            document.getElementById("nombre").value = proveedor.nombre;
            document.getElementById("contacto").value = proveedor.contacto;
            document.getElementById("email").value = proveedor.email;
            document.getElementById("telefono").value = proveedor.telefono;
            document.getElementById("ciudad").value = proveedor.ciudad;
            document.getElementById("pais").value = proveedor.pais;

            document.getElementById("modalProveedor").classList.add("show");
        })
        .catch(err => {
            console.error("Error al cargar proveedor:", err);
            alert("❌ Error al cargar datos del proveedor");
        });
}

// ============================
// ELIMINAR
// ============================

function eliminarProveedor(id) {
    const usuario = JSON.parse(localStorage.getItem("usuarioActual"));
    const rol = usuario ? usuario.rol : null;

    if (rol !== "admin") {
        alert("❌ Solo los administradores pueden eliminar proveedores");
        return;
    }

    if (!confirm("⚠️ ¿Seguro que deseas eliminar este proveedor?")) return;

    fetch(`http://localhost:3000/api/proveedores/${id}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensaje || "Proveedor eliminado ✅");
        cargarProveedores();
    })
    .catch(err => console.error("Error al eliminar proveedor:", err));
}

// ============================
// LIMPIAR FORMULARIO
// ============================

function limpiarFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("contacto").value = "";
    document.getElementById("email").value = "";
    document.getElementById("telefono").value = "";
    document.getElementById("ciudad").value = "";
    document.getElementById("pais").value = "";
}