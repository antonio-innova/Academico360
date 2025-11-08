import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

// POST - Subir una imagen
export async function POST(request) {
  try {
    const formData = await request.formData();
    const imagen = formData.get('imagen');
    const nombreArchivo = formData.get('nombreArchivo') || imagen.name;
    
    if (!imagen) {
      return NextResponse.json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      }, { status: 400 });
    }
    
    // Convertir la imagen a un buffer
    const bytes = await imagen.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Definir la ruta donde se guardará la imagen
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'calificaciones');
    const filePath = path.join(uploadDir, nombreArchivo);
    
    // Guardar la imagen en el sistema de archivos
    await writeFile(filePath, buffer);
    
    // Construir la URL relativa para acceder a la imagen
    const imageUrl = `/uploads/calificaciones/${nombreArchivo}`;
    
    return NextResponse.json({
      success: true,
      message: 'Imagen subida correctamente',
      url: imageUrl
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al subir la imagen:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al subir la imagen',
      error: error.message
    }, { status: 500 });
  }
}
