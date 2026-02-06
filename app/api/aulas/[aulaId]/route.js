'use server'

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnection from '../../../../database/db';
import Aula from '../../../../database/models/Aula';
import Profesor from '../../../../database/models/Profesor';

const normalizeMateriasAsignadas = (materias) => {
  if (!materias) return [];
  const baseArray = Array.isArray(materias)
    ? materias
    : typeof materias === 'object'
      ? Object.values(materias)
      : [];
  return baseArray
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'object') {
        return String(item.id || item.codigo || item.value || '').trim();
      }
      return String(item).trim();
    })
    .filter(Boolean);
};

// GET /api/aulas/[aulaId] - Obtener un aula específica con sus materias y alumnos
export async function GET(request, { params }) {
  try {
    const { aulaId } = await params;
    await dbConnection.connectDB();

    // Validar que aulaId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(aulaId)) {
      return NextResponse.json({
        success: false,
        message: 'ID de aula inválido'
      }, { status: 400 });
    }

    // Buscar el aula por su ID y popular las calificaciones
    const aula = await Aula.findById(aulaId).exec();

    if (!aula) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    const aulaObj = aula.toObject();
    const alumnosNormalizados = (aulaObj.alumnos || []).map((alumno) => ({
      ...alumno,
      materiasAsignadas: normalizeMateriasAsignadas(alumno.materiasAsignadas)
    }));

    // Resolver profesor: poblar profesorId/profesorNombre cuando solo tenemos profesor {nombre, apellido}
    const esc = (s) => (s || '').toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalizarParaBusqueda = (t) => (t || '').toString().toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
    const asignacionesConProfesor = await Promise.all((aulaObj.asignaciones || []).map(async (asignacion) => {
      const materia = asignacion.materia || {};
      let resultado = {
        ...asignacion,
        materia: {
          ...materia,
          id: materia.id ? String(materia.id) : materia.id,
          codigo: materia.codigo || materia.id || ''
        }
      };
      const nombre = (asignacion.profesor?.nombre || '').trim();
      const apellido = (asignacion.profesor?.apellido || '').trim();
      const nombreCompleto = (asignacion.profesorNombre || `${nombre} ${apellido}`).trim();

      console.log(`🔍 Procesando asignación: ${materia.nombre} - Profesor: ${nombre} ${apellido}`);

      if (asignacion.profesorId) {
        console.log(`  ✅ Tiene profesorId: ${asignacion.profesorId}`);
        const prof = await Profesor.findById(asignacion.profesorId).select('nombre apellido').lean();
        if (prof) {
          resultado.profesorNombre = `${prof.nombre || ''} ${prof.apellido || ''}`.trim();
          if (!nombre && !apellido) {
            resultado.profesor = { nombre: prof.nombre || '', apellido: prof.apellido || '' };
          }
          console.log(`  ✅ Profesor encontrado: ${resultado.profesorNombre}`);
        }
      } else if (nombre || apellido || nombreCompleto) {
        const textoBusqueda = nombreCompleto || `${nombre} ${apellido}`.trim();
        if (!textoBusqueda) {
          console.log(`  ⚠️ Sin profesor asignado`);
        } else {
          console.log(`  🔎 Buscando profesor en BD: "${textoBusqueda}"`);
          let profesorEncontrado = null;

          // 1) Buscar por nombre + apellido exactos
          if (nombre && apellido) {
            profesorEncontrado = await Profesor.findOne({
              nombre: new RegExp(`^${esc(nombre)}$`, 'i'),
              apellido: new RegExp(`^${esc(apellido)}$`, 'i')
            }).select('_id nombre apellido').lean();
          }

          // 2) Buscar por concatenación nombre + apellido igual al texto completo
          if (!profesorEncontrado) {
            const textoLower = textoBusqueda.toLowerCase().trim();
            profesorEncontrado = await Profesor.findOne({
              $expr: {
                $eq: [
                  { $toLower: { $trim: { input: { $concat: [{ $ifNull: ['$nombre', ''] }, ' ', { $ifNull: ['$apellido', ''] }] } } } },
                  { $literal: textoLower }
                ]
              }
            }).select('_id nombre apellido').lean();
          }

          // 3) Buscar donde el nombre completo contenga el texto (para "RICARDO JOSE ABREU CEGARRA" en un solo campo)
          if (!profesorEncontrado) {
            const partes = textoBusqueda.split(/\s+/).filter(Boolean);
            if (partes.length >= 2) {
              const posiblesApellidos = partes.slice(-2).join(' ');
              const posiblesNombres = partes.slice(0, -2).join(' ') || partes[0];
              profesorEncontrado = await Profesor.findOne({
                $or: [
                  { nombre: new RegExp(`^${esc(posiblesNombres)}$`, 'i'), apellido: new RegExp(`^${esc(posiblesApellidos)}$`, 'i') },
                  { nombre: new RegExp(`^${esc(partes[0])}$`, 'i'), apellido: new RegExp(`^${esc(partes.slice(1).join(' '))}$`, 'i') }
                ]
              }).select('_id nombre apellido').lean();
            }
          }

          // 4) Búsqueda flexible: nombre O apellido contenga el texto completo
          if (!profesorEncontrado) {
            const regexEscapado = esc(textoBusqueda);
            profesorEncontrado = await Profesor.findOne({
              $or: [
                { nombre: new RegExp(regexEscapado, 'i') },
                { apellido: new RegExp(regexEscapado, 'i') },
                { $expr: { $regexMatch: { input: { $concat: [{ $ifNull: ['$nombre', ''] }, ' ', { $ifNull: ['$apellido', ''] }] }, regex: regexEscapado, options: 'i' } } }
              ]
            }).select('_id nombre apellido').lean();
          }

          // 5) Fallback: buscar en todos los profesores por coincidencia normalizada (sin acentos)
          if (!profesorEncontrado) {
            const textoNorm = normalizarParaBusqueda(textoBusqueda);
            const todosProfesores = await Profesor.find().select('_id nombre apellido').lean();
            profesorEncontrado = todosProfesores.find((p) => {
              const full = normalizarParaBusqueda(`${p.nombre || ''} ${p.apellido || ''}`);
              return full === textoNorm || full.includes(textoNorm) || textoNorm.includes(full);
            }) || null;
          }

          if (profesorEncontrado) {
            resultado.profesorId = profesorEncontrado._id;
            resultado.profesorNombre = `${profesorEncontrado.nombre || ''} ${profesorEncontrado.apellido || ''}`.trim();
            resultado.profesor = { nombre: profesorEncontrado.nombre || '', apellido: profesorEncontrado.apellido || '' };
            console.log(`  ✅ Profesor encontrado en BD: ${resultado.profesorNombre} (ID: ${resultado.profesorId})`);
          } else {
            console.log(`  ❌ No existe en colección Profesor - usando nombre de asignación`);
            resultado.profesorNombre = textoBusqueda;
            resultado.profesor = {
              nombre: nombre || textoBusqueda.split(/\s+/)[0] || '',
              apellido: apellido || textoBusqueda.split(/\s+/).slice(1).join(' ') || ''
            };
          }
        }
      } else if (nombreCompleto) {
        resultado.profesorNombre = nombreCompleto;
        console.log(`  📝 Solo profesorNombre: ${nombreCompleto}`);
      } else {
        console.log(`  ⚠️ Sin profesor asignado`);
      }
      return resultado;
    }));

    console.log(`📊 Total asignaciones procesadas: ${asignacionesConProfesor.length}`);
    const asignacionesNormalizadas = asignacionesConProfesor;

    const aulaData = {
      ...aulaObj,
      alumnos: alumnosNormalizados,
      asignaciones: asignacionesNormalizadas
    };

    return NextResponse.json({
      success: true,
      data: aulaData
    });

  } catch (error) {
    console.error('Error al obtener el aula:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener el aula',
      error: error.message
    }, { status: 500 });
  }
}

