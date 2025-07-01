// ===== CONFIGURACIÓN DEL BANCO =====
const configuracionBanco = {
  nombre: "Banco JS Seguro",
  codigo: "BJS-2024",
  comisionTransferencia: 0.5 // 0.5%
};

// ===== BASE DE DATOS =====
let baseDeDatos = {
  cuentas: [
    { id: "C1001", titular: "Ana López", saldo: 5000, pin: "1111" },
    { id: "C1002", titular: "Carlos Ruiz", saldo: 3000, pin: "2222" },
    { id: "C1003", titular: "Marta Díaz", saldo: 7000, pin: "3333" }
  ],
  movimientos: []
};

// ===== ESTADO GLOBAL =====
let sesionActiva = null;

// ===== UTILIDADES =====
function guardarDatos() {
  localStorage.setItem("banco_datos", JSON.stringify(baseDeDatos));
}

function cargarDatos() {
  const datos = localStorage.getItem("banco_datos");
  if (datos) {
    baseDeDatos = JSON.parse(datos);
  }
}

function imprimirEnConsola(mensaje) {
  const output = document.getElementById("output");
  output.innerHTML += `${mensaje}<br>`;
  output.scrollTop = output.scrollHeight;
}

// ===== INTERFAZ =====
function mostrarFormulario(nombre) {
  document.querySelectorAll("#seccionFormularios form").forEach(f => f.style.display = "none");
  document.getElementById(`form${capitalizar(nombre)}`).style.display = "block";
}

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function actualizarUI() {
  const seccionLogin = document.getElementById("seccionLogin");
  const seccionControles = document.getElementById("seccionControles");
  const mensajeBienvenida = document.getElementById("mensajeBienvenida");
  const infoCuenta = document.getElementById("infoCuenta");

  if (sesionActiva) {
    seccionLogin.style.display = "none";
    seccionControles.style.display = "block";
    mensajeBienvenida.textContent = `Bienvenido/a, ${sesionActiva.titular}`;
    infoCuenta.textContent = `Cuenta: ${sesionActiva.id}`;
  } else {
    seccionLogin.style.display = "block";
    seccionControles.style.display = "none";
    mensajeBienvenida.textContent = "Bienvenido al sistema bancario";
    infoCuenta.textContent = "";
  }
}

// ===== FUNCIONES DE OPERACIÓN =====
function consultarSaldo() {
  if (!verificarSesion()) return;
  imprimirEnConsola(`💰 Saldo actual: $${sesionActiva.saldo.toFixed(2)}`);
}

function cerrarSesion() {
  if (sesionActiva) {
    registrarMovimiento("Cierre de sesión", 0);
    imprimirEnConsola(`👋 Sesión cerrada. Hasta pronto, ${sesionActiva.titular}`);
    sesionActiva = null;
    actualizarUI();
    ocultarTodosLosFormularios(); 
  }
}

function registrarMovimiento(concepto, monto, cuentaEspecifica = null) {
  baseDeDatos.movimientos.push({
    fecha: new Date().toLocaleString(),
    cuenta: cuentaEspecifica || sesionActiva?.id || "Sistema",
    concepto,
    monto: parseFloat(monto.toFixed(2))
  });
  guardarDatos();
}

function verificarSesion() {
  if (!sesionActiva) {
    imprimirEnConsola("⚠️ Debe iniciar sesión primero.");
    return false;
  }
  return true;
}

