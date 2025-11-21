import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Profesor from '@/database/models/Profesor';

export async function GET() {
  try {
    await connectDB();

    const XLSX = await import('xlsx');
    const profesores = await Profesor.find().lean();

    const data = profesores.map((profesor) => ({
      Nombre: profesor.nombre || '',
      Apellido: profesor.apellido || '',
      'Cédula': profesor.idU || profesor.cedula || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 25 },
      { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Docentes');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const fecha = new Date().toISOString().split('T')[0];
    const fileName = `Excel_Docentes_${fecha}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    console.error('Error al generar Excel de docentes:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al generar el Excel de docentes'
    }, { status: 500 });
  }
}

