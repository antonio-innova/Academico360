import { NextResponse } from 'next/server';
import dbConnection from '@/database/db';
import Aula from '@/database/models/Aula';
import Materia from '@/database/models/Materia';
import ExcelJS from 'exceljs';

export async function GET(request) {
  try {
    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const aulaId = searchParams.get('aulaId');

    if (!aulaId) {
      return NextResponse.json({
        success: false,
        error: 'Parámetro aulaId es requerido'
      }, { status: 400 });
    }

    // Conectar a la base de datos
    await dbConnection.connectDB();

    // Buscar el aula por su ID
    const aula = await Aula.findById(aulaId).lean();

    if (!aula) {
      return NextResponse.json({
        success: false,
        error: `No se encontró el aula con ID ${aulaId}`
      }, { status: 404 });
    }

    // Agrupar estudiantes y materias
    let estudiantes = [];
    let materiasSet = new Set();

    (aula.alumnos || []).forEach(alumno => {
      let estudiante = {
        cedula: alumno.cedula || '',
        apellidos: alumno.apellido || '',
        nombres: alumno.nombre || '',
        lugarNacimiento: alumno.lugarNacimiento || '',
        fechaNacimiento: alumno.fechaNacimiento ? new Date(alumno.fechaNacimiento).toLocaleDateString('es-ES') : '',
        calificaciones: {}
      };

      (aula.asignaciones || []).forEach(asignacion => {
        const materiaNombre = asignacion.materia?.nombre || '';
        if (materiaNombre) materiasSet.add(materiaNombre);
        
        // Buscar calificación del estudiante
        const calificacionesEstudiante = (asignacion.calificaciones || []).filter(
          cal => cal.estudiante?._id?.toString() === alumno._id?.toString()
        );

        if (calificacionesEstudiante.length > 0) {
          const notasValidas = calificacionesEstudiante.filter(cal => cal.nota !== undefined && cal.nota !== null);
          if (notasValidas.length > 0) {
            const promedio = notasValidas.reduce((sum, cal) => sum + cal.nota, 0) / notasValidas.length;
            estudiante.calificaciones[materiaNombre] = promedio.toFixed(2);
          }
        }
      });
      estudiantes.push(estudiante);
    });

    const materias = Array.from(materiasSet);

    // Crear el libro y la hoja de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rendimiento Estudiantil');

    // Encabezados
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'RESUMEN FINAL DE RENDIMIENTO ESTUDIANTIL';
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.getCell('A1').font = { bold: true, size: 14 };

    worksheet.addRow([]); // Fila vacía

    // Encabezados de la tabla
    const headerRow = [
      'Cédula de Identidad',
      'Apellidos',
      'Nombres',
      'Lugar de Nacimiento',
      'Fecha de Nacimiento',
      ...materias
    ];
    worksheet.addRow(headerRow);
    worksheet.getRow(3).font = { bold: true };
    worksheet.getRow(3).alignment = { horizontal: 'center' };

    // Agregar los datos de los estudiantes
    estudiantes.forEach(est => {
      const row = [
        est.cedula,
        est.apellidos,
        est.nombres,
        est.lugarNacimiento,
        est.fechaNacimiento,
        ...materias.map(m => est.calificaciones[m] || '')
      ];
      worksheet.addRow(row);
    });

    // Ajustar el ancho de las columnas
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    // Formato de bordes
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Generar el archivo Excel en memoria
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="rendimiento_estudiantil_${aula.nombre || 'aula'}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error al generar formato de rendimiento:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}
