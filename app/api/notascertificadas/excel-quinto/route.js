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

// Genera un Excel rellenando la plantilla ubicada en public/formatoquinto.xlsx (1-5 año)
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      estudiante = {},
      institucion = {},
      planEstudio = [],
      metadata = {},
      observaciones = ''
    } = body || {};

    debugLogNotasPayload('Excel 1-5 años', body);

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

    // Cargar plantilla formatoquinto.xlsx
    const templatePath = path.join(process.cwd(), 'public', 'formatoquinto.xlsx');
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ success: false, message: 'Plantilla no encontrada. Colócala en public/formatoquinto.xlsx' }, { status: 404 });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const ws = workbook.worksheets[0];

    // Configuración para formato quinto (1-5 año)
    const HEADER_CELLS = {
      // Fila 10
      cedula: 'E10',            // Columna E
      fechaNacimiento: 'P10',   // Columna P
      // Fila 11
      apellidos: 'E11',         // Columna E
      nombres: 'P11',           // Columna P
      // Fila 12 - Lugar de Nacimiento
      lugarNacimiento: 'C12',
      pais: 'F12',      // Columna F
      estado: 'N12',    // Columna N
      municipio: 'R12', // Columna R
    };

    // Filas base de cada año - se actualizó según las especificaciones
    
    // Columnas específicas por año
    // 1er año: filas 22-28, B (nombre), D (N°), E (LETRAS), G (T-E), H (Mes), I (Año), J (Plantel)
    // 2do año: columnas M (nombre), O (N°), P (LETRAS), R (T-E), S (Mes), T (Año), U (Plantel)
    // 3er año: columna B (nombre), D (N°), E (LETRAS), G (T-E), H (Mes), I (Año), J (Plantel)
    // 4to año: columna P (nombre), Q (N°), R (LETRAS), S (T-E), T (Mes), U (Año), V (Plantel)
    // 5to año: columna B (nombre), D (N°), E (LETRAS), G (T-E), H (Mes), I (Año), J (Plantel)
    
    const YEAR_COLUMNS = [
      { nombre: 2,  numero: 4,  letras: 5,  te: 7,  mes: 8,  anio: 9,  plantel: 10 }, // 1er año - filas 22-28: B, D, E, G, H, I, J
      { nombre: 13, numero: 15, letras: 16, te: 18, mes: 19, anio: 20, plantel: 21 }, // 2do año - filas 22-28: M, O, P, R, S, T, U
      { nombre: 2,  numero: 4,  letras: 5,  te: 7,  mes: 8,  anio: 9,  plantel: 10 }, // 3er año - columnas B, D, E, G, H, I, J
      { nombre: 13, numero: 15, letras: 16, te: 18, mes: 19, anio: 20, plantel: 21 }, // 4to año - columnas M, O, P, R, S, T, U
      { nombre: 2,  numero: 4,  letras: 5,  te: 7,  mes: 8,  anio: 9,  plantel: 10 }, // 5to año - columnas B, D, E, G, H, I, J
    ];
    
    // Filas de inicio para cada año
    // 1er año: 22, 2do: 22 (tabla derecha), 3ro: 32, 4to: 32 (tabla derecha), 5to: 44
    const YEAR_START_ROWS = [22, 22, 32, 32, 44];

    // Cantidad de filas por año
    const YEAR_ROW_COUNTS = [7, 7, 9, 9, 10];
    
    const SUBJECT_COLS = {
      nombre: 2,  // B
      numero: 5,  // E (N°)
      letras: 6,  // F (LETRAS)
      te: 8,      // H (T-E)
      mes: 9,     // I (Mes)
      anio: 10,   // J (Año)
      plantel: 11 // K (PLANTEL)
    };
    
    // Función para obtener las columnas correctas por año
    const getColsForYear = (yearIndex) => YEAR_COLUMNS[yearIndex] || YEAR_COLUMNS[0];

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

    // Lugar y Fecha de Expedición: siempre el día actual
    try {
      const today = (() => {
        const dt = new Date();
        const dd = String(dt.getDate()).padStart(2, '0');
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const yyyy = String(dt.getFullYear());
        return `${dd}/${mm}/${yyyy}`;
      })();
      // Ubicación fija: fila 3, columna R
      ws.getCell(3, 18).value = today;
    } catch (e) {
      console.warn('No se pudo escribir Lugar y Fecha de Expedición:', e);
    }

    // Sección IV: Planteles donde cursó estudios
    try {
      const planteles = Array.isArray(institucion.planteles) ? institucion.planteles : [];
      console.log('=== DEBUGGING PLANTELES (1-5 año) ===');
      console.log('institucion completa:', institucion);
      console.log('planteles array:', planteles);
      
      if (planteles.length) {
        console.log('Escribiendo planteles en Excel...');
        // Primeros 2 planteles: filas 16 y 17, columnas D (institución), G (localidad), J (E.F.)
        for (let i = 0; i < Math.min(planteles.length, 2); i++) {
          const p = planteles[i] || {};
          const nombre = p.nombre || '';
          const localidad = p.localidad || '';
          const ef = p.ef || '';
          const row = 16 + i; // 16, 17
          ws.getCell(row, 4).value = nombre;     // D: Institución
          ws.getCell(row, 7).value = localidad;  // G: Localidad
          ws.getCell(row, 10).value = ef;        // J: E.F.
          console.log(`✓ Plantel ${i+1} (bloque izquierdo) - Fila ${row}: nombre=${nombre}, localidad=${localidad}, ef=${ef}`);
        }

        // Resto (del 3ro al 5to): filas 15-17, columnas O (institución), R (localidad), U (E.F.)
        for (let i = 2; i < Math.min(planteles.length, 5); i++) {
          const p = planteles[i] || {};
          const nombre = p.nombre || '';
          const localidad = p.localidad || '';
          const ef = p.ef || '';
          const row = 15 + (i - 2); // 15, 16, 17
          ws.getCell(row, 15).value = nombre;    // O: Institución
          ws.getCell(row, 18).value = localidad; // R: Localidad
          ws.getCell(row, 21).value = ef;        // U: E.F.
          console.log(`✓ Plantel ${i+1} (bloque derecho) - Fila ${row}: nombre=${nombre}, localidad=${localidad}, ef=${ef}`);
        }

        // Rellenar vacíos con **** cuando falten planteles
        const leftRows = [16, 17];
        for (let i = 0; i < leftRows.length; i++) {
          if (i >= Math.min(planteles.length, 2)) {
            const r = leftRows[i];
            ws.getCell(r, 4).value = '****'; // D
            ws.getCell(r, 7).value = '****'; // G
            ws.getCell(r, 10).value = '****'; // J
          }
        }

        const rightRows = [15, 16, 17];
        for (let k = 0; k < rightRows.length; k++) {
          const idx = 2 + k; // índices 2..4 (3ro a 5to)
          if (idx >= planteles.length) {
            const r = rightRows[k];
            ws.getCell(r, 15).value = '****'; // O
            ws.getCell(r, 18).value = '****'; // R
            ws.getCell(r, 21).value = '****'; // U
          }
        }

        console.log('=== FIN ESCRITURA PLANTELES ===');
      } else {
        console.log('❌ No hay planteles para escribir');
      }
    } catch (error) {
      console.error('❌ Error al escribir planteles:', error);
    }

    const writeRow = (row, values, yearCols) => {
      let [nombre, numero, letras, te, mes, anio, plantel] = values;
      const nombreNorm = String(nombre||'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
      const isEspecial = nombreNorm.includes('orientacion') || nombreNorm.includes('grupo y participacion');
      
      console.log(`Escribiendo fila ${row}: nombre="${nombre}", numero="${numero}", letras="${letras}", te="${te}", mes="${mes}", anio="${anio}", plantel="${plantel}"`);
      
      // Escribir materias con manejo correcto de valores
      ws.getCell(row, yearCols.nombre).value = nombre ? String(nombre) : '';
      ws.getCell(row, yearCols.numero).value = (!isEspecial && numero) ? String(numero) : '';
      ws.getCell(row, yearCols.letras).value = letras ? String(letras) : '';
      // Forzar 'F' en T-E cuando sea segundo año (tabla derecha)
      const forcedTE = String(te || '').trim() || 'F';
      ws.getCell(row, yearCols.te).value = forcedTE;
      ws.getCell(row, yearCols.mes).value = mes ? String(mes) : '';
      ws.getCell(row, yearCols.anio).value = anio ? String(anio) : '';
      ws.getCell(row, yearCols.plantel).value = plantel ? String(plantel) : '';
    };

    const removeAccents = (s = '') => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const EXCLUDED = new Set(['orientacion', 'grupo y participacion']);

    const numToLetras = (n) => {
      const mapa = {1:'Uno',2:'Dos',3:'Tres',4:'Cuatro',5:'Cinco',6:'Seis',7:'Siete',8:'Ocho',9:'Nueve',10:'Diez',11:'Once',12:'Doce',13:'Trece',14:'Catorce',15:'Quince',16:'Dieciséis',17:'Diecisiete',18:'Dieciocho',19:'Diecinueve',20:'Veinte'};
      const v = Math.max(1, Math.min(20, Math.round(Number(n)||1)));
      return mapa[v];
    };

    // SIEMPRE intentar obtener los datos desde BD si hay cédula
    const planSinNumeros = Array.isArray(planEstudio) && planEstudio.length > 0
      ? planEstudio.every(a => Array.isArray(a.materias) && a.materias.every(m => !m?.numero))
      : true;
    
    let computedPlan = [];
    // SIEMPRE obtener desde BD si hay cédula
    if (estudiante?.cedula) {
      console.log('🔍 Buscando datos desde BD para cédula:', estudiante.cedula);
      try {
        await connectDB();
        const est = await Estudiante.findOne({ idU: estudiante.cedula });

        // Priorizar colección notacertificadas
        const notaDoc = await NotaCertificada.findOne({ 'estudiante.cedula': estudiante.cedula })
          .sort({ fechaCreacion: -1 })
          .lean();
        
        console.log('🔍 Consultando notaDoc desde BD:', notaDoc ? 'Encontrado' : 'No encontrado');
        
        if (notaDoc?.planEstudio?.length) {
          console.log('📋 planEstudio desde BD (RAW):', JSON.stringify(notaDoc.planEstudio, null, 2));
          
          computedPlan = notaDoc.planEstudio.map(anio => ({
            grado: anio.grado,
            materias: (anio.materias || [])
              .map(m => {
                console.log('🔍 Mapeando materia desde BD:', JSON.stringify(m, null, 2));
                return {
                  nombre: m.nombre,
                  numero: String(m.numero ?? '').padStart(2, '0'),
                  letras: m.letras || '',
                  te: m.te || 'F',
                  fechaMes: m.fechaMes || '',
                  fechaAnio: m.fechaAnio || '',
                  plantelNumero: m.plantelNumero || '',
                  grupo: m.grupo || ''
                };
              })
          })).filter(x => x.materias.length > 0);
          
          console.log('✅ computedPlan después de mapeo:', JSON.stringify(computedPlan, null, 2));
        } else {
          console.log('⚠️ notaDoc.planEstudio está vacío o no existe');
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

          computedPlan = ['1','2','3','4','5'].map(grado => ({
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

    // PRIORIZAR datos de BD si existen, sino usar planEstudio del frontend
    console.log('🔍 Decidiendo qué plan usar:');
    console.log('  planEstudio del frontend:', Array.isArray(planEstudio) && planEstudio.length > 0 ? 'TIENE DATOS' : 'VACÍO');
    console.log('  computedPlan de BD:', computedPlan.length > 0 ? 'TIENE DATOS' : 'VACÍO');
    
    // Priorizar BD sobre frontend
    const planToUse = (computedPlan.length > 0) 
      ? computedPlan  // Usar datos de BD si existen
      : planEstudio; // Solo usar frontend si no hay datos en BD

    console.log('📊 Plan de estudio FINAL a procesar (1-5 año):', JSON.stringify(planToUse, null, 2));

    // Escribir cada año en su posición correspondiente (para 1-5 año)
    (planToUse || []).forEach((anio) => {
      const gradoNum = Math.max(1, Math.min(5, Number(anio?.grado || 0)));
      const idx = gradoNum - 1; // 0,1,2,3,4
      const startRow = YEAR_START_ROWS[idx];
      const yearCols = getColsForYear(idx);
      const rowCount = YEAR_ROW_COUNTS[idx] || 7; // Filas por año
      
      console.log(`Escribiendo año ${gradoNum} en fila ${startRow} con columnas:`, yearCols);
      
      // Limpiar previamente el rango de la tabla
      for (let i = 0; i < rowCount; i++) {
        writeRow(startRow + i, ['', '', '', '', '', '', ''], yearCols);
      }
      
      // Escribir materias filtradas
      const materiasFiltradas = (anio.materias || [])
        .filter(m => !EXCLUDED.has(removeAccents(m.nombre || '')))
        .slice(0, rowCount);
      
      console.log(`Materias para año ${gradoNum}:`, materiasFiltradas.map(m => m.nombre));
      
      materiasFiltradas.forEach((m, mIdx) => {
        const row = startRow + mIdx;
        // Convertir número a string con padding
        const numeroStr = m.numero !== null && m.numero !== undefined ? String(m.numero).padStart(2, '0') : '';
        
        const values = [
          m.nombre || '', 
          numeroStr, 
          m.letras || '', 
          m.te || '', 
          m.fechaMes || '', 
          m.fechaAnio || '',
          m.plantelNumero || ''
        ];
        console.log(`Escribiendo materia ${mIdx} en fila ${row}:`, values);
        console.log(`  Valores individuales: nombre="${m.nombre}", numero="${m.numero}", letras="${m.letras}", te="${m.te}", fechaMes="${m.fechaMes}", fechaAnio="${m.fechaAnio}", plantelNumero="${m.plantelNumero}"`);
        writeRow(row, values, yearCols);
      });

      // Requisito: Para TERCER AÑO rellenar la fila 40 de A a J con "****"
      if (gradoNum === 3) {
        for (let c = 1; c <= 10; c++) {
          ws.getCell(40, c).value = '****';
        }
        console.log('Fila 40 (A-J) rellenada con **** para tercer año');
      }
    });

    // Orientación y Convivencia (Q, filas 43-47) y Participación en grupos (Q grupo, T literal, filas 49-53)
    try {
      const colQ = 17; // Q
      const colT = 20; // T
      const baseOrientacion = 43; // 1º->43 .. 5º->47
      const baseParticipacion = 49; // 1º->49 .. 5º->53
      const norm = (s='') => s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

      for (const anio of (planToUse || [])) {
        const gradoNum = Math.max(1, Math.min(5, Number(anio?.grado || 0)));
        const materias = Array.isArray(anio?.materias) ? anio.materias : [];

        const orient = materias.find(m => {
          const n = norm(m?.nombre || '');
          return n.includes('orientacion') || n.includes('convivencia');
        });
        if (orient) {
          ws.getCell(baseOrientacion + (gradoNum - 1), colQ).value = orient.letras || orient.notaAlfabetica || '';
        }

        const partic = materias.find(m => {
          const n = norm(m?.nombre || '');
          return n.includes('participacion') || n.includes('grupos de creacion') || n.includes('grupos de recreacion') || n.includes('produccion');
        });
        if (partic) {
          const r = baseParticipacion + (gradoNum - 1);
          ws.getCell(r, colQ).value = partic.grupo || '';
          ws.getCell(r, colT).value = partic.letras || partic.notaAlfabetica || '';
        }
      }
    } catch (e) {
      console.error('Error al escribir Orientación/Participación:', e);
    }

    // Obtener observaciones del body o de notaFromCert (para formato 31059 - 1-5 año)
    let observacionesData = observaciones;
    console.log('🔍 DEBUG (excel-quinto) - Observaciones del body:', observaciones);
    console.log('🔍 DEBUG (excel-quinto) - notaFromCert?.observaciones:', notaFromCert?.observaciones);
    
    if (!observacionesData && notaFromCert?.observaciones) {
      observacionesData = notaFromCert.observaciones;
      console.log('✅ Observaciones obtenidas de notaFromCert:', observacionesData);
    }
    // Si aún no hay observaciones y tenemos cédula, intentar obtener desde BD
    if (!observacionesData && estudiante?.cedula) {
      try {
        await connectDB();
        const notaDocObs = await NotaCertificada.findOne({ 'estudiante.cedula': estudiante.cedula })
          .sort({ fechaCreacion: -1 })
          .lean();
        if (notaDocObs?.observaciones) {
          observacionesData = notaDocObs.observaciones;
          console.log('✅ Observaciones obtenidas de BD:', observacionesData);
        }
      } catch (error) {
        console.error('Error al obtener observaciones desde BD:', error);
      }
    }

    console.log('🔍 DEBUG (excel-quinto) - Observaciones finales a escribir:', observacionesData);

    // Escribir observaciones: Fila 55, Columna N (14) para formato 31059 (1-5 año)
    if (observacionesData) {
      const cellObservaciones = ws.getCell(55, 14);
      cellObservaciones.value = observacionesData;
      // Alinear a la izquierda
      cellObservaciones.alignment = { horizontal: 'left', vertical: 'top' };
      console.log('✅ Observaciones escritas en fila 55, columna N (excel-quinto):', observacionesData);
      console.log('✅ Celda N55 después de escribir:', ws.getCell(55, 14).value);
    } else {
      console.log('⚠️ No hay observaciones para escribir (excel-quinto)');
    }

    // Configurar página para impresión optimizada - UNA PÁGINA VERTICAL COMPLETA
    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait', // VERTICAL
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      printArea: 'A1:V70', // Área extendida para incluir todo el contenido (1-5 años)
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

    console.log('✅ Excel generado exitosamente (1-5 año) con configuración de página');
    
    const fileName = `nota_certificada_1-5_${(estudiante.cedula || 'estudiante')}.xlsx`;
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });
  } catch (error) {
    console.error('POST /api/notascertificadas/excel-quinto error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
