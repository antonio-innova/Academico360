import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Profesor from '@/database/models/Profesor';

// Orden de materias igual que en Gestión de Profesores (sidebar)
const MATERIAS_POR_ANIO = {
  '1': [
    { id: 'CAS-1', codigo: 'CAS-1', nombre: 'Castellano' },
    { id: 'ILE-1', codigo: 'ILE-1', nombre: 'Inglés y otras Lenguas Extranjeras' },
    { id: 'MA-1', codigo: 'MA-1', nombre: 'Matemáticas' },
    { id: 'EF-1', codigo: 'EF-1', nombre: 'Educación Física' },
    { id: 'AP-1', codigo: 'AP-1', nombre: 'Arte y Patrimonio' },
    { id: 'CN-1', codigo: 'CN-1', nombre: 'Ciencias Naturales' },
    { id: 'GHC-1', codigo: 'GHC-1', nombre: 'Geografía, Historia y Ciudadanía' },
    { id: 'O-1', codigo: 'O-1', nombre: 'Orientación' },
    { id: 'CRP-1', codigo: 'CRP-1', nombre: 'Grupo y Participación' }
  ],
  '2': [
    { id: 'CAS-2', codigo: 'CAS-2', nombre: 'Castellano' },
    { id: 'ILE-2', codigo: 'ILE-2', nombre: 'Inglés y otras Lenguas Extranjeras' },
    { id: 'MA-2', codigo: 'MA-2', nombre: 'Matemáticas' },
    { id: 'EF-2', codigo: 'EF-2', nombre: 'Educación Física' },
    { id: 'AP-2', codigo: 'AP-2', nombre: 'Arte y Patrimonio' },
    { id: 'CN-2', codigo: 'CN-2', nombre: 'Ciencias Naturales' },
    { id: 'GHC-2', codigo: 'GHC-2', nombre: 'Geografía, Historia y Ciudadanía' },
    { id: 'O-2', codigo: 'O-2', nombre: 'Orientación' },
    { id: 'CRP-2', codigo: 'CRP-2', nombre: 'Grupo y Participación' }
  ],
  '3': [
    { id: 'CAS-3', codigo: 'CAS-3', nombre: 'Castellano' },
    { id: 'ILE-3', codigo: 'ILE-3', nombre: 'Inglés y otras Lenguas Extranjeras' },
    { id: 'MA-3', codigo: 'MA-3', nombre: 'Matemáticas' },
    { id: 'EF-3', codigo: 'EF-3', nombre: 'Educación Física' },
    { id: 'FIS-3', codigo: 'FIS-3', nombre: 'Física' },
    { id: 'QUI-3', codigo: 'QUI-3', nombre: 'Química' },
    { id: 'BIO-3', codigo: 'BIO-3', nombre: 'Biología' },
    { id: 'GHC-3', codigo: 'GHC-3', nombre: 'Geografía, Historia y Ciudadanía' },
    { id: 'O-3', codigo: 'O-3', nombre: 'Orientación' },
    { id: 'CRP-3', codigo: 'CRP-3', nombre: 'Grupo y Participación' }
  ],
  '4': [
    { id: 'CAS-4', codigo: 'CAS-4', nombre: 'Castellano' },
    { id: 'ILE-4', codigo: 'ILE-4', nombre: 'Inglés y otras Lenguas Extranjeras' },
    { id: 'MA-4', codigo: 'MA-4', nombre: 'Matemáticas' },
    { id: 'EF-4', codigo: 'EF-4', nombre: 'Educación Física' },
    { id: 'FIS-4', codigo: 'FIS-4', nombre: 'Física' },
    { id: 'QUI-4', codigo: 'QUI-4', nombre: 'Química' },
    { id: 'BIO-4', codigo: 'BIO-4', nombre: 'Biología' },
    { id: 'GHC-4', codigo: 'GHC-4', nombre: 'Geografía, Historia y Ciudadanía' },
    { id: 'FSN-4', codigo: 'FSN-4', nombre: 'Formación para la Soberanía Nacional' },
    { id: 'O-4', codigo: 'O-4', nombre: 'Orientación' },
    { id: 'CRP-4', codigo: 'CRP-4', nombre: 'Grupo y Participación' }
  ],
  '5': [
    { id: 'CAS-5', codigo: 'CAS-5', nombre: 'Castellano' },
    { id: 'ILE-5', codigo: 'ILE-5', nombre: 'Inglés y otras Lenguas Extranjeras' },
    { id: 'MA-5', codigo: 'MA-5', nombre: 'Matemáticas' },
    { id: 'EF-5', codigo: 'EF-5', nombre: 'Educación Física' },
    { id: 'FIS-5', codigo: 'FIS-5', nombre: 'Física' },
    { id: 'QUI-5', codigo: 'QUI-5', nombre: 'Química' },
    { id: 'BIO-5', codigo: 'BIO-5', nombre: 'Biología' },
    { id: 'CDT-5', codigo: 'CDT-5', nombre: 'Ciencias de la Tierra' },
    { id: 'GHC-5', codigo: 'GHC-5', nombre: 'Geografía, Historia y Ciudadanía' },
    { id: 'FSN-5', codigo: 'FSN-5', nombre: 'Formación para la Soberanía Nacional' },
    { id: 'O-5', codigo: 'O-5', nombre: 'Orientación' },
    { id: 'CRP-5', codigo: 'CRP-5', nombre: 'Grupo y Participación' }
  ]
};

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
      const materiasOrden = MATERIAS_POR_ANIO[aula.anio] || [];
      const asignaciones = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];
      const normalizarTexto = (t) => (t || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');

      const profesoresSeleccionados = await Profesor.find({ _id: { $in: selectedOrder } })
        .select('nombre apellido idU cedula')
        .lean();
      const profesoresMap = new Map(profesoresSeleccionados.map(p => [p._id.toString(), p]));
      const profesoresNombreMap = new Map();
      profesoresSeleccionados.forEach((p) => {
        const id = p._id?.toString();
        const cedula = (p.idU || p.cedula || '').toString();
        const nombreCompleto = normalizarTexto(`${p.nombre || ''} ${p.apellido || ''}`);
        if (id) {
          if (cedula) profesoresNombreMap.set(cedula, id);
          if (nombreCompleto) profesoresNombreMap.set(nombreCompleto, id);
        }
      });

      const buscarAsignacion = (materia) => asignaciones.find((a) => {
        const m = a.materia || {};
        return m.id === materia.id || m.codigo === materia.codigo ||
          (m.nombre && materia.nombre && normalizarTexto(m.nombre) === normalizarTexto(materia.nombre));
      });

      const resolverProfesor = (asig) => {
        if (!asig) return null;
        const directId = asig.profesorId || asig.profesor?.id || asig.profesor?._id || asig.profesor?.profesorId;
        if (directId) return profesoresMap.get(directId.toString()) || null;
        const cedula = asig.profesor?.idU || asig.profesor?.cedula || asig.profesorCedula;
        if (cedula && profesoresNombreMap.has(cedula.toString())) {
          return profesoresMap.get(profesoresNombreMap.get(cedula.toString())) || null;
        }
        const nombreCompleto = normalizarTexto(
          asig.profesorNombre || `${asig.profesor?.nombre || ''} ${asig.profesor?.apellido || ''}`
        );
        if (nombreCompleto && profesoresNombreMap.has(nombreCompleto)) {
          return profesoresMap.get(profesoresNombreMap.get(nombreCompleto)) || null;
        }
        return null;
      };

      materiasOrden.forEach((materia) => {
        const asig = buscarAsignacion(materia);
        const profesor = asig ? resolverProfesor(asig) : null;
        if (profesor) {
          filasOrdenadas.push({
            Nombre: formatearNombrePropio(profesor.nombre || ''),
            Apellido: formatearNombrePropio(profesor.apellido || ''),
            'Cédula': profesor.idU || profesor.cedula || 'N/D'
          });
        } else {
          filasOrdenadas.push({ Nombre: '**', Apellido: '**', 'Cédula': '**' });
        }
      });

      if (filasOrdenadas.length === 0 && materiasOrden.length === 0) {
        asignaciones.filter((a) => a.materia).forEach(() => {
          filasOrdenadas.push({ Nombre: '**', Apellido: '**', 'Cédula': '**' });
        });
      }

      console.log(`📊 Total en Excel: ${filasOrdenadas.length} filas (selección manual)`);
    } else {
      // Sin selección manual: una fila por materia en el orden de Gestión de Profesores
      const materiasOrden = MATERIAS_POR_ANIO[aula.anio] || [];
      const asignaciones = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];
      const normalizarTexto = (t) => (t || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
      const esAulaPendiente = aula.esPendiente === true;

      const buscarAsignacion = (materia) => asignaciones.find((a) => {
        const m = a.materia || {};
        return m.id === materia.id || m.codigo === materia.codigo ||
          (m.nombre && materia.nombre && normalizarTexto(m.nombre) === normalizarTexto(materia.nombre));
      });

      const todosProfesores = await Profesor.find().select('_id nombre apellido idU cedula').lean();
      const profesoresMap = new Map(todosProfesores.map(p => [p._id.toString(), p]));
      const profesoresNombreMap = new Map();
      todosProfesores.forEach((p) => {
        const id = p._id?.toString();
        const cedula = (p.idU || p.cedula || '').toString();
        const nombreCompleto = normalizarTexto(`${p.nombre || ''} ${p.apellido || ''}`);
        if (id) {
          if (cedula) profesoresNombreMap.set(cedula, id);
          if (nombreCompleto) profesoresNombreMap.set(nombreCompleto, id);
        }
      });

      const resolverProfesor = (asig) => {
        if (!asig) return null;
        const directId = asig.profesorId || asig.profesor?.id || asig.profesor?._id || asig.profesor?.profesorId;
        if (directId) return profesoresMap.get(directId.toString()) || null;
        const cedula = asig.profesor?.idU || asig.profesor?.cedula || asig.profesorCedula;
        if (cedula) {
          const id = profesoresNombreMap.get(cedula.toString());
          if (id) return profesoresMap.get(id) || null;
        }
        const nombreCompleto = normalizarTexto(
          asig.profesorNombre || `${asig.profesor?.nombre || ''} ${asig.profesor?.apellido || ''}`
        );
        if (nombreCompleto) {
          const id = profesoresNombreMap.get(nombreCompleto);
          if (id) return profesoresMap.get(id) || null;
          const [nom, ...apeParts] = (asig.profesorNombre || `${asig.profesor?.nombre || ''} ${asig.profesor?.apellido || ''}`).trim().split(/\s+/);
          return { nombre: nom || '', apellido: apeParts.join(' ') || '', idU: asig.profesor?.idU || asig.profesor?.cedula || 'N/D' };
        }
        return null;
      };

      const filasConProfesor = materiasOrden.map((materia) => {
        const asig = buscarAsignacion(materia);
        const profesor = asig ? resolverProfesor(asig) : null;
        return { materia, profesor };
      });

      const profesoresUnicos = new Set();
      filasConProfesor.forEach(({ profesor }) => {
        if (profesor && (profesor._id || profesor.nombre || profesor.apellido)) {
          const key = profesor._id ? profesor._id.toString() : normalizarTexto(`${profesor.nombre || ''} ${profesor.apellido || ''}`);
          profesoresUnicos.add(key);
        }
      });
      const soloUnProfesor = esAulaPendiente && profesoresUnicos.size === 1;

      let profesorUnicoPuesto = false;
      let profesorUnicoData = null;
      if (soloUnProfesor) {
        const primeraConProfesor = filasConProfesor.find((f) => f.profesor);
        profesorUnicoData = primeraConProfesor?.profesor;
      }

      filasConProfesor.forEach(({ materia, profesor }) => {
        const tieneDatos = profesor && (profesor.nombre || profesor.apellido || profesor._id);
        if (soloUnProfesor && profesorUnicoData) {
          if (tieneDatos && !profesorUnicoPuesto) {
            profesorUnicoPuesto = true;
            const nom = profesor.nombre || '';
            const ape = profesor.apellido || '';
            const ced = profesor.idU || profesor.cedula || 'N/D';
            filasOrdenadas.push({
              Nombre: formatearNombrePropio(nom),
              Apellido: formatearNombrePropio(ape),
              'Cédula': ced
            });
          } else {
            filasOrdenadas.push({ Nombre: '**', Apellido: '**', 'Cédula': '**' });
          }
        } else if (tieneDatos) {
          const nom = profesor.nombre || '';
          const ape = profesor.apellido || '';
          const ced = profesor.idU || profesor.cedula || 'N/D';
          filasOrdenadas.push({
            Nombre: formatearNombrePropio(nom),
            Apellido: formatearNombrePropio(ape),
            'Cédula': ced
          });
        } else {
          filasOrdenadas.push({ Nombre: '**', Apellido: '**', 'Cédula': '**' });
        }
      });

      if (filasOrdenadas.length === 0 && materiasOrden.length === 0) {
        const asignacionesComoMaterias = asignaciones
          .filter((a) => a.materia)
          .map((a, i) => ({ id: a.materia?.id || i, codigo: a.materia?.codigo, nombre: a.materia?.nombre }));
        asignacionesComoMaterias.forEach(() => {
          filasOrdenadas.push({ Nombre: '**', Apellido: '**', 'Cédula': '**' });
        });
      }

      console.log(`📊 Total en Excel: ${filasOrdenadas.length} filas (orden materias Gestión)`);
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

