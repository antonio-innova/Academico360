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

const YEAR_COLUMNS = [
  { nombre: 1, numero: 4, letras: 5, te: 9, mes: 10, anio: 11, plantel: 13 }, // 1er año
  { nombre: 1, numero: 4, letras: 5, te: 9, mes: 10, anio: 11, plantel: 13 }, // 2do
  { nombre: 1, numero: 4, letras: 5, te: 9, mes: 10, anio: 11, plantel: 13 }  // 3ero
];

const YEAR_START_ROWS = [21, 38, 56];
const YEAR_ROW_COUNTS = [10, 10, 10];
const ALLOWED_GRADES = new Set(['1', '2', '3']);

const DEFAULT_INSTITUCION_INFO = {
  codigo: 'P000102120',
  denominacion: 'UNIDAD EDUCATIVA COLEGIO LAS ACACIAS',
  direccion: 'AV. BOLÍVAR ENTRE CALLE 25 Y 26. VALERA',
  telefono: '0271-2310383',
  municipio: 'VALERA',
  entidadFederal: 'TRUJILLO',
  cdcee: 'TRUJILLO'
};

const DEFAULT_PLANTELES = [
  { numero: '1', nombre: 'UE Colegio Las Acacias (Sede Principal)', localidad: 'Valera', ef: 'Trujillo' },
  { numero: '2', nombre: 'UE Colegio Las Acacias (Extensión)', localidad: 'Valera', ef: 'Trujillo' }
];

