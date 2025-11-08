'use client'
import React, { forwardRef, useState, useImperativeHandle } from 'react';
import StudentNameById from './StudentNameById';

// Función para convertir nota numérica a letra
const convertirNotaALetra = (nota) => {
  const notaNum = parseFloat(nota);
  if (isNaN(notaNum)) return 'N/A';
  if (notaNum >= 18) return 'A';
  if (notaNum >= 14) return 'B';
  if (notaNum >= 11) return 'C';
  return 'D';
};
import styles from '../calificaciones/report.module.css';

const ReporteCalificaciones = forwardRef(({ asignacion, actividades, alumnos }, ref) => {
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('');
  const [puntosAdicionales, setPuntosAdicionales] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  // Exponer la función setEstudianteSeleccionado al padre
  useImperativeHandle(ref, () => ({
    setEstudianteSeleccionado
  }));
  
  // Filtrar alumnos basado en la selección
  const alumnosFiltrados = estudianteSeleccionado 
    ? alumnos.filter(alumno => (alumno._id || alumno.id) === estudianteSeleccionado)
    : alumnos;
  // Función para formatear la fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Función para manejar cambios en los puntos adicionales
  const handlePuntosChange = (alumnoId, valor) => {
    const numeroValido = valor === '' ? 0 : Math.min(Math.max(0, parseFloat(valor) || 0), 2);
    setPuntosAdicionales(prev => ({
      ...prev,
      [alumnoId]: numeroValido
    }));
  };

  // Función para guardar los promedios actualizados
  const guardarPromedios = async () => {
    if (!asignacion || !asignacion.aula || !asignacion.materia) {
      setMensaje({ texto: 'No hay información suficiente para guardar los promedios', tipo: 'error' });
      return;
    }

    setGuardando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const promediosActualizados = alumnosFiltrados.map(alumno => {
        // Calcular el promedio original
        let totalNotas = 0;
        let totalActividades = 0;
        
        actividades.forEach(actividad => {
          const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumno.id);
          if (calificacion && !isNaN(parseFloat(calificacion.nota))) {
            totalNotas += parseFloat(calificacion.nota);
            totalActividades++;
          }
        });
        
        const promedioOriginal = totalActividades > 0 ? (totalNotas / totalActividades) : 0;
        const puntosExtra = puntosAdicionales[alumno.id] || 0;
        const promedioFinal = Math.min(20, promedioOriginal + puntosExtra); // No superar 20
        
        return {
          alumnoId: alumno.id,
          aulaId: asignacion.aula.id,
          materiaId: asignacion.materia.id,
          promedioOriginal,
          puntosAdicionales: puntosExtra,
          promedioFinal
        };
      });

      // Enviar los datos al servidor
      const response = await fetch('/api/calificaciones/promedios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promedios: promediosActualizados,
          aulaId: asignacion.aula.id,
          materiaId: asignacion.materia.id
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMensaje({ texto: 'Promedios actualizados correctamente', tipo: 'exito' });
      } else {
        setMensaje({ texto: data.message || 'Error al guardar los promedios', tipo: 'error' });
      }
    } catch (error) {
      console.error('Error al guardar promedios:', error);
      setMensaje({ texto: 'Error al guardar los promedios', tipo: 'error' });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.reportContainer}>
      <div className={styles.reportHeader}>
        <div className={styles.reportHeaderLeft}>
          <h3>Colegio</h3>
          <h4>Acacias</h4>
        </div>
        <div className={styles.reportHeaderCenter}>
          <h3>Curso Académico: {asignacion?.periodo || 'No especificado'}</h3>
          <h4>Programa: {asignacion?.materiaNombre || 'No especificado'}</h4>
        </div>
        <div className={styles.reportHeaderRight}>
          <h3>Nombre del Programa:</h3>
          <h4>{asignacion?.materiaNombre || 'No especificado'}</h4>
        </div>
      </div>
      
      {mensaje.texto && (
        <div className={`${styles.mensaje} ${mensaje.tipo === 'error' ? styles.mensajeError : styles.mensajeExito}`}>
          {mensaje.texto}
        </div>
      )}
      
      <div className={styles.botonesAccion}>
        <button 
          className={styles.botonGuardar} 
          onClick={guardarPromedios} 
          disabled={guardando}
        >
          {guardando ? 'Guardando...' : 'Guardar Promedios'}
        </button>
      </div>
      
      <table className={styles.reportTable}>
        <thead>
          <tr>
            <th>N°</th>
            <th>Nombre y Apellido</th>
            {actividades.map((actividad) => (
              <th key={actividad._id}>{actividad.nombre}</th>
            ))}
            <th>Promedio</th>
            <th>Puntos Extra</th>
            <th>Final</th>
            <th>Nota</th>
          </tr>
        </thead>
        <tbody>
          {alumnosFiltrados.map((alumno, index) => {
            // Calcular el promedio de calificaciones para este alumno
            let totalNotas = 0;
            let totalActividades = 0;
            
            console.log(`
----- Procesando notas para alumno: ${alumno.nombre} (ID: ${alumno.id}) -----`);            
            const notasPorActividad = actividades.map(actividad => {
              console.log(`
Actividad: ${actividad.nombre}`);
              console.log('Calificaciones disponibles:', actividad.calificaciones?.map(c => ({
                alumnoId: c.alumnoId,
                nota: c.nota,
                notaAlfabetica: c.notaAlfabetica,
                tipoCalificacion: c.tipoCalificacion
              })) || 'Sin calificaciones');
              
              const calificacion = actividad.calificaciones?.find(c => c.alumnoId === alumno.id);
              console.log('¿Se encontró calificación?:', calificacion ? 'Sí' : 'No');
              
              if (calificacion) {
                console.log('Nota encontrada:', calificacion.nota);
                // Si es una materia que usa calificación alfabética
                if (asignacion?.materia?.nombre === 'Orientación' || asignacion?.materia?.nombre === 'Grupo y Participación') {
                  // Para materias alfabéticas, usar la nota alfabética directamente o convertir si es numérica
                  if (calificacion.tipoCalificacion === 'alfabetica' && calificacion.notaAlfabetica) {
                    return calificacion.notaAlfabetica;
                  } else {
                    return convertirNotaALetra(calificacion.nota);
                  }
                } else {
                  totalNotas += parseFloat(calificacion.nota);
                  totalActividades++;
                  return calificacion.nota;
                }
              }
              console.log('No se encontró calificación, retornando N/A');
              return 'N/A';
            });
            
            // Calcular el promedio
            console.log(`
Calculando promedio final para ${alumno.nombre}:`);
            
            let promedio = 'N/A';
            
            if (asignacion?.materia?.nombre === 'Orientación' || asignacion?.materia?.nombre === 'Grupo y Participación') {
              // Calcular promedio alfabético
              const notasValidas = notasPorActividad.filter(nota => nota !== 'N/A');
              if (notasValidas.length > 0) {
                const conteoNotas = {
                  'A': 0, 'B': 0, 'C': 0, 'D': 0
                };
                
                notasValidas.forEach(nota => {
                  if (conteoNotas.hasOwnProperty(nota)) {
                    conteoNotas[nota]++;
                  }
                });
                
                // Determinar la nota más frecuente
                let maxCount = 0;
                let notaMasFrecuente = 'D';
                
                for (const [nota, count] of Object.entries(conteoNotas)) {
                  if (count > maxCount || (count === maxCount && nota < notaMasFrecuente)) {
                    maxCount = count;
                    notaMasFrecuente = nota;
                  }
                }
                
                promedio = notaMasFrecuente;
              }
            } else {
              // Calcular promedio numérico
              const promedioNumerico = totalActividades > 0 ? (totalNotas / totalActividades) : null;
              console.log('Promedio numérico:', promedioNumerico);
              
              // Aplicar puntos adicionales si existen
              const puntosExtra = puntosAdicionales[alumno.id] || 0;
              const promedioConPuntos = promedioNumerico !== null ? Math.min(20, promedioNumerico + puntosExtra) : null;
              console.log('Puntos adicionales:', puntosExtra, 'Promedio con puntos:', promedioConPuntos);
              
              promedio = promedioConPuntos !== null ? promedioConPuntos.toFixed(2) : 'N/A';
            }
            
            console.log('Promedio formateado:', promedio);
            console.log('Estado:', promedio !== 'N/A' ? (promedio >= 10 || ['A', 'B', 'C'].includes(promedio) ? 'Aprobado' : 'Reprobado') : 'N/A');
            
            return (
              <tr key={alumno._id || alumno.id}>
                <td>{index + 1}</td>
                <td>
                  <StudentNameById studentId={alumno._id || alumno.id} fallback={alumno} />
                </td>
                {notasPorActividad.map((nota, i) => (
                  <td key={i}>{nota}</td>
                ))}
                <td>{promedio}</td>
                <td>
                  <input 
                    type="number" 
                    min="0" 
                    max="2" 
                    value={puntosAdicionales[alumno.id] === undefined ? '0' : String(puntosAdicionales[alumno.id])} 
                    onChange={(e) => handlePuntosChange(alumno.id, e.target.value)}
                    className={styles.inputPuntos}
                    style={{ width: '50px' }}
                  />
                </td>
                <td style={{ fontWeight: 'bold', color: promedio !== 'N/A' && !isNaN(parseFloat(promedio)) ? (parseFloat(promedio) >= 10 ? '#4CAF50' : '#F44336') : '#757575' }}>
                  {promedio !== 'N/A' && !isNaN(parseFloat(promedio)) ? Math.round(parseFloat(promedio)) : promedio}
                </td>
                <td>{promedio !== 'N/A' ? (parseFloat(promedio) >= 10 ? 'Aprobado' : 'Reprobado') : 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className={styles.reportFooter}>
        <div className={styles.reportSignature}>
          <div className={styles.signatureLine}></div>
          <p>Firma del Profesor: {asignacion?.profesorNombre || 'No especificado'}</p>
        </div>
      </div>
    </div>
  );
});

ReporteCalificaciones.displayName = 'ReporteCalificaciones';

export default ReporteCalificaciones;
