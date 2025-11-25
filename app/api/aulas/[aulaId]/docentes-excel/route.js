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
      
      const profesoresMap = new Map(
        profesoresSeleccionados.map(p => [p._id.toString(), p])
      );
      const normalizarTexto = (texto = '') =>
        texto.toString().trim().toLowerCase().replace(/\s+/g, ' ');
      const profesoresNombreMap = new Map();
      profesoresSeleccionados.forEach((profesor) => {
        const id = profesor._id?.toString();
        const cedula = (profesor.idU || profesor.cedula || '').toString();
        const nombreCompleto = normalizarTexto(`${profesor.nombre || ''} ${profesor.apellido || ''}`);
        if (id) {
          if (cedula) profesoresNombreMap.set(cedula, id);
          if (nombreCompleto) profesoresNombreMap.set(nombreCompleto, id);
        }
      });
      const resolverProfesorId = (asignacion) => {
        if (!asignacion) return null;
        const directId =
          asignacion.profesorId ||
          asignacion.profesor?.id ||
          asignacion.profesor?._id ||
          asignacion.profesor?.profesorId;
        if (directId) return directId.toString();
        const cedula =
          asignacion.profesor?.idU ||
          asignacion.profesor?.cedula ||
          asignacion.profesorCedula;
        if (cedula) {
          const key = cedula.toString();
          if (profesoresNombreMap.has(key)) return profesoresNombreMap.get(key);
        }
        const nombreCompleto = normalizarTexto(
          asignacion.profesorNombre ||
            `${asignacion.profesor?.nombre || ''} ${asignacion.profesor?.apellido || ''}`
        );
        if (nombreCompleto && profesoresNombreMap.has(nombreCompleto)) {
          return profesoresNombreMap.get(nombreCompleto);
        }
        return null;
      };
      
      const asignaciones = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];
      const ocurrenciasPorProfesor = asignaciones.reduce((acc, asignacion) => {
        const profesorId = resolverProfesorId(asignacion);
        if (!profesorId) return acc;
        acc[profesorId] = (acc[profesorId] || 0) + 1;
        return acc;
      }, {});
      
      // Construir las filas en el orden especificado manteniendo repeticiones
      selectedOrder.forEach((id, index) => {
        const profesor = profesoresMap.get(id);
        if (!profesor) {
          console.log(`❌ No se encontró profesor con ID: ${id}`);
          return;
        }
        
        const repeticiones = Math.max(ocurrenciasPorProfesor[id] || 1, 1);
        console.log(`✅ #${index + 1} Match encontrado:`, {
          id: profesor._id.toString(),
          nombre: profesor.nombre,
          apellido: profesor.apellido,
          cedula: profesor.idU || profesor.cedula,
          repeticiones
        });
        
        for (let i = 0; i < repeticiones; i += 1) {
          filasOrdenadas.push({
            Nombre: formatearNombrePropio(profesor.nombre || ''),
            Apellido: formatearNombrePropio(profesor.apellido || ''),
            'Cédula': profesor.idU || profesor.cedula || 'N/D'
          });
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
          const materiaA = (a.materia?.nombre || '').toLowerCase();
          const materiaB = (b.materia?.nombre || '').toLowerCase();
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

