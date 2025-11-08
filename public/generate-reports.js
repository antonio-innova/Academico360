// Script para generar reportes de estudiantes y docentes utilizando xlsx para manipular archivos Excel
const generateReports = async () => {
  try {
    // Cargar la librería xlsx desde CDN
    let XLSX;
    await new Promise((resolve, reject) => {
      // Verificar si ya está cargada
      if (window.XLSX) {
        XLSX = window.XLSX;
        console.log('La librería XLSX ya está cargada');
        resolve();
        return;
      }
      
      console.log('Cargando librería XLSX desde CDN...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => {
        console.log('Librería XLSX cargada correctamente');
        XLSX = window.XLSX;
        resolve();
      };
      script.onerror = (e) => {
        console.error('Error al cargar la librería XLSX:', e);
        reject(e);
      };
      document.head.appendChild(script);
    });
    
    // Función para generar y descargar un reporte utilizando la plantilla Excel
    const generateAndDownloadReport = async (tipoReporte, anio = '') => {
      try {
        console.log(`Generando reporte de tipo: ${tipoReporte} para el año: ${anio || 'Todos'}`);
        
        // Mostrar un indicador de carga
        const loadingDiv = document.createElement('div');
        loadingDiv.style.position = 'fixed';
        loadingDiv.style.top = '0';
        loadingDiv.style.left = '0';
        loadingDiv.style.width = '100%';
        loadingDiv.style.height = '100%';
        loadingDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loadingDiv.style.display = 'flex';
        loadingDiv.style.justifyContent = 'center';
        loadingDiv.style.alignItems = 'center';
        loadingDiv.style.zIndex = '9999';
        
        const loadingContent = document.createElement('div');
        loadingContent.style.backgroundColor = 'white';
        loadingContent.style.padding = '20px';
        loadingContent.style.borderRadius = '10px';
        loadingContent.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        loadingContent.innerHTML = `
          <h3 style="margin-bottom: 10px; color: #3b82f6;">Generando reporte...</h3>
          <p style="margin-bottom: 15px;">Esto puede tardar unos momentos, por favor espere.</p>
          <div style="width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
            <div id="progress-bar" style="width: 0%; height: 100%; background-color: #3b82f6; transition: width 0.3s;"></div>
          </div>
        `;
        
        loadingDiv.appendChild(loadingContent);
        document.body.appendChild(loadingDiv);
        
        // Función para actualizar la barra de progreso
        const updateProgress = (percent) => {
          const progressBar = document.getElementById('progress-bar');
          if (progressBar) {
            progressBar.style.width = `${percent}%`;
          }
        };
        
        updateProgress(10); // Inicio
        
        // Construir los parámetros de filtrado
        const params = new URLSearchParams();
        params.append('tipoReporte', tipoReporte);
        if (anio) {
          params.append('anio', anio);
        }
        
        // Realizar la petición al endpoint para obtener los datos
        const response = await fetch(`/api/reportes/estudiantes?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Error al obtener datos para el reporte: ${response.statusText}`);
        }
        
        updateProgress(30); // Datos obtenidos
        
        // Obtener los datos en formato JSON
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Error al obtener datos para el reporte');
        }
        
        console.log('Datos recibidos para el reporte:', data);
        updateProgress(40); // Datos procesados
        
        // Obtener la plantilla Excel original desde el nuevo endpoint
        const templateResponse = await fetch('/api/plantilla-original');
        if (!templateResponse.ok) {
          throw new Error(`Error al cargar la plantilla Excel: ${templateResponse.statusText}`);
        }
        
        const templateArrayBuffer = await templateResponse.arrayBuffer();
        updateProgress(50); // Plantilla cargada
        
        // Cargar la plantilla con xlsx
        const workbook = XLSX.read(new Uint8Array(templateArrayBuffer), { type: 'array' });
        
        // Obtener la primera hoja (o la hoja específica que necesites)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        updateProgress(60); // Plantilla procesada
        
        // Llenar los datos en la plantilla según las instrucciones
        // Empezamos desde la fila 17 hasta la 51
        const estudiantes = data.data || [];
        const startRow = 17;
        const maxRows = Math.min(estudiantes.length, 35); // Máximo 35 estudiantes (hasta fila 51)
        
        for (let i = 0; i < maxRows; i++) {
          const estudiante = estudiantes[i];
          const row = startRow + i;
          
          // Mapeo de columnas según las instrucciones
          // B-N: Cédula
          const cedula = estudiante.cedula || estudiante.idU || '';
          XLSX.utils.sheet_add_aoa(worksheet, [[cedula]], { origin: { r: row - 1, c: 1 } }); // B (columna 1, 0-indexed)
          
          // O-V: Apellido
          const apellido = estudiante.apellido || '';
          XLSX.utils.sheet_add_aoa(worksheet, [[apellido]], { origin: { r: row - 1, c: 14 } }); // O (columna 14, 0-indexed)
          
          // X-AH: Nombre
          const nombre = estudiante.nombre || '';
          XLSX.utils.sheet_add_aoa(worksheet, [[nombre]], { origin: { r: row - 1, c: 23 } }); // X (columna 23, 0-indexed)
          
          // AI-AO: Lugar de nacimiento
          const lugarNacimiento = estudiante.lugarNacimiento || '';
          XLSX.utils.sheet_add_aoa(worksheet, [[lugarNacimiento]], { origin: { r: row - 1, c: 34 } }); // AI (columna 34, 0-indexed)
          
          // AP: EF
          const ef = estudiante.ef || '';
          XLSX.utils.sheet_add_aoa(worksheet, [[ef]], { origin: { r: row - 1, c: 41 } }); // AP (columna 41, 0-indexed)
          
          // AQ: Sexo
          const sexo = estudiante.sexo || '';
          XLSX.utils.sheet_add_aoa(worksheet, [[sexo]], { origin: { r: row - 1, c: 42 } }); // AQ (columna 42, 0-indexed)
          
          // Fecha de nacimiento (AR-AS: Día, AT-AU: Mes, AV-AW: Año)
          if (estudiante.fechaNacimiento) {
            const fecha = new Date(estudiante.fechaNacimiento);
            const dia = fecha.getDate();
            const mes = fecha.getMonth() + 1; // Meses son 0-indexed
            const anio = fecha.getFullYear();
            
            // AR-AS: Día
            XLSX.utils.sheet_add_aoa(worksheet, [[dia]], { origin: { r: row - 1, c: 43 } }); // AR (columna 43, 0-indexed)
            
            // AT-AU: Mes
            XLSX.utils.sheet_add_aoa(worksheet, [[mes]], { origin: { r: row - 1, c: 45 } }); // AT (columna 45, 0-indexed)
            
            // AV-AW: Año
            XLSX.utils.sheet_add_aoa(worksheet, [[anio]], { origin: { r: row - 1, c: 47 } }); // AV (columna 47, 0-indexed)
          }
          
          // Notas de las materias (de dos en dos)
          // Necesitamos mapear las materias con sus columnas correspondientes
          if (estudiante.asignaciones && Array.isArray(estudiante.asignaciones)) {
            estudiante.asignaciones.forEach(asignacion => {
              // Buscar la columna correspondiente a la materia
              const materiaNombre = asignacion.materiaNombre || '';
              let columnaMateria = null;
              
              // Mapeo de materias a columnas (esto debe ajustarse según las materias específicas)
              const mapeoMaterias = {
                'Matemáticas': 49, // AX (columna 49, 0-indexed)
                'Lenguaje': 51,   // AZ (columna 51, 0-indexed)
                'Ciencias': 53,   // BB (columna 53, 0-indexed)
                'Historia': 55,   // BD (columna 55, 0-indexed)
                'Inglés': 57,     // BF (columna 57, 0-indexed)
                'Educación Física': 59, // BH (columna 59, 0-indexed)
                'Arte': 61,       // BJ (columna 61, 0-indexed)
                // Añadir más materias según sea necesario
              };
              
              // Buscar la materia en el mapeo (búsqueda parcial)
              for (const [key, value] of Object.entries(mapeoMaterias)) {
                if (materiaNombre.toLowerCase().includes(key.toLowerCase())) {
                  columnaMateria = value;
                  break;
                }
              }
              
              // Si encontramos la columna, añadir la nota
              if (columnaMateria !== null) {
                const nota = asignacion.calificacion || '';
                XLSX.utils.sheet_add_aoa(worksheet, [[nota]], { origin: { r: row - 1, c: columnaMateria } });
              }
            });
          }
          
          // BL: Nota para OC
          const notaOC = estudiante.notaOC || '';
          XLSX.utils.sheet_add_aoa(worksheet, [[notaOC]], { origin: { r: row - 1, c: 63 } }); // BL (columna 63, 0-indexed)
          
          // BM: Otra nota
          const otraNota = estudiante.otraNota || '';
          XLSX.utils.sheet_add_aoa(worksheet, [[otraNota]], { origin: { r: row - 1, c: 64 } }); // BM (columna 64, 0-indexed)
          
          // BN-BP: Grupo
          const grupo = estudiante.grupo || estudiante.anio || '';
          XLSX.utils.sheet_add_aoa(worksheet, [[grupo]], { origin: { r: row - 1, c: 65 } }); // BN (columna 65, 0-indexed)
        }
        
        updateProgress(80); // Datos insertados
        
        // Convertir el libro de trabajo a un blob manteniendo el formato original
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true, compression: true });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        updateProgress(90); // Excel generado
        
        // Crear URL para descargar
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Nombre del archivo según el tipo de reporte
        let fileName = '';
        const fechaActual = new Date().toISOString().split('T')[0];
        switch (tipoReporte) {
          case 'todosEstudiantes':
            fileName = `Reporte_Estudiantes_${fechaActual}.xlsx`;
            break;
          case 'todosDocentes':
            fileName = `Reporte_Docentes_${fechaActual}.xlsx`;
            break;
          default:
            fileName = `Reporte_${fechaActual}.xlsx`;
        }
        
        if (anio) {
          fileName = `Reporte_${anio.replace(' ', '_')}_${fechaActual}.xlsx`;
        }
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        updateProgress(100); // Completado
        
        // Eliminar el indicador de carga después de un breve retraso
        setTimeout(() => {
          document.body.removeChild(loadingDiv);
        }, 1000);
        
        console.log(`Reporte de ${tipoReporte} generado con éxito`);
        return `Reporte de ${tipoReporte} generado con éxito`;
      } catch (error) {
        console.error('Error al generar reporte Excel:', error);
        
        // Mostrar mensaje de error al usuario
        alert(`Error al generar reporte: ${error.message}`);
        
        // Eliminar el indicador de carga si existe
        const loadingDiv = document.querySelector('div[style*="position: fixed"][style*="zIndex: 9999"]');
        if (loadingDiv) {
          document.body.removeChild(loadingDiv);
        }
        
        return `Error al generar reporte: ${error.message}`;
      }
    };
    
    // Generar reporte de todos los estudiantes
    const generateStudentReport = async (anio = '') => {
      return await generateAndDownloadReport('todosEstudiantes', anio);
    };
    
    // Generar reporte de todos los docentes
    const generateTeacherReport = async () => {
      return await generateAndDownloadReport('todosDocentes');
    };
    
    // Exponer funciones al objeto window para poder llamarlas desde la consola
    window.generateStudentReport = generateStudentReport;
    window.generateTeacherReport = generateTeacherReport;
    
    console.log('Funciones de generación de reportes cargadas. Usa window.generateStudentReport() o window.generateTeacherReport() para generar los reportes.');
  } catch (error) {
    console.error('Error al inicializar generador de reportes:', error);
  }
};

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', generateReports);
} else {
  generateReports();
}
