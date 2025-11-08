import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Endpoint para servir la plantilla Excel original desde la carpeta Datas sin modificaciones
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
    
    // Leer el archivo como un buffer binario sin procesarlo
    const fileBuffer = fs.readFileSync(templatePath);
    
    // Devolver el archivo como respuesta sin ninguna modificación
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': 'inline; filename="Resumen Final Rendimiento Estudiantil EMG formatos.xls"'
      }
    });
    
  } catch (error) {
    console.error('Error al servir la plantilla Excel original:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error al servir la plantilla Excel original' 
    }, { status: 500 });
  }
}
