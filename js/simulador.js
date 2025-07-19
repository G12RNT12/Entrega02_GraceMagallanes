// ===== CONFIGURACIÓN DEL BANCO =====
const configuracionBanco = {
  nombre: "Banco JS Seguro",
  codigo: "BJS-2024",
  comisionTransferencia: 0.5, // 0.5%
  limiteDeposito: 10000,
  limiteRetiro: 5000,
  limiteTransferencia: 8000,
  saldoMinimo: 0
};

// ===== BASE DE DATOS =====
let baseDeDatos = {
  cuentas: [
    { id: "C1001", titular: "Ana López", saldo: 7500, pin: "1111" },
    { id: "C1002", titular: "Carlos Ruiz", saldo: 3500, pin: "2222" },
    { id: "C1003", titular: "Marta Díaz", saldo: 12000, pin: "3333" },
    { id: "C1004", titular: "Pedro Gómez", saldo: 5000, pin: "4444" }
  ],
  movimientos: []
};

// ===== ESTADO GLOBAL =====
let sesionActiva = null;

// ===== UTILIDADES =====
function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function guardarDatos() {
  try {
    localStorage.setItem("banco_datos", JSON.stringify(baseDeDatos));
    return true;
  } catch (e) {
    console.error("Error al guardar datos:", e);
    imprimirEnConsola("❌ Error al guardar datos", "error");
    return false;
  }
}

function cargarDatos() {
  try {
    const datos = localStorage.getItem("banco_datos");
    if (datos) {
      baseDeDatos = JSON.parse(datos);
      actualizarTablaCuentas();
    }
    return true;
  } catch (e) {
    console.error("Error al cargar datos:", e);
    return false;
  }
}

function imprimirEnConsola(mensaje, tipo = "normal") {
  const output = document.getElementById("output");
  const mensajeDiv = document.createElement("div");
  
  mensajeDiv.classList.add("mensaje-nuevo");
  if (tipo !== "normal") {
    mensajeDiv.classList.add(`mensaje-${tipo}`);
  }
  
  const fecha = new Date().toLocaleTimeString();
  mensajeDiv.innerHTML = `<span class="hora">[${fecha}]</span> ${mensaje}`;
  
  output.appendChild(mensajeDiv);
  output.scrollTop = output.scrollHeight;
}

function formatearMoneda(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(monto);
}

function generarNumeroCuenta() {
  const ultimaCuenta = baseDeDatos.cuentas.reduce((max, cuenta) => {
    const num = parseInt(cuenta.id.substring(1));
    return num > max ? num : max;
  }, 1000);
  
  return `C${ultimaCuenta + 1}`;
}