const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'Formato32011.xlsx');

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      estudiante = {},
      institucion = {},
      planEstudio = [],
      metadata = {}
    } = body || {};

    debugLogNotasPayload('Excel 32011 (1°-3°)', body);

    if (!fs.existsSync(TEMPLATE_PATH)) {
      return NextResponse.json({ success: false, message: 'Plantilla Formato32011.xlsx no encontrada en /public' }, { status: 404 });
    }

    if ((!institucion.planteles || institucion.planteles.length === 0) && estudiante?.cedula) {
      try {
        await connectDB();
        const notaDoc = await NotaCertificada.findOne({ 'estudiante.cedula': estudiante.cedula })
          .sort({ fechaCreacion: -1 })
          .lean();
        if (notaDoc?.institucion?.planteles?.length) {
          institucion.planteles = notaDoc.institucion.planteles;
        }
      } catch (error) {
        console.error('Error al obtener planteles desde BD:', error);
      }
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);
    const ws = workbook.worksheets[0];

    const HEADER_CELLS = {
      cedula: 'D10',
      fechaNacimiento: 'P10',
      apellidos: 'E11',
      nombres: 'P11',
      lugarNacimiento: 'C12',
      pais: 'F12',
      estado: 'J12',
      municipio: 'Q12'
    };

    const SUBJECT_COLS = {
      nombre: 1,
      numero: 4,
      letras: 5,
      te: 9,
      mes: 10,
      anio: 11,
      plantel: 13
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
          const v = cell.value && (typeof cell.value === 'object'
            ? cell.value.richText ? cell.value.richText.map(t=>t.text).join('') : cell.value.result || cell.value.text || cell.value
            : cell.value);
          if (!v) continue;
          if (String(v).toLowerCase().includes(labelLower)) {
            const target = ws.getCell(cell.row, cell.col + offsetCols);
            target.value = value;
            return;
          }
        }
      }
    };

    const writeRow = (row, values, cols) => {
      const [nombre, numero, letras, te, mes, anio, plantel] = values;
      ws.getCell(row, cols.nombre).value = nombre || '';
      ws.getCell(row, cols.numero).value = numero || '';
      ws.getCell(row, cols.letras).value = letras || '';
      ws.getCell(row, cols.te).value = te || '';
      ws.getCell(row, cols.mes).value = mes || '';
      ws.getCell(row, cols.anio).value = anio || '';
      ws.getCell(row, cols.plantel).value = plantel || '';
    };

    const removeAccents = (s = '') => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const EXCLUDED = new Set(['orientacion', 'grupo y participacion']);

    const numToLetras = (n) => {
      const mapa = {1:'Uno',2:'Dos',3:'Tres',4:'Cuatro',5:'Cinco',6:'Seis',7:'Siete',8:'Ocho',9:'Nueve',10:'Diez',11:'Once',12:'Doce',13:'Trece',14:'Catorce',15:'Quince',16:'Dieciséis',17:'Diecisiete',18:'Dieciocho',19:'Diecinueve',20:'Veinte'};
      const v = Math.max(1, Math.min(20, Math.round(Number(n)||1)));
      return mapa[v];
    };

    const planSinNumeros = Array.isArray(planEstudio) && planEstudio.length > 0
      ? planEstudio.every(a => Array.isArray(a.materias) && a.materias.every(m => !m?.numero))
      : true;

    let computedPlan = [];
    let notaDoc = null;
    let estDoc = null;
    if (estudiante?.cedula) {
      console.log('🔍 Buscando datos desde BD para cédula:', estudiante.cedula);
      try {
        await connectDB();
        estDoc = await Estudiante.findOne({ idU: estudiante.cedula });

        notaDoc = await NotaCertificada.findOne({ 'estudiante.cedula': estudiante.cedula })
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

        if (!computedPlan.length && estDoc) {
          const aulas = await Aula.find({ 'alumnos._id': estDoc._id }).lean();
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
                const cal = (act.calificaciones||[]).find(c => String(c.alumnoId) === String(estDoc._id) || String(c.alumnoId) === String(estDoc._id?._id));
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
        console.error('Error obteniendo datos desde BD:', e);
      }
    }

    const planToUse = (computedPlan.length > 0) ? computedPlan : planEstudio;
    const planFiltrado = (planToUse || []).filter(anio => ALLOWED_GRADES.has(String(anio?.grado)));
    console.log('📊 Plan de estudio FINAL a procesar (formato 32011):', JSON.stringify(planFiltrado, null, 2));

    const notaEst = {
      cedula: estudiante.cedula || notaDoc?.estudiante?.cedula || estDoc?.idU || '',
      nombres: estudiante.nombres || notaDoc?.estudiante?.nombres || estDoc?.nombre || '',
      apellidos: estudiante.apellidos || notaDoc?.estudiante?.apellidos || estDoc?.apellido || '',
      fechaNacimiento: estudiante.fechaNacimiento || notaDoc?.estudiante?.fechaNacimiento || estDoc?.fechaNacimiento || '',
      pais: estudiante.pais || notaDoc?.estudiante?.pais || 'VENEZUELA',
      estado: estudiante.estado || notaDoc?.estudiante?.estado || estDoc?.estado || estDoc?.ef || '',
      municipio: estudiante.municipio || notaDoc?.estudiante?.municipio || estDoc?.municipio || '',
      lugarNacimiento: estudiante.lugarNacimiento || notaDoc?.estudiante?.lugarNacimiento || estDoc?.lugarNacimiento || ''
    };

    put(HEADER_CELLS.cedula, notaEst.cedula || '');
    put(HEADER_CELLS.apellidos, notaEst.apellidos || '');
    put(HEADER_CELLS.nombres, notaEst.nombres || '');
    put(HEADER_CELLS.fechaNacimiento, notaEst.fechaNacimiento || '');
    put(HEADER_CELLS.pais, notaEst.pais || 'VENEZUELA');
    put(HEADER_CELLS.estado, notaEst.estado || '');
    put(HEADER_CELLS.municipio, notaEst.municipio || '');
    put(HEADER_CELLS.lugarNacimiento, notaEst.lugarNacimiento || '');

    try {
      const dt = new Date();
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const yyyy = String(dt.getFullYear());
      ws.getCell(3, 17).value = `${dd}/${mm}/${yyyy}`; // Q3
    } catch {}

    const pickValue = (...values) => {
      for (const value of values) {
        if (value === undefined || value === null) continue;
        const str = typeof value === 'string' ? value.trim() : value;
        if (str !== '' && str !== null && str !== undefined) return value;
      }
      return '';
    };

    const institucionData = {
      codigo: pickValue(institucion?.codigo, notaDoc?.institucion?.codigo, DEFAULT_INSTITUCION_INFO.codigo),
      denominacion: pickValue(institucion?.denominacion, notaDoc?.institucion?.denominacion, DEFAULT_INSTITUCION_INFO.denominacion),
      direccion: pickValue(institucion?.direccion, notaDoc?.institucion?.direccion, DEFAULT_INSTITUCION_INFO.direccion),
      telefono: pickValue(institucion?.telefono, notaDoc?.institucion?.telefono, DEFAULT_INSTITUCION_INFO.telefono),
      municipio: pickValue(institucion?.municipio, notaDoc?.institucion?.municipio, DEFAULT_INSTITUCION_INFO.municipio),
      entidadFederal: pickValue(institucion?.entidadFederal, notaDoc?.institucion?.entidadFederal, DEFAULT_INSTITUCION_INFO.entidadFederal),
      cdcee: pickValue(institucion?.cdcee, notaDoc?.institucion?.cdcee, DEFAULT_INSTITUCION_INFO.cdcee)
    };

    ws.getCell('C6').value = institucionData.codigo || '';
    ws.getCell('J6').value = institucionData.denominacion || '';
    ws.getCell('E7').value = institucionData.direccion || '';
    ws.getCell('Q7').value = institucionData.telefono || '';
    ws.getCell('C8').value = institucionData.municipio || '';
    ws.getCell('R8').value = institucionData.entidadFederal || '';
    ws.getCell('T8').value = institucionData.cdcee || '';

    try {
      const plantelesOrigen =
        (institucion?.planteles && institucion.planteles.length)
          ? institucion.planteles
          : (notaDoc?.institucion?.planteles && notaDoc.institucion.planteles.length
              ? notaDoc.institucion.planteles
              : DEFAULT_PLANTELES);
      const planteles = Array.isArray(plantelesOrigen) ? plantelesOrigen : [];
      if (planteles.length) {
        const leftRows = [16, 17];
        const rightRows = [15, 16, 17];
        const fillLeft = planteles.slice(0, 2);
        fillLeft.forEach((pl, idx) => {
          const row = leftRows[idx];
          if (!row) return;
          ws.getCell(row, 3).value = pl.nombre || '';
          ws.getCell(row, 6).value = pl.localidad || '';
          ws.getCell(row, 8).value = pl.ef || '';
        });
        if (planteles.length > 2) {
          planteles.slice(2, 5).forEach((pl, idx) => {
            const row = rightRows[idx];
            if (!row) return;
            ws.getCell(row, 11).value = pl.nombre || '';
            ws.getCell(row, 17).value = pl.localidad || '';
            ws.getCell(row, 20).value = pl.ef || '';
          });
        }
      }
    } catch (error) {
      console.error('Error al escribir planteles:', error);
    }

    (planFiltrado || []).forEach((anio) => {
      const gradoNum = Math.max(1, Math.min(3, Number(anio?.grado || 0)));
      const idx = gradoNum - 1;
      const startRow = YEAR_START_ROWS[idx];
      const rowCount = YEAR_ROW_COUNTS[idx];
      const yearCols = YEAR_COLUMNS[idx] || SUBJECT_COLS;

      for (let i = 0; i < rowCount; i++) {
        writeRow(startRow + i, ['', '', '', '', '', '', ''], yearCols);
      }

      const materiasFiltradas = (anio.materias || [])
        .filter(m => !EXCLUDED.has(removeAccents(m.nombre || '')))
        .slice(0, rowCount);

      materiasFiltradas.forEach((m, mIdx) => {
        const row = startRow + mIdx;
        const numeroStr = m.numero !== null && m.numero !== undefined ? String(m.numero).padStart(2, '0') : '';
        const values = [
          m.nombre || '',
          numeroStr,
          m.letras || '',
          m.te || 'F',
          m.fechaMes || '',
          m.fechaAnio || '',
          m.plantelNumero || ''
        ];
        writeRow(row, values, yearCols);
      });
    });

    // Configurar página para que todo quepa en una sola hoja vertical sin espacios en blanco
    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait', // Vertical
      fitToPage: true,
      fitToWidth: 1, // Ajustar a 1 página de ancho
      fitToHeight: 1, // Ajustar a 1 página de alto
      scale: 75, // Escala para que quepa todo sin espacios excesivos
      horizontalCentered: true, // Centrar el contenido
      margins: {
        left: 0.05,
        right: 0.05,
        top: 0.05,
        bottom: 0.05,
        header: 0,
        footer: 0
      }
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Formato32011_${notaEst.cedula || 'estudiante'}.xlsx`
      }
    });
  } catch (error) {
    console.error('POST /api/notascertificadas/excel-32011 error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