// PUT /api/aulas/[aulaId] - Actualizar un aula específica
export async function PUT(request, { params }) {
  try {
    const { aulaId } = await params;
    await dbConnection.connectDB();

    // Validar que aulaId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(aulaId)) {
      return NextResponse.json({
        success: false,
        message: 'ID de aula inválido'
      }, { status: 400 });
    }

    const data = await request.json();

    // Buscar el aula
    const aula = await Aula.findById(aulaId);
    if (!aula) {
      return NextResponse.json({
        success: false,
        message: 'Aula no encontrada'
      }, { status: 404 });
    }

    // Actualizar los campos proporcionados
    const updateData = {};
    
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.anio !== undefined) updateData.anio = data.anio;
    if (data.seccion !== undefined) updateData.seccion = data.seccion;
    if (data.turno !== undefined) updateData.turno = data.turno;
    if (data.periodo !== undefined) updateData.periodo = data.periodo;
    if (data.alumnos !== undefined) updateData.alumnos = data.alumnos;
    if (data.asignaciones !== undefined) updateData.asignaciones = data.asignaciones;
    if (data.estado !== undefined) updateData.estado = data.estado;

    // Actualizar el aula
    const aulaActualizada = await Aula.findByIdAndUpdate(
      aulaId,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Aula actualizada correctamente',
      data: aulaActualizada
    });

  } catch (error) {
    console.error('Error al actualizar el aula:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar el aula',
      error: error.message
    }, { status: 500 });
  }
}
