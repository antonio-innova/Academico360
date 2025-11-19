import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Estudiante from '@/database/models/Estudiante';
import NotaCertificada from '@/database/models/NotaCertificada';

const debugLogNotasPayload = (context, data) => {
  try {
    console.group(`[NotasCertificadas][${context}]`);
    console.log('📌 Payload completo recibido:', JSON.stringify(data, null, 2));
    console.log('🏫 Institución:', JSON.stringify(data?.institucion || {}, null, 2));
    console.log('🧑‍🎓 Estudiante:', JSON.stringify(data?.estudiante || {}, null, 2));
    if (Array.isArray(data?.planEstudio)) {
      data.planEstudio.forEach((anio, idx) => {
        console.log(`📚 Año #${idx + 1} (grado ${anio?.grado}):`, JSON.stringify(anio?.materias || [], null, 2));
      });
    } else {
      console.log('📚 planEstudio no es un arreglo válido:', data?.planEstudio);
    }
    console.groupEnd();
  } catch (error) {
    console.warn('[NotasCertificadas] Error al imprimir payload:', error);
  }
};

// Genera un Excel rellenando la plantilla ubicada en public/notascertificadas
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      estudiante = {},
      institucion = {},
      planEstudio = [],
      metadata = {}
    } = body || {};

    debugLogNotasPayload('Excel 1-3 años', body);

    // Si no hay planteles en los datos recibidos, intentar obtenerlos desde la BD
    if ((!institucion.planteles || institucion.planteles.length === 0) && estudiante?.cedula) {
      try {
        await connectDB();
        const notaDoc = await NotaCertificada.findOne({ 'estudiante.cedula': estudiante.cedula })
          .sort({ fechaCreacion: -1 })
          .lean();
        
        if (notaDoc?.institucion?.planteles?.length) {
          console.log('🔍 Obteniendo planteles desde BD:', notaDoc.institucion.planteles);
          institucion.planteles = notaDoc.institucion.planteles;
          console.log('✅ Planteles cargados desde BD:', institucion.planteles);
        }
      } catch (error) {
        console.error('Error al obtener planteles desde BD:', error);
      }
    }

    // Cargar plantilla
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'notascertificadas.xlsx'),
      path.join(process.cwd(), 'public', 'notascertificadas', 'notascertificadas.xlsx')
    ];
    const templatePath = candidatePaths.find(p => fs.existsSync(p));
    if (!templatePath) {
      return NextResponse.json({ success: false, message: 'Plantilla no encontrada. Colócala en public/notascertificadas.xlsx o public/notascertificadas/notascertificadas.xlsx' }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const ws = workbook.worksheets[0];

    // ======== CONFIGURACIÓN EDITABLE ========
    const HEADER_CELLS = {
      cedula: 'F9',
      apellidos: 'D10',
      nombres: 'O10',
      fechaNacimiento: 'K9',
      lugarNacimiento: 'C11',
      pais: 'I11',
      estado: 'P11',
      municipio: 'T11',
    };

    // Filas base de cada año (confirmado): 20, 30 y 40
    const SUBJECT_START_ROWS = [20, 30, 40];
    // Buscar dinámicamente la fila exacta donde está "Castellano" cerca de cada base
    const normalize = (v) => (v ? String(v).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '') : '');
    const findStartNear = (base) => {
      const search = [base - 2, base - 1, base, base + 1, base + 2, base + 3, base + 4];
      for (const r of search) {
        const val = getCellText(ws.getCell(r, SUBJECT_COLS.nombre));
        if (normalize(val).includes('castellano')) return r;
      }
      return base; // fallback
    };
    const SUBJECT_ROW_COUNT = [7, 7, 9];
    
    const SUBJECT_COLS = {
      nombre: 2,  // B
      numero: 5,  // E (N°)
      letras: 6,  // F (LETRAS)
      te: 8,      // H (T-E)
      mes: 9,     // I (Mes)
      anio: 10,   // J (Año)
      plantel: 11 // K (PLANTEL)
    };

    const getCellText = (cell) => {
      const v = cell?.value;
      if (v && typeof v === 'object') {
        if (Array.isArray(v.richText)) return v.richText.map(t => t.text).join('');
        return v.result || v.text || '';
      }
      return v || '';
    };

    const put = (addr, value) => {
      if (value === undefined || value === null || value === '') return;
      ws.getCell(addr).value = value;
    };

    const putRightOfLabel = (label, value, offsetCols = 1) => {
      if (value === undefined || value === null || value === '') return;
      const labelLower = String(label).toLowerCase();
      for (const row of ws._rows) {
        if (!row) continue;
        for (const cell of row._cells) {
          if (!cell) continue;
          const v = cell.value && (typeof cell.value === 'object' ? cell.value.richText ? cell.value.richText.map(t=>t.text).join('') : cell.value.result || cell.value.text || cell.value : cell.value);
          if (!v) continue;
          if (String(v).toLowerCase().includes(labelLower)) {
            const target = ws.getCell(cell.row, cell.col + offsetCols);
            target.value = value;
            return;
          }
        }
      }
    };

    // Completar datos del estudiante desde BD si solo llega cédula
    let estDoc = null;
    let notaFromCert = null;
    if (estudiante?.cedula) {
      try {
        await connectDB();
        estDoc = await Estudiante.findOne({ idU: estudiante.cedula }).lean();
        notaFromCert = await NotaCertificada.findOne({ 'estudiante.cedula': estudiante.cedula })
          .sort({ fechaCreacion: -1 })
          .lean();
      } catch {}
    }

    const formatDate = (d) => {
      try {
        if (!d) return '';
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return String(d);
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yyyy = String(dt.getFullYear());
        return `${dd}/${mm}/${yyyy}`;
      } catch { return String(d); }
    };

    // Datos del estudiante
    const notaEst = notaFromCert?.estudiante || {};
    const baseLugar = notaEst.lugarNacimiento || estDoc?.lugarNacimiento || estudiante.lugarNacimiento || '';
    const baseEF = notaEst.identidadFederal || estDoc?.ef || estudiante.identidadFederal || '';
    
    const studentOut = {
      cedula: estudiante.cedula || notaEst.cedula || estDoc?.idU || '',
      apellidos: notaEst.apellidos || estDoc?.apellido || estudiante.apellidos || '',
      nombres: notaEst.nombres || estDoc?.nombre || estudiante.nombres || '',
      fechaNacimiento: notaEst.fechaNacimiento || formatDate(estDoc?.fechaNacimiento) || estudiante.fechaNacimiento || '',
      pais: estudiante.pais || notaEst.pais || 'VENEZUELA',
      estado: estudiante.estado || notaEst.estado || baseEF,
      municipio: estudiante.municipio || notaEst.municipio || baseLugar,
      identidadFederal: baseEF
    };

    // Escribir datos del estudiante
    HEADER_CELLS.cedula ? put(HEADER_CELLS.cedula, studentOut.cedula) : putRightOfLabel('Cédula de Identidad', studentOut.cedula);
    HEADER_CELLS.apellidos ? put(HEADER_CELLS.apellidos, studentOut.apellidos) : putRightOfLabel('Apellidos', studentOut.apellidos);
    HEADER_CELLS.nombres ? put(HEADER_CELLS.nombres, studentOut.nombres) : putRightOfLabel('Nombres', studentOut.nombres, 2);
    HEADER_CELLS.fechaNacimiento ? put(HEADER_CELLS.fechaNacimiento, studentOut.fechaNacimiento) : putRightOfLabel('Fecha de Nacimiento', studentOut.fechaNacimiento);
    
    // País, Estado, Municipio
    if (HEADER_CELLS.pais) ws.getCell(HEADER_CELLS.pais).value = studentOut.pais || '';
    else putRightOfLabel('País', studentOut.pais || '');
    if (HEADER_CELLS.estado) ws.getCell(HEADER_CELLS.estado).value = studentOut.estado || '';
    else putRightOfLabel('Estado', studentOut.estado || '');
    if (HEADER_CELLS.municipio) ws.getCell(HEADER_CELLS.municipio).value = studentOut.municipio || '';
    else putRightOfLabel('Municipio', studentOut.municipio || '');

    // Lugar y Fecha de Expedición en Q3 (fecha actual)
    try {
      const dt = new Date();
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = String(dt.getFullYear());
      ws.getCell(3, 17).value = `${dd}/${mm}/${yyyy}`; // Q3
    } catch {}

    // Sección IV: Planteles donde cursó estudios
    try {
      const planteles = Array.isArray(institucion.planteles) ? institucion.planteles : [];
      console.log('=== DEBUGGING PLANTELES ===');
      console.log('institucion completa:', institucion);
      console.log('planteles array:', planteles);
      console.log('planteles length:', planteles.length);
      
      if (planteles.length) {
        console.log('Escribiendo planteles en Excel...');
        // Primeros 2 planteles: filas 14 y 15, columnas D (institución), G (localidad), K (E.F.)
        for (let i = 0; i < Math.min(planteles.length, 2); i++) {
          const p = planteles[i] || {};
          const row = 14 + i; // 14,15
          ws.getCell(row, 4).value = p.nombre || '';
          ws.getCell(row, 7).value = p.localidad || '';
          ws.getCell(row, 11).value = p.ef || '';
        }
        // Del 3º al 5º: filas 13–15, columnas O (institución), R (localidad), V (E.F.)
        for (let i = 2; i < Math.min(planteles.length, 5); i++) {
          const p = planteles[i] || {};
          const row = 13 + (i - 2); // 13,14,15
          ws.getCell(row, 15).value = p.nombre || '';
          ws.getCell(row, 18).value = p.localidad || '';
          ws.getCell(row, 22).value = p.ef || '';
        }
        // Rellenar con **** los faltantes
        const leftRows = [14, 15];
        for (let i = planteles.length; i < 2; i++) {
          const r = leftRows[i];
          ws.getCell(r, 4).value = '****';
          ws.getCell(r, 7).value = '****';
          ws.getCell(r, 11).value = '****';
        }
        const rightRows = [13, 14, 15];
        for (let i = 2; i < 5; i++) {
          if (i >= planteles.length) {
            const r = rightRows[i - 2];
            ws.getCell(r, 15).value = '****';
            ws.getCell(r, 18).value = '****';
            ws.getCell(r, 22).value = '****';
          }
        }
        console.log('=== FIN ESCRITURA PLANTELES ===');
      } else {
        console.log('❌ No hay planteles para escribir');
      }
    } catch (error) {
      console.error('❌ Error al escribir planteles:', error);
    }

    const writeRow = (row, values) => {
      let [nombre, numero, letras, te, mes, anio, plantel] = values;
      const nombreNorm = String(nombre||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      const isEspecial = nombreNorm.includes('orientacion') || nombreNorm.includes('grupo y participacion');
      
      ws.getCell(row, SUBJECT_COLS.nombre).value = nombre;
      ws.getCell(row, SUBJECT_COLS.numero).value = isEspecial ? '' : numero;
      ws.getCell(row, SUBJECT_COLS.letras).value = letras;
      ws.getCell(row, SUBJECT_COLS.te).value = te;
      ws.getCell(row, SUBJECT_COLS.mes).value = mes;
      ws.getCell(row, SUBJECT_COLS.anio).value = anio;
      ws.getCell(row, SUBJECT_COLS.plantel).value = plantel || '';
    };

    const removeAccents = (s = '') => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const EXCLUDED = new Set(['orientacion', 'grupo y participacion']);

    const numToLetras = (n) => {
      const mapa = {1:'Uno',2:'Dos',3:'Tres',4:'Cuatro',5:'Cinco',6:'Seis',7:'Siete',8:'Ocho',9:'Nueve',10:'Diez',11:'Once',12:'Doce',13:'Trece',14:'Catorce',15:'Quince',16:'Dieciséis',17:'Diecisiete',18:'Dieciocho',19:'Diecinueve',20:'Veinte'};
      const v = Math.max(1, Math.min(20, Math.round(Number(n)||1)));
      return mapa[v];
    };

    // Si no viene planEstudio o viene sin números, intentar poblar desde BD
    const planSinNumeros = Array.isArray(planEstudio) && planEstudio.length > 0
      ? planEstudio.every(a => Array.isArray(a.materias) && a.materias.every(m => !m?.numero))
      : true;
    
    let computedPlan = [];
    if (planSinNumeros && estudiante?.cedula) {
      try {
        await connectDB();
        const est = await Estudiante.findOne({ idU: estudiante.cedula });

        // Priorizar colección notacertificadas
        const notaDoc = await NotaCertificada.findOne({ 'estudiante.cedula': estudiante.cedula })
          .sort({ fechaCreacion: -1 })
          .lean();
        if (notaDoc?.planEstudio?.length) {
          computedPlan = notaDoc.planEstudio.map(anio => ({
            grado: anio.grado,
            materias: (anio.materias || [])
              .map(m => ({
                nombre: m.nombre,
                numero: String(m.numero ?? '').padStart(2, '0'),
                letras: m.letras || '',
                te: m.te || 'F',
                fechaMes: m.fechaMes || '',
                fechaAnio: m.fechaAnio || '',
                plantelNumero: m.plantelNumero || '',
                grupo: m.grupo || ''
              }))
          })).filter(x => x.materias.length > 0);
        }

        // Si no hay en notacertificadas, calcular desde aulas/asignaciones
        if (!computedPlan.length && est) {
          const aulas = await Aula.find({ 'alumnos._id': est._id }).lean();
          const SUBJECT_PRIORITY = [
            'castellano',
            'ingles y otras lenguas extranjeras',
            'matematicas',
            'educacion fisica',
            'arte y patrimonio',
            'ciencias naturales',
            'fisica',
            'quimica',
            'biologia',
            'ciencias de la tierra',
            'geografia, historia y ciudadania',
            'formacion para la soberania nacional'
          ];
          const priorityIndex = (name) => {
            const idx = SUBJECT_PRIORITY.indexOf(removeAccents(name||''));
            return idx === -1 ? 999 : idx;
          };

          const byYear = {};
          for (const aula of aulas) {
            const year = String(aula.anio || '');
            if (!byYear[year]) byYear[year] = {};
            const asigs = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];
            for (const asignacion of asigs) {
              
              const nombreMateria = asignacion?.materia?.nombre || asignacion?.materiaNombre || '';
              const norm = removeAccents(nombreMateria);
              if (EXCLUDED.has(norm)) continue;
              const acts = Array.isArray(asignacion.actividades) ? asignacion.actividades : [];
              let suma = 0, count = 0;
              for (const act of acts) {
                const cal = (act.calificaciones||[]).find(c => String(c.alumnoId) === String(est._id) || String(c.alumnoId) === String(est._id?._id));
                if (cal && typeof cal.nota === 'number') {
                  suma += cal.nota;
                  count++;
                }
              }
              if (count > 0) {
                const promedio = Math.max(1, Math.min(20, Math.round(suma / count)));
                byYear[year][nombreMateria] = promedio;
              }
            }
          }

          computedPlan = ['1','2','3'].map(grado => ({
            grado,
            materias: Object.entries(byYear[grado]||{})
              .sort((a,b)=> priorityIndex(a[0]) - priorityIndex(b[0]))
              .map(([nombre, numero]) => ({ nombre, numero: String(numero).padStart(2,'0'), letras: numToLetras(numero), te: 'F', fechaMes: '', fechaAnio: '', plantelNumero: '' }))
          })).filter(x => x.materias.length > 0);
        }
      } catch (e) {
        // Si falla, continuar con lo que venga del cliente
      }
    }

    const planToUse = (planSinNumeros && computedPlan.length > 0) ? computedPlan
      : ((Array.isArray(planEstudio) && planEstudio.length > 0) ? planEstudio : computedPlan);

    console.log('Plan de estudio a procesar:', JSON.stringify(planToUse, null, 2));

    // Escribir cada año en su posición correspondiente (mapeando por grado 1->primer año, 2->segundo, 3->tercero)
    (planToUse || []).forEach((anio) => {
      const gradoNum = Math.max(1, Math.min(3, Number(anio?.grado || 0)));
      const idx = gradoNum - 1; // 0,1,2
      const startRow = findStartNear(SUBJECT_START_ROWS[idx] || SUBJECT_START_ROWS[0]);
      const rowCount = SUBJECT_ROW_COUNT[idx] || SUBJECT_ROW_COUNT[0];
      
      // Limpiar previamente el rango de la tabla
      for (let i = 0; i < rowCount; i++) {
        writeRow(startRow + i, ['', '', '', '', '', '', '']);
      }
      
      // Escribir materias filtradas
      const materiasFiltradas = (anio.materias || [])
        .filter(m => !EXCLUDED.has(removeAccents(m.nombre || '')))
        .slice(0, rowCount);
      
      materiasFiltradas.forEach((m, mIdx) => {
        writeRow(startRow + mIdx, [
          m.nombre || '', 
          m.numero || '', 
          m.letras || '', 
          m.te || '', 
          m.fechaMes || '', 
          m.fechaAnio || '',
          m.plantelNumero || ''
        ]);
      });

      // Fallback: si por alguna razón la primera fila quedó vacía, forzar escritura en base fija
      const firstNameCell = getCellText(ws.getCell(startRow, SUBJECT_COLS.nombre));
      if (!String(firstNameCell || '').trim() && materiasFiltradas.length) {
        const fixedStart = SUBJECT_START_ROWS[idx] || startRow;
        materiasFiltradas.forEach((m, mIdx) => {
          writeRow(fixedStart + mIdx, [
            m.nombre || '',
            m.numero || '',
            m.letras || '',
            m.te || '',
            m.fechaMes || '',
            m.fechaAnio || '',
            m.plantelNumero || ''
          ]);
        });
      }
    });

    // Escribir notas de Orientación y Grupo y Participación en la tabla específica
    try {
      console.log('=== ESCRIBIENDO ORIENTACIÓN Y GRUPO Y PARTICIPACIÓN ===');
      
      // Buscar la tabla de Orientación y Grupo y Participación
      let orientacionTableStart = null;
      let grupoTableStart = null;
      
      // Buscar dinámicamente las filas donde están estas tablas
      for (let row = 1; row <= 100; row++) {
        const cellText = getCellText(ws.getCell(row, 1)).toLowerCase();
        if (cellText.includes('orientación') || cellText.includes('orientacion')) {
          orientacionTableStart = row;
          console.log(`Encontrada tabla Orientación en fila ${row}`);
        }
        if (cellText.includes('participación') || cellText.includes('participacion')) {
          grupoTableStart = row;
          console.log(`Encontrada tabla Participación en fila ${row}`);
        }
      }
      
      // Si no se encuentran dinámicamente, usar posiciones fijas estimadas
      // Basándome en la estructura del Excel: Orientación en filas ~48-50, Participación en filas ~53-55
      if (!orientacionTableStart) orientacionTableStart = 50; // Fila base para Orientación (1°, 2°, 3°)
      if (!grupoTableStart) grupoTableStart = 54; // Fila base para Participación (1°, 2°, 3°)
      
      console.log(`Usando posiciones: Orientación desde fila ${orientacionTableStart}, Participación desde fila ${grupoTableStart}`);
      
      // Procesar cada año del plan de estudio
      console.log('Plan de estudio completo a procesar:', JSON.stringify(planToUse, null, 2));
      
      // Debug: Mostrar todas las materias de todos los grados
      console.log('\n=== DEBUG: TODAS LAS MATERIAS DE TODOS LOS GRADOS ===');
      (planToUse || []).forEach((anio, index) => {
        console.log(`Grado ${anio.grado} (índice ${index}):`, anio.materias?.map(m => m.nombre) || 'Sin materias');
      });
      console.log('=== FIN DEBUG ===\n');
      
      // Buscar Orientación y Grupo y Participación en TODOS los grados
      let orientacionEncontrada = null;
      let grupoParticipacionEncontrado = null;
      
      console.log('\n=== BUSCANDO MATERIAS ESPECIALES EN TODOS LOS GRADOS ===');
      
      for (const anio of planToUse || []) {
        const gradoNum = Number(anio?.grado || 1);
        const materias = anio.materias || [];
        
        console.log(`\n--- Revisando Grado ${gradoNum} ---`);
        console.log('Materias:', materias.map(m => m.nombre));
        
        // Buscar Orientación si no se ha encontrado
        if (!orientacionEncontrada) {
          orientacionEncontrada = materias.find(m => {
            const nombreNorm = removeAccents(m.nombre || '').toLowerCase();
            console.log(`Buscando Orientación en: "${m.nombre}" -> "${nombreNorm}"`);
            return nombreNorm.includes('orientacion') || nombreNorm.includes('orientación') || 
                   nombreNorm === 'orientacion' || nombreNorm === 'orientación';
          });
          
          if (orientacionEncontrada) {
            console.log(`✅ Orientación encontrada en Grado ${gradoNum}:`, orientacionEncontrada.nombre);
          }
        }
        
        // Buscar Grupo y Participación si no se ha encontrado
        if (!grupoParticipacionEncontrado) {
          grupoParticipacionEncontrado = materias.find(m => {
            const nombreNorm = removeAccents(m.nombre || '').toLowerCase();
            console.log(`Buscando Grupo y Participación en: "${m.nombre}" -> "${nombreNorm}"`);
            return (nombreNorm.includes('grupo') && nombreNorm.includes('participacion')) ||
                   (nombreNorm.includes('grupo') && nombreNorm.includes('participación')) ||
                   nombreNorm.includes('participacion en grupos') ||
                   nombreNorm.includes('participación en grupos');
          });
          
          if (grupoParticipacionEncontrado) {
            console.log(`✅ Grupo y Participación encontrado en Grado ${gradoNum}:`, grupoParticipacionEncontrado.nombre);
          }
        }
      }
      
      console.log('\n=== RESULTADO DE BÚSQUEDA ===');
      console.log('Orientación encontrada:', orientacionEncontrada ? orientacionEncontrada.nombre : 'NO ENCONTRADA');
      console.log('Grupo y Participación encontrado:', grupoParticipacionEncontrado ? grupoParticipacionEncontrado.nombre : 'NO ENCONTRADO');
      
      // Escribir Orientación si se encontró
      if (orientacionEncontrada) {
        console.log('\n📝 ESCRIBIENDO ORIENTACIÓN');
        console.log('Datos:', {
          nombre: orientacionEncontrada.nombre,
          letras: orientacionEncontrada.letras,
          plantelNumero: orientacionEncontrada.plantelNumero
        });
        
        // Escribir en las 3 filas (1°, 2°, 3° año)
        for (let grado = 1; grado <= 3; grado++) {
          const fila = orientacionTableStart + (grado - 1);
          console.log(`Escribiendo Orientación Grado ${grado} en fila ${fila}`);
          
          // Columna C (LITERAL) - Nota alfabética
          ws.getCell(fila, 5).value = orientacionEncontrada.letras || orientacionEncontrada.notaAlfabetica || 'F';
          // Columna K (PLANTEL) - Número del plantel (a la derecha del LITERAL)
          ws.getCell(fila, 11).value = orientacionEncontrada.plantelNumero || '';
          
          console.log(`✓ Fila ${fila}: LITERAL(C)="${orientacionEncontrada.letras}", PLANTEL(K)="${orientacionEncontrada.plantelNumero}"`);
        }
      } else {
        console.log('❌ Orientación NO encontrada en ningún grado');
      }
      
      // Escribir Grupo y Participación si se encontró
      if (grupoParticipacionEncontrado) {
        console.log('\n📝 ESCRIBIENDO GRUPO Y PARTICIPACIÓN');
        console.log('Datos:', {
          nombre: grupoParticipacionEncontrado.nombre,
          grupo: grupoParticipacionEncontrado.grupo,
          letras: grupoParticipacionEncontrado.letras,
          plantelNumero: grupoParticipacionEncontrado.plantelNumero
        });
        
        // Escribir en las 3 filas (1°, 2°, 3° año)
        for (let grado = 1; grado <= 3; grado++) {
          const fila = grupoTableStart + (grado - 1);
          console.log(`Escribiendo Grupo y Participación Grado ${grado} en fila ${fila}`);
          
          // Columna D (GRUPO) - Nombre del grupo (a la izquierda del LITERAL)
          ws.getCell(fila, 5).value = grupoParticipacionEncontrado.grupo || '';
          // Columna E (LITERAL) - Nota alfabética
          ws.getCell(fila, 9).value = grupoParticipacionEncontrado.letras || grupoParticipacionEncontrado.notaAlfabetica || 'J';
          // Columna K (PLANTEL) - Número del plantel (a la derecha del LITERAL)
          ws.getCell(fila, 11).value = grupoParticipacionEncontrado.plantelNumero || '';
          
          console.log(`✓ Fila ${fila}: GRUPO(D)="${grupoParticipacionEncontrado.grupo}", LITERAL(E)="${grupoParticipacionEncontrado.letras}", PLANTEL(K)="${grupoParticipacionEncontrado.plantelNumero}"`);
        }
      } else {
        console.log('❌ Grupo y Participación NO encontrado en ningún grado');
      }
      
      console.log('=== FIN ORIENTACIÓN Y GRUPO Y PARTICIPACIÓN ===');
      
      // Escribir información específica en columnas O
      console.log('\n=== ESCRIBIENDO INFORMACIÓN ESPECÍFICA ===');
      
      // Fila 21, Columna O: Lcda Carmen Sanchez
      ws.getCell(21, 15).value = 'Lcda Carmen Sanchez';
      console.log('✓ Fila 21, Columna O: Lcda Carmen Sanchez');
      
      // Fila 28, Columna O: Cédula
      ws.getCell(28, 15).value = '------------';
      console.log('✓ Fila 28, Columna O: ------------');
      
      console.log('=== FIN INFORMACIÓN ESPECÍFICA ===');
    } catch (error) {
      console.error('❌ Error al escribir Orientación y Grupo y Participación:', error);
    }

    // Configurar página para impresión optimizada - UNA PÁGINA VERTICAL COMPLETA
    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait', // VERTICAL
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      printArea: 'A1:V65', // Área extendida para incluir todo el contenido (1-3 años)
      margins: {
        left: 0.05,
        right: 0.05,
        top: 0.05,
        bottom: 0.05,
        header: 0.0,
        footer: 0.0
      },
      horizontalCentered: true,
      verticalCentered: false
    };
    
    // Eliminar saltos de página automáticos
    ws.pageSetup.printTitlesRow = undefined;
    ws.pageSetup.printTitlesColumn = undefined;

    const buffer = await workbook.xlsx.writeBuffer();

    console.log('✅ Excel generado exitosamente (1-3 año) con configuración de página');
    
    const fileName = `nota_certificada_1-3_${(estudiante.cedula || 'estudiante')}.xlsx`;
    
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
  } catch (error) {
    console.error('POST /api/notascertificadas/excel error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}