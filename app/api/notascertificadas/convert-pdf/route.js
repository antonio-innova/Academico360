import { NextResponse } from 'next/server';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile.js';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

// Credenciales de iLovePDF
const ILOVEPDF_PUBLIC_KEY = 'project_public_df0848ab1c6b68be584598572b367300_V8Zks53830b25b303215ffc323eccfaabbad7';
const ILOVEPDF_SECRET_KEY = 'secret_key_c7ace64f3afd823e8f4afed722b9e81d_LaHjI1116a905b723d9a4eb2a8a89d0551726';

export async function POST(request) {
  let tempInputPath = null;

  try {
    const formData = await request.formData();
    const excelFile = formData.get('file');
    const fileName = formData.get('fileName') || 'nota_certificada.xlsx';

    if (!excelFile) {
      return NextResponse.json({ error: 'No se proporcionó archivo Excel' }, { status: 400 });
    }

    // Convertir el blob a buffer directamente
    const arrayBuffer = await excelFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Guardar el archivo Excel temporalmente
    const tempDir = tmpdir();
    tempInputPath = path.join(tempDir, `input_${Date.now()}_${fileName}`);
    await fs.writeFile(tempInputPath, buffer);

    // Inicializar iLovePDF API
    const instance = new ILovePDFApi(ILOVEPDF_PUBLIC_KEY, ILOVEPDF_SECRET_KEY);

    // Crear tarea de conversión de Office a PDF
    const task = instance.newTask('officepdf');
    await task.start();

    // Agregar el archivo Excel
    const file = new ILovePDFFile(tempInputPath);
    await task.addFile(file);

    // Configurar opciones de conversión para optimizar el PDF
    // Estas opciones aseguran que se respete la configuración de página del Excel
    await task.process({
      landscape: false, // Orientación VERTICAL (portrait)
      page_margin: 0,   // Sin márgenes adicionales
      zoom: 100         // Sin zoom adicional
    });

    // Descargar el resultado (task.download() devuelve un buffer directamente)
    const pdfData = await task.download();
    
    // Convertir a buffer si es necesario
    const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
    
    // Preparar el nombre del archivo PDF
    const pdfFileName = fileName.replace('.xlsx', '.pdf').replace('.xls', '.pdf');

    // Limpiar archivos temporales
    if (tempInputPath) await fs.unlink(tempInputPath).catch(() => {});

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFileName}"`,
      },
    });

  } catch (error) {
    console.error('Error en conversión Excel a PDF:', error);
    
    // Limpiar archivos temporales en caso de error
    if (tempInputPath) await fs.unlink(tempInputPath).catch(() => {});
    
    return NextResponse.json(
      { error: 'Error al convertir Excel a PDF', details: error.message },
      { status: 500 }
    );
  }
}

