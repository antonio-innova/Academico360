import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// POST - Endpoint para depuración que guarda los datos recibidos en un archivo
export async function POST(request) {
  try {
    // Obtener los datos de la solicitud
    const data = await request.json();
    
    // Crear un objeto con los datos recibidos y la fecha/hora
    const debugData = {
      timestamp: new Date().toISOString(),
      data: data
    };
    
    // Ruta al archivo de depuración
    const debugFilePath = path.join(process.cwd(), 'debug-data.json');
    
    // Leer el archivo existente o crear uno nuevo
    let existingData = [];
    try {
      if (fs.existsSync(debugFilePath)) {
        const fileContent = fs.readFileSync(debugFilePath, 'utf8');
        existingData = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Error al leer el archivo de depuración:', error);
    }
    
    // Añadir los nuevos datos
    existingData.push(debugData);
    
    // Guardar los datos en el archivo
    fs.writeFileSync(debugFilePath, JSON.stringify(existingData, null, 2), 'utf8');
    
    // Devolver una respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Datos de depuración guardados correctamente'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error en el endpoint de depuración:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al procesar la solicitud de depuración',
      error: error.message
    }, { status: 500 });
  }
}
