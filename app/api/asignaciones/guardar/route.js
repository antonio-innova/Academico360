import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '../../../../database/db';

// Esquema simplificado para asignaciones
const AsignacionSchema = new mongoose.Schema({
  materiaId: { type: mongoose.Schema.Types.ObjectId, required: true },
  materiaNombre: { type: String, required: true },
  profesorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  profesorNombre: { type: String, required: true },
  alumnos: [{ type: mongoose.Schema.Types.ObjectId }],
  alumnosInfo: [{ 
    id: { type: mongoose.Schema.Types.ObjectId },
    nombre: { type: String },
    idU: { type: String },
    cedula: { type: String }
  }],
  periodo: { type: String, default: '' },
  periodoId: { type: String, default: '' },
  anio: { type: String, default: '1 año' },
  seccion: { type: String, default: 'A' },
  turno: { type: String, default: 'Mañana' },
  creadoPor: { type: String, required: true },
  tipoCreador: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now },
}, { timestamps: true });

// POST - Guardar asignación (endpoint simplificado)
export async function POST(request) {
  try {
    // Conectar a MongoDB usando la función del módulo db.js
    await connectDB();
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar datos mínimos requeridos
    if (!data.materiaId || !data.profesorId) {
      return NextResponse.json({
        success: false,
        message: 'Faltan campos requeridos: materiaId y profesorId son obligatorios'
      }, { status: 400 });
    }
    
    // Crear modelo de asignación y materia (solo para esta solicitud)
    const AsignacionModel = mongoose.models.Asignacion || 
                           mongoose.model('Asignacion', AsignacionSchema);
    
    // Definir esquema de materia para verificar si existe
    const MateriaSchema = new mongoose.Schema({
      codigo: { type: String, required: true },
      nombre: { type: String, required: true },
      descripcion: { type: String },
      anio: { type: String },
      creadoPor: { type: String },
      tipoCreador: { type: String },
      fechaCreacion: { type: Date, default: Date.now }
    });
    
    const MateriaModel = mongoose.models.Materia || 
                        mongoose.model('Materia', MateriaSchema);
    
    // Verificar que la materia exista antes de crear la asignación
    const materiaId = data.materiaId;
    let materia;
    
    try {
      // Verificar si el materiaId es un ObjectId válido
      if (materiaId && materiaId.match(/^[0-9a-fA-F]{24}$/)) {
        const materiaObjectId = new mongoose.Types.ObjectId(materiaId);
        materia = await MateriaModel.findById(materiaObjectId);
      }
      
      // Si no se encontró por ID, buscar por código
      if (!materia && materiaId) {
        materia = await MateriaModel.findOne({ codigo: materiaId });
      }
      
      // Si no se encuentra la materia, devolver error
      if (!materia) {
        return NextResponse.json({
          success: false,
          message: `No se encontró la materia con ID o código: ${materiaId}. Por favor, seleccione una materia existente.`
        }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Error al buscar la materia: ' + error.message
      }, { status: 500 });
    }
    
    // Convertir IDs a ObjectId si son strings
    const convertirAObjectId = (id) => {
      if (!id) return null;
      try {
        return typeof id === 'string' && id.length === 24 ? new mongoose.Types.ObjectId(id) : id;
      } catch (e) {
        return id; // Devolver el ID original si no se puede convertir
      }
    };
    
    // Convertir IDs de alumnos a ObjectId si son strings
    const alumnosConvertidos = (data.alumnos || []).map(id => convertirAObjectId(id));
    
    // Crear nueva asignación con datos permanentes
    const nuevaAsignacion = new AsignacionModel({
      materiaId: convertirAObjectId(data.materiaId),
      materiaNombre: data.materiaNombre || 'Sin nombre',
      profesorId: convertirAObjectId(data.profesorId),
      profesorNombre: data.profesorNombre || 'Sin nombre',
      alumnos: alumnosConvertidos,
      alumnosInfo: data.alumnosInfo || [],
      periodo: data.periodo || '',
      periodoId: data.periodoId || '',
      anio: data.anio || '1 año',
      seccion: data.seccion || 'A',
      turno: data.turno || 'Mañana',
      creadoPor: data.creadoPor || data.userId || 'sistema',
      tipoCreador: data.tipoCreador || data.userType || 'control',
      fechaCreacion: new Date()
    });
    
    // Guardar usando el método save() de Mongoose
    const resultado = await nuevaAsignacion.save();
    
    if (!resultado || !resultado._id) {
      throw new Error('No se pudo guardar la asignación en la base de datos');
    }
    
    // Verificar que se guardó correctamente usando el ID del documento guardado
    const asignacionGuardada = await AsignacionModel.findById(resultado._id);
    
    if (!asignacionGuardada) {
      return NextResponse.json({
        success: false,
        message: 'Error al verificar la asignación guardada'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Asignación guardada correctamente',
      data: asignacionGuardada
    }, { status: 201 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error al guardar la asignación: ' + error.message
    }, { status: 500 });
  }
}
