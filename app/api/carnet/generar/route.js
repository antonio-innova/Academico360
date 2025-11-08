import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const { nombre, apellido, cedula, anio, seccion, foto } = await request.json();

    // Validar datos requeridos
    if (!nombre || !apellido || !cedula) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos requeridos para generar el carnet' },
        { status: 400 }
      );
    }

    // Crear documento PDF con jsPDF (más grande)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [105, 66] // Carnet más grande (105x66mm)
    });

    // Colores de Las Acacias
    const amarillo = [255, 193, 7]; // Amarillo dorado
    const rojo = [220, 53, 69]; // Rojo vibrante
    const azulOscuro = [13, 110, 253]; // Azul oscuro
    const blanco = [255, 255, 255];

    // Fondo completamente blanco (sin líneas decorativas)
    doc.setFillColor(blanco[0], blanco[1], blanco[2]);
    doc.rect(0, 0, 105, 66, 'F');

    // Marco interno más grueso
    doc.setDrawColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
    doc.setLineWidth(1.2);
    doc.rect(3, 3, 99, 60);

    // Logo de Las Acacias (reemplazando el escudo simplificado)
    const logoX = 6;
    const logoY = 4; // subir el logo un poco más
    const logoWidth = 16;
    const logoHeight = 16;
    
    try {
      // Cargar el logo desde el sistema de archivos
      const logoPath = path.join(process.cwd(), 'public', 'logo_180x180.png');
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      const logoDataURL = `data:image/png;base64,${logoBase64}`;
      
      // Añadir el logo real
      doc.addImage(logoDataURL, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error al cargar el logo:', error);
      // Si no se puede cargar el logo, usar el escudo simplificado como fallback
      doc.setFillColor(amarillo[0], amarillo[1], amarillo[2]);
      doc.rect(logoX, logoY, logoWidth/2, logoHeight, 'F');
      doc.setFillColor(rojo[0], rojo[1], rojo[2]);
      doc.rect(logoX + logoWidth/2, logoY, logoWidth/2, logoHeight, 'F');
      doc.setDrawColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
      doc.setLineWidth(0.5);
      doc.rect(logoX, logoY, logoWidth, logoHeight);
    }

    // Fondo destacado para el nombre de la institución
    const tituloX = 26;
    const tituloY = 8;
    const tituloWidth = 73;
    const tituloHeight = 12;
    
    // Fondo degradado para destacar el nombre
    doc.setFillColor(amarillo[0], amarillo[1], amarillo[2]);
    doc.rect(tituloX - 2, tituloY - 2, tituloWidth, tituloHeight, 'F');
    
    // Borde del área del título
    doc.setDrawColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
    doc.setLineWidth(0.5);
    doc.rect(tituloX - 2, tituloY - 2, tituloWidth, tituloHeight);

    // Título de la institución (más destacado)
    doc.setTextColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('COLEGIO', tituloX, tituloY + 3);
    doc.setFontSize(11);
    doc.text('LAS ACACIAS', tituloX, tituloY + 7);

    // Línea decorativa más sutil
    doc.setDrawColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
    doc.setLineWidth(0.4);
    doc.line(6, 21, 99, 21);

    // Información del estudiante (con fondo blanco para mejor legibilidad)
    const infoX = 6;
    const infoY = 25;
    const infoWidth = 45;
    const infoHeight = 25;

    // Fondo blanco para la información
    doc.setFillColor(blanco[0], blanco[1], blanco[2]);
    doc.rect(infoX, infoY, infoWidth, infoHeight, 'F');
    
    // Borde del área de información
    doc.setDrawColor(azulOscuro[0], azulOscuro[1], azulOscuro[2]);
    doc.setLineWidth(0.4);
    doc.rect(infoX, infoY, infoWidth, infoHeight);

    // Texto más oscuro y legible
    const textoOscuro = [0, 0, 0]; // Negro puro
    
    doc.setTextColor(textoOscuro[0], textoOscuro[1], textoOscuro[2]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTUDIANTE', infoX + 2, infoY + 4);

    // Nombre completo
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    const nombreCompleto = `${nombre} ${apellido}`;
    doc.text(nombreCompleto, infoX + 2, infoY + 7);

    // Cédula
    doc.setFontSize(6);
    doc.text(`C.I.: ${cedula}`, infoX + 2, infoY + 11);

    // Año y sección
    doc.text(`Año: ${anio || 'N/A'}`, infoX + 2, infoY + 15);
    doc.text(`Sección: ${seccion || 'N/A'}`, infoX + 2, infoY + 19);

    // Generar código QR con los datos del estudiante
    const qrData = JSON.stringify({
      nombre: nombre,
      apellido: apellido,
      cedula: cedula,
      anio: anio,
      seccion: seccion,
      institucion: 'Colegio Las Acacias',
      fecha: new Date().toISOString()
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 120,
      margin: 1,
      color: {
        dark: '#191919', // Negro oscuro para mejor contraste
        light: '#FFFFFF' // Blanco
      }
    });

    // Posición del QR (lado derecho, más grande)
    const qrX = 58;
    const qrY = 25;
    const qrSize = 35;

    // Fondo blanco para el QR
    doc.setFillColor(blanco[0], blanco[1], blanco[2]);
    doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 'F');
    
    // Añadir el QR al PDF
    doc.addImage(qrCodeDataURL, 'PNG', qrX, qrY, qrSize, qrSize);

    // Marco alrededor del QR más grueso
    doc.setDrawColor(textoOscuro[0], textoOscuro[1], textoOscuro[2]);
    doc.setLineWidth(0.5);
    doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4);

    // Pie del carnet (más grande y legible - alineado a la izquierda)
    doc.setFontSize(5);
    doc.setTextColor(0, 0, 0); // Negro puro
    doc.setFont('helvetica', 'bold');
    doc.text('Carnet Estudiantil - Colegio Las Acacias', 6, 55);
    doc.setFontSize(4);
    doc.setFont('helvetica', 'normal');
    doc.text('Valera 1996', 6, 58);
    doc.text(new Date().getFullYear().toString(), 6, 60.5);

    // Generar el PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Configurar headers para descarga
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="carnet_${cedula}_${nombre.replace(/\s+/g, '_')}.pdf"`);
    headers.set('Content-Length', pdfBuffer.length.toString());

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error al generar carnet:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor al generar el carnet' },
      { status: 500 }
    );
  }
}
