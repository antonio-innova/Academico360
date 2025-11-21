import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Profesor from '@/database/models/Profesor';

const formatearNombrePropio = (texto = '') => {
  const limpio = texto.toString().trim().toLowerCase();
  if (!limpio) return '';
  return limpio
    .split(/\s+/)
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

export async function GET(request, { params }) {
  try {
    const url = new URL(request.url);
    const selectedParam = url.searchParams.get('selected');
    const selectedOrder = selectedParam
      ? selectedParam.split(',').map(id => id.trim()).filter(Boolean)
      : [];

    const awaitedParams = await params;
    const { aulaId } = awaitedParams || {};
    if (!aulaId) {
      return NextResponse.json(
        { success: false, message: 'ID de aula requerido' },
        { status: 400 }
      );
    }

    await connectDB();
    const XLSX = await import('xlsx');

    const aula = await Aula.findById(aulaId).lean();
    if (!aula) {
      return NextResponse.json(
        { success: false, message: 'Aula no encontrada' },
        { status: 404 }
      );
    }

    let filasOrdenadas = [];

    if (selectedOrder.length > 0) {
      console.log('🔍 IDs seleccionados recibidos:', selectedOrder);
      
      // Buscar profesores directamente por sus IDs en la colección Profesor
      const profesoresSeleccionados = await Profesor.find({ 
        _id: { $in: selectedOrder } 
      })
        .select('nombre apellido idU cedula')
        .lean();

      console.log('📋 Profesores encontrados en BD:', profesoresSeleccionados.length);
      
      // Crear un mapa para mantener el orden
      const profesoresMap = new Map(
        profesoresSeleccionados.map(p => [p._id.toString(), p])
      );
      
      // Construir las filas en el orden especificado
      selectedOrder.forEach((id, index) => {
        const profesor = profesoresMap.get(id);
        if (profesor) {
          console.log(`✅ #${index + 1} Match encontrado:`, {
            id: profesor._id.toString(),
            nombre: profesor.nombre,
            apellido: profesor.apellido,
            cedula: profesor.idU || profesor.cedula
          });
          filasOrdenadas.push({
            Nombre: formatearNombrePropio(profesor.nombre || ''),
            Apellido: formatearNombrePropio(profesor.apellido || ''),
            'Cédula': profesor.idU || profesor.cedula || 'N/D'
          });
        } else {
          console.log(`❌ No se encontró profesor con ID: ${id}`);
        }
      });
      
      console.log(`📊 Total en Excel: ${filasOrdenadas.length} de ${selectedOrder.length} seleccionados`);
    } else {
      // Si no hay selección manual, obtener todos los profesores ordenados por materia
      console.log('📚 Obteniendo todos los profesores ordenados por materia del aula');
      
      const asignaciones = aula.asignaciones || [];
      
      // Ordenar asignaciones por nombre de materia
      const asignacionesOrdenadas = asignaciones
        .filter(asig => asig.materia && asig.profesorId)
        .sort((a, b) => {
          const materiaA = (a.materia || '').toLowerCase();
          const materiaB = (b.materia || '').toLowerCase();
          return materiaA.localeCompare(materiaB);
        });
      
      console.log(`📋 Asignaciones encontradas: ${asignacionesOrdenadas.length}`);
      
      // Obtener todos los IDs únicos de profesores
      const profesorIds = [...new Set(
        asignacionesOrdenadas
          .map(asig => asig.profesorId)
          .filter(Boolean)
      )];
      
      // Buscar todos los profesores
      const profesores = await Profesor.find({
        _id: { $in: profesorIds }
      })
        .select('nombre apellido idU cedula')
        .lean();
      
      // Crear mapa de profesores
      const profesoresMap = new Map(
        profesores.map(p => [p._id.toString(), p])
      );
      
      // Construir filas ordenadas por materia (permitiendo repeticiones)
      asignacionesOrdenadas.forEach((asignacion) => {
        const profesorId = asignacion.profesorId?.toString();
        const profesor = profesoresMap.get(profesorId);
        
        if (profesor) {
          filasOrdenadas.push({
            Nombre: formatearNombrePropio(profesor.nombre || ''),
            Apellido: formatearNombrePropio(profesor.apellido || ''),
            'Cédula': profesor.idU || profesor.cedula || 'N/D'
          });
        }
      });
      
      console.log(`📊 Total en Excel (ordenado por materia): ${filasOrdenadas.length}`);
    }

    // Si no hay profesores, mostrar mensaje
    if (filasOrdenadas.length === 0) {
      filasOrdenadas.push({
        Nombre: 'No hay profesores asignados',
        Apellido: '',
        'Cédula': ''
      });
    }

    const filasExcel = filasOrdenadas;

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(filasExcel);
    worksheet['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Docentes');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const fecha = new Date().toISOString().split('T')[0];
    const nombreAula = `${aula.anio || ''}${aula.seccion || ''}`.trim() || 'Aula';
    const fileName = `Docentes_${nombreAula}_${fecha}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    console.error('Error al generar Excel de docentes por aula:', error);
    return NextResponse.json(
      { success: false, message: 'Error al generar el Excel de docentes' },
      { status: 500 }
    );
  }
}

