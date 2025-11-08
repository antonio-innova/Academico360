import { NextResponse } from 'next/server';
import dbConnection from '../../../../../database/db';
import Aula from '../../../../../database/models/Aula';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const momento = parseInt(searchParams.get('momento'));
    const aulaId = params.aulaId;

    if (!aulaId || !momento) {
      return NextResponse.json(
        { success: false, error: 'Se requiere ID del aula y momento' },
        { status: 400 }
      );
    }

    await dbConnection.connectDB();

    // Obtener el aula con sus materias y estudiantes
    const aula = await Aula.findById(aulaId);

    if (!aula) {
      return NextResponse.json(
        { success: false, error: 'Aula no encontrada' },
        { status: 404 }
      );
    }

    // Preparar datos por estudiante
    const calificacionesPorEstudiante = {};
    
    // Iterar sobre cada alumno
    for (const alumno of aula.alumnos) {
      // Inicializar estructura para el estudiante
      calificacionesPorEstudiante[alumno._id] = {
        nombre: `${alumno.nombre} ${alumno.apellido}`,
        materias: []
      };

      // Procesar cada asignación (materia)
      for (const asignacion of aula.asignaciones) {
        // Calcular promedio para el momento solicitado
        const actividadesMomento = asignacion.actividades.filter(act => act.momento === momento);
        let sumaNotasMomento = 0;
        let cantidadNotasMomento = 0;

        // Calcular promedio del momento actual
        for (const actividad of actividadesMomento) {
          const calificacion = actividad.calificaciones?.find(
            c => c.alumnoId === alumno._id
          );

          if (calificacion) {
            sumaNotasMomento += calificacion.nota;
            cantidadNotasMomento++;
          }
        }

        // Calcular promedio de los otros momentos
        const promediosPorMomento = [1, 2, 3].map(m => {
          const actsMomento = asignacion.actividades.filter(act => act.momento === m);
          let suma = 0;
          let cantidad = 0;

          for (const act of actsMomento) {
            const cal = act.calificaciones?.find(c => c.alumnoId === alumno._id);
            if (cal) {
              suma += cal.nota;
              cantidad++;
            }
          }

          return cantidad > 0 ? (suma / cantidad).toFixed(2) : 'N/A';
        });

        // Calcular promedio final de la materia
        const notasValidas = promediosPorMomento.filter(p => p !== 'N/A').map(Number);
        const promedioFinal = notasValidas.length > 0 ?
          (notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2) :
          'N/A';

        // Agregar la materia con sus promedios
        calificacionesPorEstudiante[alumno._id].materias.push({
          nombre: asignacion.materia.nombre,
          profesor: `${asignacion.profesor.nombre} ${asignacion.profesor.apellido}`,
          promedios: {
            momento1: promediosPorMomento[0],
            momento2: promediosPorMomento[1],
            momento3: promediosPorMomento[2],
            final: promedioFinal
          }
        });
      }

      // Calcular promedio general del estudiante
      const materiasConNotas = calificacionesPorEstudiante[alumno._id].materias
        .filter(m => m.promedios.final !== 'N/A')
        .map(m => Number(m.promedios.final));

      calificacionesPorEstudiante[alumno._id].promedioGeneral = 
        materiasConNotas.length > 0 ?
          (materiasConNotas.reduce((a, b) => a + b, 0) / materiasConNotas.length).toFixed(2) :
          'N/A';
    }

    return NextResponse.json({
      aula: {
        nombre: aula.nombre,
        anio: aula.anio,
        seccion: aula.seccion,
        periodo: aula.periodo
      },
      calificacionesPorEstudiante
    });

  } catch (error) {
    console.error('Error al obtener calificaciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
