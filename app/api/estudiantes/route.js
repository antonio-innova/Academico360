import { NextResponse } from 'next/server';
import { connectDB } from '../../../database/db';
import Estudiante from '../../../database/models/Estudiante';

// GET - Obtener todos los estudiantes
export async function GET(request) {
  try {
    await connectDB();

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const creadorId = searchParams.get('creadorId');
    const institucion = searchParams.get('institucion');
    const nombre = searchParams.get('nombre');
    
    // Construir el filtro de búsqueda
    let filter = {};
    
    // Buscar estudiantes en la base de datos
    const estudiantes = await Estudiante.find(filter).select('_id nombre apellido cedula idU estado edad ef sexo lugarNacimiento fechaNacimiento esMenorDeEdad creadoPor tipoCreador representante anio seccion');
    
    return NextResponse.json({
      success: true,
      message: 'Estudiantes obtenidos correctamente',
      data: estudiantes
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener estudiantes',
      error: error.message
    }, { status: 500 });
  }
}

// POST - Crear un nuevo estudiante
export async function PUT(request) {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.id) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el ID del estudiante para actualizarlo'
      }, { status: 400 });
    }
    
    // Buscar el estudiante por ID
    const estudiante = await Estudiante.findById(data.id);
    
    if (!estudiante) {
      return NextResponse.json({
        success: false,
        message: 'Estudiante no encontrado'
      }, { status: 404 });
    }
    
    // Actualizar los campos del estudiante
    if (data.nombre) estudiante.nombre = data.nombre;
    if (data.apellido) estudiante.apellido = data.apellido;
    if (data.cedula) estudiante.idU = data.cedula;
    if (data.fechaNacimiento) estudiante.fechaNacimiento = data.fechaNacimiento;
    if (data.lugarNacimiento !== undefined) estudiante.lugarNacimiento = data.lugarNacimiento;
    if (data.sexo) estudiante.sexo = data.sexo;
    if (data.ef !== undefined) estudiante.ef = data.ef;
    if (data.edad !== undefined) estudiante.edad = parseInt(data.edad) || 0;
    if (data.esMenorDeEdad !== undefined) estudiante.esMenorDeEdad = data.esMenorDeEdad;
    if (data.anio !== undefined) estudiante.anio = data.anio;
    if (data.seccion !== undefined) estudiante.seccion = data.seccion;
    
    // Actualizar datos del representante si existen
    if (data.representante) {
      estudiante.representante = {
        nombre: data.representante.nombre || '',
        apellido: data.representante.apellido || '',
        cedula: data.representante.cedula || '',
        correo: data.representante.correo || '',
        telefono: data.representante.telefono || '',
        parentesco: data.representante.parentesco || 'Otro'
      };
    }
    
    // Guardar los cambios
    await estudiante.save();
    
    return NextResponse.json({
      success: true,
      message: 'Estudiante actualizado correctamente',
      data: estudiante
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar estudiante',
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    // Obtener datos del cuerpo de la solicitud
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.nombre || !data.apellido || !data.fechaNacimiento) {
      return NextResponse.json({
        success: false,
        message: 'Faltan datos requeridos para crear el estudiante'
      }, { status: 400 });
    }
    
    // Verificar si el usuario existe
    if (!data.userId) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el ID del usuario que crea el estudiante'
      }, { status: 400 });
    }

    // Verificar si ya existe un estudiante con la misma cédula
    if (data.cedula) {
      const estudianteExistente = await Estudiante.findOne({ idU: data.cedula });
      if (estudianteExistente) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un estudiante registrado con esta cédula'
        }, { status: 400 });
      }
    } else {
      // Si no hay cédula, verificar por nombre y apellido
      const estudianteExistente = await Estudiante.findOne({
        nombre: data.nombre,
        apellido: data.apellido,
        fechaNacimiento: data.fechaNacimiento
      });
      if (estudianteExistente) {
        return NextResponse.json({
          success: false,
          message: 'Ya existe un estudiante registrado con el mismo nombre, apellido y fecha de nacimiento'
        }, { status: 400 });
      }
    }

    // Procesar específicamente el campo grupo para asegurar que se guarde correctamente
    if (data.grupo === undefined || data.grupo === null) {
      data.grupo = '';
    } else {
      data.grupo = String(data.grupo).trim();
    }

    // Crear un objeto con los datos del estudiante
    const estudiante = {
      idU: data.cedula || data.idU || '',
      nombre: data.nombre || '',
      apellido: data.apellido || '',
      fechaNacimiento: data.fechaNacimiento || new Date(),
      lugarNacimiento: data.lugarNacimiento || '',
      sexo: data.sexo || 'Otro',
      ef: data.ef || '',
      edad: parseInt(data.edad) || 0,
      esMenorDeEdad: data.esMenorDeEdad === true,
      anio: data.anio || '',
      seccion: data.seccion || '',
      creadoPor: data.userId || '',
      tipoCreador: data.userType || 'control'
    };
    
    // Agregar datos del representante si existen
    if (data.representante) {
      estudiante.representante = {
        nombre: data.representante.nombre || '',
        apellido: data.representante.apellido || '',
        cedula: data.representante.cedula || '',
        correo: data.representante.correo || '',
        telefono: data.representante.telefono || '',
        parentesco: data.representante.parentesco || 'Otro'
      };
    }
    
    // Crear el estudiante usando el método create de Mongoose
    const nuevoEstudiante = await Estudiante.create(estudiante);
    
    // Asignar IDs dinámicos según el tipo de usuario y la institución
    if (data.userType === 'control') {
      // Verificar la institución para asignar el prefijo correcto
      if (data.institucion === 'Acacias') {
        nuevoEstudiante.idAA = `AA${Date.now()}`;
      } else if (data.institucion === 'IUTCM') {
        nuevoEstudiante.idIA = `IA${Date.now()}`;
      } else {
        // Valor por defecto si no se especifica la institución
        nuevoEstudiante.idAA = `AA${Date.now()}`;
      }
    }
    
    try {
      // Asignar el grupo directamente al documento antes de guardar
      if (data.grupo !== undefined && data.grupo !== null) {
        nuevoEstudiante.set('grupo', String(data.grupo).trim());
      } else {
        nuevoEstudiante.set('grupo', '');
      }
      
      // Forzar la asignación directa también
      nuevoEstudiante.grupo = nuevoEstudiante.get('grupo');
      
      // Guardar el estudiante en la base de datos
      const estudianteGuardado = await nuevoEstudiante.save();
      
      return NextResponse.json({
        success: true,
        message: 'Estudiante creado exitosamente',
        data: estudianteGuardado
      }, { status: 201 });
    } catch (saveError) {
      console.error('Error al guardar estudiante en MongoDB:', saveError);
      return NextResponse.json({
        success: false,
        message: `Error al guardar estudiante: ${saveError.message}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error al crear estudiante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al crear estudiante',
      error: error.message
    }, { status: 500 });
  }
}
