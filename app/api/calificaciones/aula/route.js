import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Asignacion from '@/database/models/Asignacion';
import Estudiante from '@/database/models/Estudiante';
import Usuario from '@/database/models/Usuario';

export async function GET(request) {
    try {
        await connectDB();

        // Obtener la cédula del estudiante de los parámetros de la URL
        const { searchParams } = new URL(request.url);
        const cedula = searchParams.get('cedula');

        if (!cedula) {
            return NextResponse.json({ 
                success: false, 
                message: 'Cédula no proporcionada' 
            }, { status: 400 });
        }

        // Buscar el estudiante por su cédula
        const estudiante = await Estudiante.findOne({ idU: cedula });
        if (!estudiante) {
            return NextResponse.json({ 
                success: false, 
                message: 'Estudiante no encontrado' 
            }, { status: 404 });
        }

        // Buscar todas las aulas que contengan al estudiante
        const aulas = await Aula.find({
            'alumnos._id': estudiante._id
        });

        // Organizar calificaciones por aula
        const calificacionesPorAula = {};

        // Verificar que las aulas tengan la estructura esperada
        if (!Array.isArray(aulas) || aulas.length === 0) {
            return NextResponse.json({
                success: true,
                data: {}
            });
        }

        aulas.forEach(aula => {
            const aulaId = aula._id.toString();
            
            // Inicializar estructura del aula
            if (!calificacionesPorAula[aulaId]) {
                calificacionesPorAula[aulaId] = {
                    nombre: aula.nombre,
                    año: aula.anio,
                    seccion: aula.seccion,
                    momentos: {
                        1: [],
                        2: [],
                        3: []
                    }
                };
            }

            // Verificar que el aula tenga asignaciones
            if (!Array.isArray(aula.asignaciones)) {
                return;
            }

            // Procesar cada asignación del aula
            aula.asignaciones.forEach(asignacion => {
                // Verificar que la asignación tenga actividades
                if (!Array.isArray(asignacion.actividades)) {
                    return;
                }

                // Procesar actividades y sus calificaciones
                asignacion.actividades.forEach(actividad => {
                    // Verificar que la actividad tenga calificaciones
                    if (!Array.isArray(actividad.calificaciones)) {
                        return;
                    }

                    const calificacionEstudiante = actividad.calificaciones.find(
                        cal => cal.alumnoId === estudiante._id.toString()
                    );

                    if (calificacionEstudiante) {
                        const momento = actividad.momento || 1;
                        
                        calificacionesPorAula[aulaId].momentos[momento].push({
                            materia: asignacion.materia.nombre,
                            actividad: actividad.nombre,
                            nota: calificacionEstudiante.nota,
                            notaAlfabetica: calificacionEstudiante.notaAlfabetica,
                            profesor: `${asignacion.profesor.nombre} ${asignacion.profesor.apellido}`,
                            fecha: actividad.fecha,
                            porcentaje: actividad.porcentaje,
                            evidencia: calificacionEstudiante.evidencia || null
                        });
                    }
                });
            });

            // Ordenar calificaciones por fecha dentro de cada momento
            Object.values(calificacionesPorAula[aulaId].momentos).forEach(calificaciones => {
                calificaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            });
        });

        // Convertir el objeto de aulas a un array
        const aulasArray = Object.entries(calificacionesPorAula).map(([id, aula]) => ({
            id,
            ...aula
        }));

        // Ordenar aulas por año
        aulasArray.sort((a, b) => b.año - a.año);

        return NextResponse.json({
            success: true,
            data: aulasArray
        });

    } catch (error) {
        console.error('Error al obtener calificaciones:', error);
        return NextResponse.json({ 
            success: false, 
            message: `Error al obtener calificaciones: ${error.message}`,
            error: error.message
        }, { status: 500 });
    }
}