// ===== INTERFAZ =====
function mostrarFormulario(nombre) {
  document.querySelectorAll("#seccionFormularios form, #seccionLogin form").forEach(f => {
    f.style.display = "none";
  });
  
  const formulario = document.getElementById(`form${capitalizar(nombre)}`);
  if (formulario) {
    formulario.style.display = "flex";
    formulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function ocultarFormularios() {
  document.querySelectorAll("#seccionFormularios form, #seccionLogin form").forEach(f => {
    f.style.display = "none";
    f.reset();
  });
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
    ocultarFormularios();
  } else {
    seccionLogin.style.display = "block";
    seccionControles.style.display = "none";
    mensajeBienvenida.textContent = "Bienvenido al sistema bancario";
    infoCuenta.textContent = "";
  }
}

function actualizarTablaCuentas() {
  const tbody = document.getElementById("tablaCuentas");
  tbody.innerHTML = baseDeDatos.cuentas.map(cuenta => `
    <tr>
      <td>${cuenta.id}</td>
      <td>${cuenta.titular}</td>
      <td>${cuenta.pin}</td>
      <td>${formatearMoneda(cuenta.saldo)}</td>
    </tr>
  `).join('');
}

// ===== FUNCIONES DE OPERACIÓN =====
function verificarSesion() {
  if (!sesionActiva) {
    imprimirEnConsola("⚠️ Debe iniciar sesión primero", "advertencia");
    return false;
  }
  return true;
}

function registrarMovimiento(concepto, monto, cuentaEspecifica = null) {
  const movimiento = {
    id: "M" + Date.now(),
    fecha: new Date().toISOString(),
    cuenta: cuentaEspecifica || sesionActiva?.id || "Sistema",
    concepto,
    monto: parseFloat(monto.toFixed(2)),
    saldoResultante: cuentaEspecifica ? null : (sesionActiva?.saldo || 0)
  };

  baseDeDatos.movimientos.unshift(movimiento);
  return guardarDatos();
}

function consultarSaldo() {
  if (!verificarSesion()) return;
  
  const saldoFormateado = formatearMoneda(sesionActiva.saldo);
  imprimirEnConsola(`💰 Saldo actual: ${saldoFormateado}`, "exito");
}

function cerrarSesion() {
  if (sesionActiva) {
    registrarMovimiento("Cierre de sesión", 0);
    imprimirEnConsola(`👋 Sesión cerrada. Hasta pronto, ${sesionActiva.titular}`, "exito");
    sesionActiva = null;
    
    // Mostrar explícitamente el formulario de login
    document.getElementById("seccionLogin").style.display = "block";
    document.getElementById("formLogin").style.display = "flex";
    document.getElementById("formNuevaCuenta").style.display = "none";
    
    // Ocultar controles bancarios
    document.getElementById("seccionControles").style.display = "none";
    
    // Limpiar campos del login
    document.getElementById("formLogin").reset();
    
    // Actualizar mensajes de UI
    document.getElementById("mensajeBienvenida").textContent = "Bienvenido al sistema bancario";
    document.getElementById("infoCuenta").textContent = "";
    
    // Hacer scroll al formulario de login
    document.getElementById("formLogin").scrollIntoView({ behavior: 'smooth' });
  }
}

function verMovimientos() {
  if (!verificarSesion()) return;
  
  const movimientos = baseDeDatos.movimientos
    .filter(m => m.cuenta === sesionActiva.id)
    .slice(0, 20);

  if (movimientos.length === 0) {
    imprimirEnConsola("📂 No hay movimientos registrados.", "advertencia");
  } else {
    imprimirEnConsola("=== HISTORIAL DE MOVIMIENTOS ===");
    movimientos.forEach(m => {
      const fecha = new Date(m.fecha).toLocaleString();
      const tipo = m.monto >= 0 ? "↗ Ingreso" : "↘ Egreso";
      const montoFormateado = formatearMoneda(Math.abs(m.monto));
      imprimirEnConsola(`[${fecha}] ${tipo}: ${m.concepto} - ${montoFormateado}`);
    });
  }
}

function generarResumen() {
  if (!verificarSesion()) return;
  
  const hoy = new Date().toISOString().split('T')[0];
  const movimientosHoy = baseDeDatos.movimientos.filter(m => 
    m.cuenta === sesionActiva.id && 
    m.fecha.startsWith(hoy)
  );
  
  const ingresos = movimientosHoy
    .filter(m => m.monto > 0)
    .reduce((sum, m) => sum + m.monto, 0);
  
  const egresos = movimientosHoy
    .filter(m => m.monto < 0)
    .reduce((sum, m) => sum + Math.abs(m.monto), 0);
  
  imprimirEnConsola("📊 RESUMEN DIARIO", "exito");
  imprimirEnConsola(`📅 Fecha: ${new Date().toLocaleDateString()}`);
  imprimirEnConsola(`➡ Ingresos: ${formatearMoneda(ingresos)}`);
  imprimirEnConsola(`⬅ Egresos: ${formatearMoneda(egresos)}`);
  imprimirEnConsola(`💰 Saldo actual: ${formatearMoneda(sesionActiva.saldo)}`);
}

// ===== CREACIÓN DE CUENTAS =====
function procesarNuevaCuenta() {
  const titular = document.getElementById("nuevoTitular").value.trim();
  const pin = document.getElementById("nuevoPin").value;
  const confirmarPin = document.getElementById("confirmarPin").value;
  const depositoInicial = parseFloat(document.getElementById("depositoInicial").value) || 0;

  // Validaciones
  if (!titular || titular.length < 3) {
    imprimirEnConsola("⚠️ Ingrese un nombre válido (mínimo 3 caracteres)", "advertencia");
    return;
  }

  if (pin.length !== 4 || !/^\d+$/.test(pin)) {
    imprimirEnConsola("⚠️ El PIN debe tener exactamente 4 dígitos", "advertencia");
    return;
  }

  if (pin !== confirmarPin) {
    imprimirEnConsola("⚠️ Los PINs no coinciden", "advertencia");
    return;
  }

  if (depositoInicial < 0) {
    imprimirEnConsola("⚠️ El depósito no puede ser negativo", "advertencia");
    return;
  }

  if (depositoInicial > 10000) {
    imprimirEnConsola("⚠️ El depósito inicial no puede exceder $10,000", "advertencia");
    return;
  }

  // Crear nueva cuenta
  const nuevaCuenta = {
    id: generarNumeroCuenta(),
    titular: titular,
    pin: pin,
    saldo: depositoInicial
  };

  baseDeDatos.cuentas.push(nuevaCuenta);
  
  if (depositoInicial > 0) {
    registrarMovimiento("Depósito inicial", depositoInicial, nuevaCuenta.id);
  }

  guardarDatos();
  cargarDatos();

  // Mostrar mensaje de éxito
  const mensaje = `✅ Cuenta creada exitosamente!<br>
                 <strong>Número de cuenta:</strong> ${nuevaCuenta.id}<br>
                 <strong>Titular:</strong> ${nuevaCuenta.titular}<br>
                 <strong>Saldo inicial:</strong> ${formatearMoneda(nuevaCuenta.saldo)}`;
  
  const output = document.getElementById("output");
  const mensajeDiv = document.createElement("div");
  mensajeDiv.classList.add("mensaje-cuenta-creada");
  mensajeDiv.innerHTML = mensaje;
  output.appendChild(mensajeDiv);
  
  // Crear botón de inicio de sesión
  const btnLogin = document.createElement("button");
  btnLogin.className = "btn-login-automatico";
  btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar sesión ahora';
  
  btnLogin.addEventListener("click", () => {
    // Autocompletar campos
    document.getElementById("inputCuenta").value = nuevaCuenta.id;
    document.getElementById("inputPin").value = nuevaCuenta.pin;
    
    // Mostrar y posicionar el formulario de login
    document.getElementById("seccionLogin").style.display = "block";
    document.getElementById("formLogin").style.display = "flex";
    document.getElementById("formLogin").scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
    
    // Resaltar botón Entrar
    const btnEntrar = document.getElementById("btnEntrar");
    btnEntrar.classList.add("btn-destacado");
    
    // Enfocar el campo PIN
    document.getElementById("inputPin").focus();
    
    // Mensaje en consola
    imprimirEnConsola(`Credenciales de ${nuevaCuenta.titular} cargadas. Presione el botón "Entrar" verde`, "exito");
  });
  
  mensajeDiv.appendChild(document.createElement("br"));
  mensajeDiv.appendChild(document.createElement("br"));
  mensajeDiv.appendChild(btnLogin);
  
  output.scrollTop = output.scrollHeight;
  document.getElementById("formNuevaCuenta").reset();
  ocultarFormularios();
}

// ===== OPERACIONES BANCARIAS =====
function procesarLogin() {
  const id = document.getElementById("inputCuenta").value.trim();
  const pin = document.getElementById("inputPin").value.trim();

  if (!id || !pin) {
    imprimirEnConsola("⚠️ Complete todos los campos", "advertencia");
    return;
  }

  const cuenta = baseDeDatos.cuentas.find(c => c.id === id && c.pin === pin);
  if (cuenta) {
    sesionActiva = cuenta;
    registrarMovimiento("Inicio de sesión", 0);
    imprimirEnConsola(`🔑 Sesión iniciada como ${cuenta.titular}`, "exito");
    
    // Quitar el resaltado del botón Entrar
    document.getElementById("btnEntrar").classList.remove("btn-destacado");
    
    actualizarUI();
  } else {
    imprimirEnConsola("❌ Cuenta o PIN incorrectos", "error");
  }
}

function procesarDeposito() {
  if (!verificarSesion()) return;

  const monto = parseFloat(document.getElementById("montoDeposito").value);
  if (isNaN(monto)) {
    imprimirEnConsola("⚠️ Ingrese un monto válido", "advertencia");
    return;
  }

  if (monto <= 0) {
    imprimirEnConsola("⚠️ El monto debe ser positivo", "advertencia");
    return;
  }

  if (monto > configuracionBanco.limiteDeposito) {
    imprimirEnConsola(`❌ Límite de depósito excedido (Max: ${formatearMoneda(configuracionBanco.limiteDeposito)})`, "error");
    return;
  }

  sesionActiva.saldo += monto;
  registrarMovimiento("Depósito", monto);
  imprimirEnConsola(`✅ Depósito de ${formatearMoneda(monto)} realizado`, "exito");
  document.getElementById("formDeposito").reset();
  ocultarFormularios();
}

function procesarRetiro() {
  if (!verificarSesion()) return;

  const monto = parseFloat(document.getElementById("montoRetiro").value);
  if (isNaN(monto)) {
    imprimirEnConsola("⚠️ Ingrese un monto válido", "advertencia");
    return;
  }

  if (monto <= 0) {
    imprimirEnConsola("⚠️ El monto debe ser positivo", "advertencia");
    return;
  }

  if (monto > configuracionBanco.limiteRetiro) {
    imprimirEnConsola(`❌ Límite de retiro excedido (Max: ${formatearMoneda(configuracionBanco.limiteRetiro)})`, "error");
    return;
  }

  if (monto > sesionActiva.saldo) {
    imprimirEnConsola("❌ Fondos insuficientes", "error");
    return;
  }

  sesionActiva.saldo -= monto;
  registrarMovimiento("Retiro", -monto);
  imprimirEnConsola(`✅ Retiro de ${formatearMoneda(monto)} realizado`, "exito");
  document.getElementById("formRetiro").reset();
  ocultarFormularios();
}

function procesarTransferencia() {
  if (!verificarSesion()) return;

  const destinoId = document.getElementById("cuentaDestino").value.trim();
  const monto = parseFloat(document.getElementById("montoTransferencia").value);
  const cuentaDestino = baseDeDatos.cuentas.find(c => c.id === destinoId);
  const comision = monto * (configuracionBanco.comisionTransferencia / 100);
  const total = monto + comision;

  // Validaciones
  if (!destinoId || isNaN(monto)) {
    imprimirEnConsola("⚠️ Complete todos los campos correctamente", "advertencia");
    return;
  }

  if (!cuentaDestino) {
    imprimirEnConsola("❌ Cuenta destino no encontrada", "error");
    return;
  }

  if (destinoId === sesionActiva.id) {
    imprimirEnConsola("⚠️ No puede transferirse a sí mismo", "advertencia");
    return;
  }

  if (monto <= 0) {
    imprimirEnConsola("⚠️ El monto debe ser positivo", "advertencia");
    return;
  }

  if (monto > configuracionBanco.limiteTransferencia) {
    imprimirEnConsola(`❌ Límite de transferencia excedido (Max: ${formatearMoneda(configuracionBanco.limiteTransferencia)})`, "error");
    return;
  }

  if (total > sesionActiva.saldo) {
    imprimirEnConsola(`❌ Saldo insuficiente (incluye comisión de ${formatearMoneda(comision)})`, "error");
    return;
  }

  // Procesar transferencia
  sesionActiva.saldo -= total;
  cuentaDestino.saldo += monto;

  // Registrar movimientos
  registrarMovimiento(`Transferencia a ${cuentaDestino.titular}`, -monto);
  registrarMovimiento("Comisión de transferencia", -comision);
  
  // Registrar en cuenta destino
  registrarMovimiento(`Transferencia de ${sesionActiva.titular}`, monto, cuentaDestino.id);

  imprimirEnConsola(`✅ Transferencia a ${cuentaDestino.titular} por ${formatearMoneda(monto)} (comisión: ${formatearMoneda(comision)})`, "exito");
  document.getElementById("formTransferencia").reset();
  ocultarFormularios();
}

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", () => {
  // Cargar datos y configurar UI inicial
  cargarDatos();
  actualizarUI();
  actualizarTablaCuentas();

  // Configurar formularios
  configurarFormulario("formLogin", procesarLogin);
  configurarFormulario("formDeposito", procesarDeposito);
  configurarFormulario("formRetiro", procesarRetiro);
  configurarFormulario("formTransferencia", procesarTransferencia);
  configurarFormulario("formNuevaCuenta", procesarNuevaCuenta);
});

function configurarFormulario(formId, callback) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();
    try {
      callback();
    } catch (error) {
      console.error(`Error en ${formId}:`, error);
      imprimirEnConsola("❌ Error al procesar la operación", "error");
    }
  });
}