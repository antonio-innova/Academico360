import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import CertificadoEvaluacion from '@/database/models/CertificadoEvaluacion';
import * as XLSX from 'xlsx';

export async function POST(request) {
  try {
    await connectDB();

    const formData = await request.formData();
    const tipoEvaluacion = formData.get('tipoEvaluacion');
    const momento = formData.get('momento');
    const formato = formData.get('formato');
    const estudianteCedula = formData.get('estudianteCedula');
    const estudianteNombres = formData.get('estudianteNombres');
    const estudianteApellidos = formData.get('estudianteApellidos');
    const creadoPor = formData.get('creadoPor') || 'control';

    const archivoNotasFinales = formData.get('archivoNotasFinales');
    const archivoDocentes = formData.get('archivoDocentes');

    if (!tipoEvaluacion) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tipo de evaluación es requerido' 
      }, { status: 400 });
    }

    if (!archivoNotasFinales && !archivoDocentes) {
      return NextResponse.json({ 
        success: false, 
        message: 'Debe subir al menos un archivo Excel' 
      }, { status: 400 });
    }

    let datosNotasFinales = {};
    let datosDocentes = {};
    let infoArchivoNotas = null;
    let infoArchivoDocentes = null;

    // Procesar archivo de notas finales
    if (archivoNotasFinales && archivoNotasFinales.size > 0) {
      const buffer = await archivoNotasFinales.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        raw: false 
      });
      
      datosNotasFinales = {
        nombreArchivo: archivoNotasFinales.name,
        fechaSubida: new Date(),
        datos: jsonData,
        totalRegistros: jsonData.length
      };
      
      infoArchivoNotas = {
        nombre: archivoNotasFinales.name,
        fechaSubida: new Date()
      };
    }

    // Procesar archivo de docentes
    if (archivoDocentes && archivoDocentes.size > 0) {
      const buffer = await archivoDocentes.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        defval: '',
        raw: false 
      });
      
      datosDocentes = {
        nombreArchivo: archivoDocentes.name,
        fechaSubida: new Date(),
        datos: jsonData,
        totalRegistros: jsonData.length
      };
      
      infoArchivoDocentes = {
        nombre: archivoDocentes.name,
        fechaSubida: new Date()
      };
    }

    // Guardar en la base de datos
    const certificado = await CertificadoEvaluacion.create({
      tipoEvaluacion,
      momento: momento || undefined,
      formato: formato || undefined,
      datosNotasFinales,
      datosDocentes,
      archivoNotasFinales: infoArchivoNotas,
      archivoDocentes: infoArchivoDocentes,
      estudiante: {
        cedula: estudianteCedula || '',
        nombres: estudianteNombres || '',
        apellidos: estudianteApellidos || ''
      },
      creadoPor,
      fechaCreacion: new Date()
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Archivos procesados y guardados correctamente',
      data: {
        id: certificado._id,
        tipoEvaluacion: certificado.tipoEvaluacion,
        totalNotasFinales: datosNotasFinales.totalRegistros || 0,
        totalDocentes: datosDocentes.totalRegistros || 0
      }
    });

  } catch (error) {
    console.error('Error al procesar archivos Excel:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Error al procesar archivos: ${error.message}` 
    }, { status: 500 });
  }
}

