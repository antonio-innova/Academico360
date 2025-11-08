import { NextResponse } from 'next/server';
import { connectDB } from '../../../../database/db';
import Estudiante from '../../../../database/models/Estudiante';
import Asignacion from '../../../../database/models/Asignacion';

// GET - Obtener un estudiante específico por ID
export async function GET(request, context) {
  try {
    await connectDB();

    const { id } = await context.params;
    
    // Buscar el estudiante por ID
    const estudiante = await Estudiante.findById(id);
    
    if (!estudiante) {
      return NextResponse.json({
        success: false,
        message: 'Estudiante no encontrado'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Estudiante encontrado',
      data: estudiante
    }, { status: 200 });

  } catch (error) {
    console.error('Error al obtener estudiante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al obtener estudiante',
      error: error.message
    }, { status: 500 });
  }
}

// PUT - Actualizar un estudiante existente
export async function PUT(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.nombre) {
      return NextResponse.json({
        success: false,
        message: 'Falta el campo nombre que es obligatorio'
      }, { status: 400 });
    }
    
    // Crear un objeto de actualización explícito
    const updateData = {};
    
    // Actualizar campos básicos si se proporcionan
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.apellido !== undefined) updateData.apellido = data.apellido;
    if (data.fechaNacimiento) updateData.fechaNacimiento = data.fechaNacimiento;
    if (data.lugarNacimiento !== undefined) updateData.lugarNacimiento = data.lugarNacimiento;
    if (data.sexo !== undefined) updateData.sexo = data.sexo;
    if (data.ef !== undefined) updateData.ef = data.ef;
    if (data.edad !== undefined) updateData.edad = parseInt(data.edad);
    if (data.esMenorDeEdad !== undefined) updateData.esMenorDeEdad = data.esMenorDeEdad;
    if (data.grupo !== undefined) updateData.grupo = data.grupo;
    if (data.anio !== undefined) updateData.anio = data.anio;
    if (data.seccion !== undefined) updateData.seccion = data.seccion;
    
    // Actualizar datos del representante si se proporcionan
    if (data.representante) {
      updateData.representante = {
        nombre: data.representante.nombre || '',
        apellido: data.representante.apellido || '',
        cedula: data.representante.cedula || '',
        correo: data.representante.correo || '',
        telefono: data.representante.telefono || '',
        parentesco: data.representante.parentesco || 'Padre'
      };
    }
    
    // Actualizar cédula si se proporciona
    if (data.idU && data.idU.trim() !== '') {
      updateData.idU = data.idU;
    } else if (data.cedula && data.cedula.trim() !== '') {
      updateData.idU = data.cedula;
    }
    
    // Si se proporciona la institución, actualizar el ID del estudiante según la institución
    if (data.institucion) {
      const estudiante = await Estudiante.findById(id);
      if (!estudiante) {
        return NextResponse.json({
          success: false,
          message: 'Estudiante no encontrado'
        }, { status: 404 });
      }

      // Verificar el tipo de usuario para asignar el ID correcto
      if (data.userType === 'control' || estudiante.tipoCreador === 'control') {
        if (data.institucion === 'Acacias') {
          if (!estudiante.idAA || !estudiante.idAA.startsWith('AA')) {
            updateData.idAA = `AA${Date.now()}`;
          }
        } else if (data.institucion === 'IUTCM') {
          if (!estudiante.idIA || !estudiante.idIA.startsWith('IA')) {
            updateData.idIA = `IA${Date.now()}`;
          }
        }
      } else if (data.userType === 'docente' || estudiante.tipoCreador === 'docente') {
        if (data.institucion === 'Acacias') {
          if (!estudiante.idAM || !estudiante.idAM.startsWith('AM')) {
            updateData.idAM = `AM${Date.now()}`;
          }
        } else if (data.institucion === 'IUTCM') {
          if (!estudiante.idIM || !estudiante.idIM.startsWith('IM')) {
            updateData.idIM = `IM${Date.now()}`;
          }
        }
      }
    }
    
    // Actualizar el estudiante usando findByIdAndUpdate
    const estudianteActualizado = await Estudiante.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!estudianteActualizado) {
      return NextResponse.json({
        success: false,
        message: 'Estudiante no encontrado'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Estudiante actualizado correctamente',
      data: estudianteActualizado
    });

  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar estudiante',
      error: error.message
    }, { status: 500 });
  }
}

// PATCH - Actualizar estado del estudiante
export async function PATCH(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;
    const data = await request.json();

    if (data.estado === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Se requiere el campo estado'
      }, { status: 400 });
    }

    const estudiante = await Estudiante.findById(id);
    if (!estudiante) {
      return NextResponse.json({
        success: false,
        message: 'Estudiante no encontrado'
      }, { status: 404 });
    }

    estudiante.estado = data.estado;
    await estudiante.save();

    return NextResponse.json({
      success: true,
      message: 'Estado del estudiante actualizado correctamente',
      data: estudiante
    });

  } catch (error) {
    console.error('Error al actualizar estado del estudiante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al actualizar estado del estudiante',
      error: error.message
    }, { status: 500 });
  }
}

// DELETE - Eliminar un estudiante
export async function DELETE(request, context) {
  try {
    await connectDB();
    const { id } = await context.params;

    // Buscar y eliminar el estudiante
    const estudiante = await Estudiante.findByIdAndDelete(id);

    if (!estudiante) {
      return NextResponse.json({
        success: false,
        message: 'Estudiante no encontrado'
      }, { status: 404 });
    }

    // Eliminar las asignaciones relacionadas
    await Asignacion.deleteMany({ estudiante: id });

    return NextResponse.json({
      success: true,
      message: 'Estudiante y sus asignaciones eliminados correctamente'
    });

  } catch (error) {
    console.error('Error al eliminar estudiante:', error);
    return NextResponse.json({
      success: false,
      message: 'Error al eliminar estudiante',
      error: error.message
    }, { status: 500 });
  }
}