// ===== EVENTOS =====
document.addEventListener("DOMContentLoaded", () => {
  cargarDatos();
  actualizarUI();

  // Login
  document.getElementById("formLogin").addEventListener("submit", e => {
    e.preventDefault();
    const id = document.getElementById("inputCuenta").value.trim();
    const pin = document.getElementById("inputPin").value.trim();

    const cuenta = baseDeDatos.cuentas.find(c => c.id === id && c.pin === pin);
    if (cuenta) {
      sesionActiva = cuenta;
      registrarMovimiento("Inicio de sesión", 0);
      imprimirEnConsola(`✅ Sesión iniciada como ${cuenta.titular}`);
      actualizarUI();
    } else {
      imprimirEnConsola("❌ Cuenta o PIN incorrectos");
    }
  });

  // Depósito
  document.getElementById("formDeposito").addEventListener("submit", e => {
    e.preventDefault();
    if (!verificarSesion()) return;

    const monto = parseFloat(document.getElementById("montoDeposito").value);
    if (isNaN(monto) || monto <= 0) {
      imprimirEnConsola("⚠️ Monto no válido");
      return;
    }

    sesionActiva.saldo += monto;
    registrarMovimiento("Depósito", monto);
    imprimirEnConsola(`✅ Depósito de $${monto.toFixed(2)} realizado`);
    document.getElementById("formDeposito").reset();
  });

  // Retiro
  document.getElementById("formRetiro").addEventListener("submit", e => {
    e.preventDefault();
    if (!verificarSesion()) return;

    const monto = parseFloat(document.getElementById("montoRetiro").value);
    if (isNaN(monto) || monto <= 0) {
      imprimirEnConsola("⚠️ Monto no válido");
      return;
    }

    if (monto > sesionActiva.saldo) {
      imprimirEnConsola("❌ Fondos insuficientes");
      return;
    }

    sesionActiva.saldo -= monto;
    registrarMovimiento("Retiro", -monto);
    imprimirEnConsola(`✅ Retiro de $${monto.toFixed(2)} realizado`);
    document.getElementById("formRetiro").reset();
  });

  // Transferencia
  document.getElementById("formTransferencia").addEventListener("submit", e => {
    e.preventDefault();
    if (!verificarSesion()) return;

    const destinoId = document.getElementById("cuentaDestino").value.trim();
    const monto = parseFloat(document.getElementById("montoTransferencia").value);
    const cuentaDestino = baseDeDatos.cuentas.find(c => c.id === destinoId);
    const comision = monto * (configuracionBanco.comisionTransferencia / 100);
    const total = monto + comision;

    if (!cuentaDestino) {
      imprimirEnConsola("❌ Cuenta destino no encontrada");
      return;
    }

    if (destinoId === sesionActiva.id) {
      imprimirEnConsola("⚠️ No puede transferirse a sí mismo");
      return;
    }

    if (isNaN(monto) || monto <= 0) {
      imprimirEnConsola("⚠️ Monto no válido");
      return;
    }

    if (total > sesionActiva.saldo) {
      imprimirEnConsola("❌ Saldo insuficiente para transferir con comisión");
      return;
    }

    sesionActiva.saldo -= total;
    cuentaDestino.saldo += monto;

    registrarMovimiento(`Transferencia a ${cuentaDestino.titular}`, -monto);
    registrarMovimiento("Comisión de transferencia", -comision);

    imprimirEnConsola(`✅ Transferencia a ${cuentaDestino.titular} por $${monto.toFixed(2)} (comisión $${comision.toFixed(2)})`);
    document.getElementById("formTransferencia").reset();
  });
});

function verMovimientos() {
  if (!verificarSesion()) return;
  const movimientos = baseDeDatos.movimientos.filter(m => m.cuenta === sesionActiva.id);

  if (movimientos.length === 0) {
    imprimirEnConsola("📂 No hay movimientos registrados.");
  } else {
    imprimirEnConsola("=== HISTORIAL DE MOVIMIENTOS ===");
    movimientos.forEach(m => {
      imprimirEnConsola(`[${m.fecha}] ${m.concepto}: ${m.monto >= 0 ? "+" : "-"}$${Math.abs(m.monto).toFixed(2)}`);
    });
  }
}

function ocultarTodosLosFormularios() {
  document.querySelectorAll("#seccionFormularios form").forEach(f => f.style.display = "none");
}
