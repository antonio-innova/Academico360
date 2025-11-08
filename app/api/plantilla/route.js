import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Endpoint para servir la plantilla Excel desde la carpeta Datas
export async function GET(request) {
  try {
    // Ruta a la plantilla Excel en la carpeta Datas
    const templatePath = path.join(process.cwd(), 'Datas', 'Resumen Final Rendimiento Estudiantil EMG formatos.xls');
    
    // Verificar si el archivo existe
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Plantilla Excel no encontrada' 
      }, { status: 404 });
    }
    
    // Leer el archivo
    const fileBuffer = fs.readFileSync(templatePath);
    
    // Devolver el archivo como respuesta
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': 'attachment; filename="Resumen Final Rendimiento Estudiantil EMG formatos.xls"'
      }
    });
    
  } catch (error) {
    console.error('Error al servir la plantilla Excel:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al servir la plantilla Excel' 
    }, { status: 500 });
  }
}
