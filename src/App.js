import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { NumerosALetras } from "numero-a-letras";

function App() {
  const modelos = [
    "TM3",
    "MILER",
    "S3",
    "S5",
    "S6",
    "S8",
    "S12",
    "S20",
    "S35",
    "EST-A 6X4",
    "EST-A X13",
    "HI-VAN",
    "VIEW CS2",
    "GALAXY",
    "TUNLAND",
  ];

  const versionesTunland = [
    "E5",
    "G7 4X2 GASOLINA STD",
    "G7 4X4 DIESEL STD",
    "G7 4X4 DIESEL AUT",
    "G9 4X4 AUT",
    "V7 4X2 HIBRIDA",
    "V9 4X4 HIBRIDA",
  ];

  const capacidades = [
    "Carga útil",
    "Capacidad de arrastre",
    "Número de pasajeros",
    "Carga sobre chasis",
  ];

  const garantias = [
    "3 años o 100 mil kilómetros",
    "10 años o 200 mil kilómetros",
    "2 años sin límite de kilometraje",
  ];

  const [formData, setFormData] = useState({
    cliente: "",
    fecha: new Date().toLocaleDateString("es-MX"),
    modelo: "TM3",
    version: "",
    tipo: "Pasaje",
    anio: "2025",
    largo: "",
    ancho: "",
    altura: "",
    pbv: "",
    capacidadTipo: "",
    capacidadValor: "",
    garantia: garantias[0], // Selección predeterminada
    precio: "",
    descuento: "",
    fechaEntrega: "Disponibilidad inmediata",
    otraFechaEntrega: "",
  });

  const [logs, setLogs] = useState([]);
  const [folio, setFolio] = useState("");
  const [consecutivo, setConsecutivo] = useState(7309);

  const logEvent = (message, type = "info") => {
    const timestamp = new Date().toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
    });
    setLogs((prevLogs) => [...prevLogs, { message, type, timestamp }]);
    console[type](message); // También imprime en la consola
  };

  useEffect(() => {
    setFolio(`${formData.modelo}/FTNLN/${consecutivo.toString().padStart(5, "0")}`);
  }, [formData.modelo, consecutivo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      ...(name === "fechaEntrega" && value !== "Otro" ? { otraFechaEntrega: "" } : {}),
    });
    logEvent(`Campo actualizado: ${name} = ${value}`);
  };

  const calculateTotal = () => {
    const precio = parseFloat(formData.precio) || 0;
    const descuento = parseFloat(formData.descuento) || 0;
    return Math.max(precio - descuento, 0); // Asegura que el total no sea negativo
  };

  const validateForm = () => {
    const requiredFields = ["cliente", "precio"];
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`El campo ${field} es obligatorio.`);
        return false;
      }
    }
    return true;
  };

  const handleGeneratePDF = () => {
    logEvent("Inicio de generación del PDF...");

    if (!validateForm()) return;

    setConsecutivo(consecutivo + 1);

    const total = calculateTotal();

    const formatoMXN = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    });

    const precioFormateado = formatoMXN.format(parseFloat(formData.precio) || 0);
    const descuentoFormateado = formatoMXN.format(parseFloat(formData.descuento) || 0);
    const totalFormateado = formatoMXN.format(total);

    const precioEnLetras = NumerosALetras(total);

    try {
      const doc = new jsPDF();
      logEvent("Instancia de jsPDF creada.");

      const logo1 = new Image();
      logo1.src = "/images/logo.png";

      const logo2 = new Image();
      logo2.src = "/images/logo2.png";

      logo1.onload = () => {
        doc.addImage(logo1, "PNG", 10, 10, 50, 20); // Primer logo en la parte superior izquierda

        logo2.onload = () => {
          doc.addImage(logo2, "PNG", 150, 10, 50, 20); // Segundo logo en la parte superior derecha

          // Continuar con la lógica del PDF
          doc.setFontSize(20);
          doc.text("COTIZACIÓN", 105, 20, { align: "center" });

          doc.setFontSize(10);
          doc.text(`Folio: ${folio}`, 150, 35);
          doc.text(`Fecha: ${formData.fecha}`, 150, 40);

          doc.setFont("helvetica", "bold");
          doc.text("Información del Cliente", 10, 50);
          doc.setFont("helvetica", "normal");
          doc.text(`Nombre: ${formData.cliente}`, 10, 55);

          doc.setFont("helvetica", "bold");
          doc.text("Datos del Vehículo", 10, 70);
          doc.setFont("helvetica", "normal");
          doc.text(`Modelo: ${formData.modelo}`, 10, 75);
          doc.text(`Versión: ${formData.version || "N/A"}`, 10, 80);
          doc.text(`Año: ${formData.anio}`, 10, 85);
          doc.text(
            `Dimensiones: Largo: ${formData.largo || "N/A"} m, Ancho: ${formData.ancho || "N/A"} m, Altura: ${formData.altura || "N/A"} m`,
            10,
            90
          );
          doc.text(`PBV: ${formData.pbv || "N/A"} kg`, 10, 95);
          doc.text(`Capacidad (${formData.capacidadTipo || "N/A"}): ${formData.capacidadValor || "N/A"}`, 10, 100);
          doc.text(`Garantía: ${formData.garantia}`, 10, 105);

          autoTable(doc, {
            startY: 110,
            head: [["Descripción", "Precio unitario", "Cantidad", "Importe"]],
            body: [
              ["Unidad", precioFormateado, "1", precioFormateado],
              ["Descuento", descuentoFormateado, "-", descuentoFormateado],
              ["Total", "", "", totalFormateado],
            ],
          });

          doc.text(`Total en letras: ${precioEnLetras}`, 10, doc.lastAutoTable.finalY + 10);
          doc.text(
            `Fecha de Entrega: ${
              formData.fechaEntrega === "Otro" ? formData.otraFechaEntrega : formData.fechaEntrega
            }`,
            10,
            doc.lastAutoTable.finalY + 20
          );

 // Segunda hoja
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Pago:", 10, 20);
      doc.setFont("helvetica", "normal");
      doc.text("  48 horas antes de la entrega.", 35, 20);

      doc.setFont("helvetica", "bold");
      doc.text("Importante:", 10, 40);
      doc.setFont("helvetica", "normal");
      doc.text(
        "  Mientras no sea confirmado formalmente su pedido (OC) los precios y tiempos de entrega quedan sujetos a variación.",
        35,
        40
      );

      doc.setFont("helvetica", "bold");
      doc.text("Entrega Unidad y Equipo Aliado:", 10, 60);
      doc.setFont("helvetica", "normal");
      doc.text(
        "  Se realizará 48 horas después del pago total del proyecto. La unidad se entrega en los patios de Foton León o rodando como límite a la redonda hasta 50 km. Fuera de esta área se cotiza traslado.",
        35,
        60
      );

      doc.setFont("helvetica", "bold");
      doc.text("Adaptaciones, Versiones, Customización:", 10, 90);
      doc.setFont("helvetica", "normal");
      doc.text(
        "  Cualquier adaptación que requiera la unidad y antes de entregarla a la carrocera, la unidad deberá ser liquidada en su totalidad.",
        35,
        90
      );

      doc.setFont("helvetica", "bold");
      doc.text("FECHA DE ENTREGA:", 10, 120);
      doc.setFont("helvetica", "normal");
      doc.text(
        `  ${formData.fechaEntrega === "Otro" ? formData.otraFechaEntrega : formData.fechaEntrega}`,
        50,
        120
      );



          // Guardar el PDF
          doc.save(`Cotizacion_${formData.modelo}.pdf`);
          logEvent("PDF generado y guardado correctamente.");
        };

        logo2.onerror = () => {
          const errorMessage = "Error al cargar el segundo logo.";
          logEvent(errorMessage, "error");
          alert(errorMessage);
        };
      };

      logo1.onerror = () => {
        const errorMessage = "Error al cargar el primer logo.";
        logEvent(errorMessage, "error");
        alert(errorMessage);
      };
    } catch (error) {
      logEvent(`Error inesperado: ${error.message}`, "error");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>Formulario de Cotización</h1>
      <form style={{ display: "grid", gap: "20px" }}>
        <div>
          <label>Cliente:</label>
          <input
            type="text"
            name="cliente"
            value={formData.cliente}
            onChange={handleChange}
            placeholder="Nombre del cliente"
          />
        </div>
        <div>
          <label>Modelo:</label>
          <select name="modelo" value={formData.modelo} onChange={handleChange}>
            {modelos.map((modelo) => (
              <option key={modelo} value={modelo}>
                {modelo}
              </option>
            ))}
          </select>
        </div>
        {formData.modelo === "TUNLAND" && (
          <div>
            <label>Versión:</label>
            <select name="version" value={formData.version} onChange={handleChange}>
              <option value="">Seleccionar Versión</option>
              {versionesTunland.map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label>Garantía:</label>
          <select name="garantia" value={formData.garantia} onChange={handleChange}>
            {garantias.map((g, index) => (
              <option key={index} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Dimensiones:</label>
          <input
            type="text"
            name="largo"
            value={formData.largo}
            onChange={handleChange}
            placeholder="Largo (m)"
          />
          <input
            type="text"
            name="ancho"
            value={formData.ancho}
            onChange={handleChange}
            placeholder="Ancho (m)"
          />
          <input
            type="text"
            name="altura"
            value={formData.altura}
            onChange={handleChange}
            placeholder="Altura (m)"
          />
        </div>
        <div>
          <label>PBV (kg):</label>
          <input
            type="number"
            name="pbv"
            value={formData.pbv}
            onChange={handleChange}
            placeholder="Peso Bruto Vehicular"
          />
        </div>
        <div>
          <label>Precio:</label>
          <input
            type="number"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Descuento:</label>
          <input
            type="number"
            name="descuento"
            value={formData.descuento}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Fecha de Entrega:</label>
          <select name="fechaEntrega" value={formData.fechaEntrega} onChange={handleChange}>
            <option value="Disponibilidad inmediata">Disponibilidad inmediata</option>
            <option value="Hasta 90 días a partir del pago del 50% de la unidad">
              Hasta 90 días a partir del pago del 50% de la unidad
            </option>
            <option value="Otro">Otro</option>
          </select>
          {formData.fechaEntrega === "Otro" && (
            <input
              type="text"
              name="otraFechaEntrega"
              value={formData.otraFechaEntrega}
              onChange={handleChange}
              placeholder="Escribe la fecha de entrega"
            />
          )}
        </div>
        <button
          type="button"
          onClick={handleGeneratePDF}
          style={{ padding: "10px", cursor: "pointer" }}
        >
          Generar PDF
        </button>
      </form>
    </div>
  );
}

export default App;
