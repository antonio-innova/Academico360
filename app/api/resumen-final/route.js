import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { connectDB } from '@/database/db';
import ResumenFinal from '@/database/models/ResumenFinal';
import ExcelJS from 'exceljs';
import Director from '@/database/models/Director';

const sanitizeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const toTitleCase = (value = '') =>
  sanitizeString(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const normalizeHeader = (header, index) => {
  if (!header || !String(header).trim()) {
    return `Columna_${index + 1}`;
  }
  return String(header).trim();
};

const rowIsEmpty = (row = []) =>
  row.every((cell) => cell === null || cell === undefined || sanitizeString(cell) === '');

const buildRowObject = (headers, row) => {
  const record = {};
  headers.forEach((header, idx) => {
    record[header] = row[idx] ?? '';
  });
  return record;
};

const getValue = (record, keys) => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && sanitizeString(record[key]) !== '') {
      return sanitizeString(record[key]);
    }
  }
  return '';
};

const parseNotasEstudiantes = (headers, record) => {
  const notas = [];
  headers.forEach((header, idx) => {
    if (idx < 9) return;
    const materiaBase = header.replace(/\s*-\s*(DEF|1M|2M|3M)$/i, '').trim();
    const momentoMatch = header.match(/-\s*(DEF|1M|2M|3M)$/i);
    notas.push({
      materia: materiaBase || header,
      momento: momentoMatch ? momentoMatch[1].toUpperCase() : '',
      valor: sanitizeString(record[header])
    });
  });
  return notas;
};

const parseEstudiantesExcel = (buffer, XLSX) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0] || 'Hoja1';
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rows.length) {
    return { headers: [], items: [], sheetName };
  }

  const normalizedHeaders = rows.shift().map((header, idx) => normalizeHeader(header, idx));
  const items = [];

  rows.forEach((row) => {
    if (rowIsEmpty(row)) return;
    const record = buildRowObject(normalizedHeaders, row);
    const estudiante = {
      cedula: getValue(record, ['Cédula', 'Cedula', 'CI', 'C.I.', 'C.I', 'Documento']),
      apellido: getValue(record, ['Apellido', 'Apellidos']),
      nombre: getValue(record, ['Nombre', 'Nombres']),
      lugarNacimiento: getValue(record, ['Lugar de Nacimiento', 'Lugar Nacimiento', 'Lugar']),
      ef: getValue(record, ['EF', 'Entidad Federal']),
      sexo: getValue(record, ['Sexo', 'Genero', 'Género']),
      fechaNacimiento: {
        dia: getValue(record, ['Día', 'Dia']),
        mes: getValue(record, ['Mes']),
        anio: getValue(record, ['Año', 'Anio'])
      },
      notas: parseNotasEstudiantes(normalizedHeaders, record),
      raw: record
    };
    items.push(estudiante);
  });

  return { headers: normalizedHeaders, items, sheetName };
};

const parseDocentesExcel = (buffer, XLSX) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0] || 'Docentes';
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rows.length) {
    return { headers: [], items: [], sheetName };
  }

  const normalizedHeaders = rows.shift().map((header, idx) => normalizeHeader(header, idx));
  const items = [];

  rows.forEach((row) => {
    if (rowIsEmpty(row)) return;
    const record = buildRowObject(normalizedHeaders, row);
    items.push({
      nombre: getValue(record, ['Nombre', 'Nombres']),
      apellido: getValue(record, ['Apellido', 'Apellidos']),
      cedula: getValue(record, ['Cédula', 'Cedula', 'CI', 'Documento']),
      raw: record
    });
  });

  return { headers: normalizedHeaders, items, sheetName };
};

const parseNotaNumber = (valor) => {
  if (valor === undefined || valor === null) return null;
  const normalized = sanitizeString(valor).replace(',', '.');
  if (!normalized) return null;
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const TIPO_EVALUACION_LABELS = {
  'resumen-final': 'Final',
  revision: 'Revisión',
  'materia-pendiente': 'Área Pendiente'
};

export async function POST(request) {
  try {
    await connectDB();
    const XLSX = await import('xlsx');

    const formData = await request.formData();
    const tipoEvaluacionRaw = formData.get('tipoEvaluacion') || 'resumen-final';
    const tipoEvaluacion = tipoEvaluacionRaw.toLowerCase();
    const tipoEvaluacionLabel = TIPO_EVALUACION_LABELS[tipoEvaluacion] || 'Final';
    console.log(`[ResumenFinal] Tipo de evaluación recibido: "${tipoEvaluacionRaw}" -> normalizado: "${tipoEvaluacion}" -> label: "${tipoEvaluacionLabel}"`);
    const tiposPermitidos = ['resumen-final', 'revision', 'materia-pendiente'];
    if (!tiposPermitidos.includes(tipoEvaluacion)) {
      return NextResponse.json(
        { success: false, message: 'Tipo de evaluación no soportado.' },
        { status: 400 }
      );
    }

    const estudiantesFile = formData.get('excelEstudiantes');
    const docentesFile = formData.get('excelDocentes');

    if (!(estudiantesFile instanceof File) || !(docentesFile instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'Los dos archivos Excel son obligatorios.' },
        { status: 400 }
      );
    }

    const estudiantesBuffer = Buffer.from(await estudiantesFile.arrayBuffer());
    const docentesBuffer = Buffer.from(await docentesFile.arrayBuffer());

    const grado = sanitizeString(formData.get('grado'));
    if (!grado) {
      return NextResponse.json(
        { success: false, message: 'El año (grado) es obligatorio.' },
        { status: 400 }
      );
    }

    const anioCursadoFormatoRaw = sanitizeString(formData.get('anioCursadoFormato')) || 'letra';
    const anioCursadoFormato = anioCursadoFormatoRaw.toLowerCase();
    const observaciones = sanitizeString(formData.get('observaciones'));

    const seccion = sanitizeString(formData.get('seccion')).toUpperCase();
    if (!seccion) {
      return NextResponse.json(
        { success: false, message: 'La sección es obligatoria para el resumen final.' },
        { status: 400 }
      );
    }

    const anioEscolarInicio = sanitizeString(formData.get('anioEscolarInicio'));
    const anioEscolarFin = sanitizeString(formData.get('anioEscolarFin'));
    const mesReporte = sanitizeString(formData.get('mesReporte'));

    if (!anioEscolarInicio || !anioEscolarFin) {
      return NextResponse.json(
        { success: false, message: 'Debes indicar el año escolar (inicio y fin).' },
        { status: 400 }
      );
    }

    if (!mesReporte) {
      return NextResponse.json(
        { success: false, message: 'Debes indicar el mes del reporte.' },
        { status: 400 }
      );
    }

    const estudiantesParsed = parseEstudiantesExcel(estudiantesBuffer, XLSX);
    const docentesParsed = parseDocentesExcel(docentesBuffer, XLSX);

    const resumen = await ResumenFinal.create({
      tipoEvaluacion,
      formato: sanitizeString(formData.get('formato')),
      grado,
      seccion,
      anioEscolarInicio,
      anioEscolarFin,
      mesReporte,
      observaciones,
      momento: sanitizeString(formData.get('momento')),
      contexto: sanitizeString(formData.get('contexto')),
      aulaReferencia: sanitizeString(formData.get('aulaId')),
      createdBy: sanitizeString(formData.get('usuarioId')),
      createdByNombre: sanitizeString(formData.get('usuarioNombre')),
      estudiantesSheet: estudiantesParsed.sheetName,
      docentesSheet: docentesParsed.sheetName,
      estudiantesHeaders: estudiantesParsed.headers,
      docentesHeaders: docentesParsed.headers,
      totales: {
        estudiantes: estudiantesParsed.items.length,
        docentes: docentesParsed.items.length
      },
      estudiantes: estudiantesParsed.items,
      docentes: docentesParsed.items,
      archivos: {
        estudiantes: estudiantesFile.name,
        docentes: docentesFile.name
      }
    });

    let excelBase64 = null;
    let excelFileName = null;

    const PLANILLA_CONFIG = {
      '1': {
        template: 'formatoFinal1ero.xlsx',
        sheetFallback: '1ERO',
        nombreArchivo: '1Año',
        columnMap: {
          cedula: 'B',
          apellidos: 'Q',
          nombres: 'Z',
          lugarNacimiento: 'AL',
          ef: 'AP',
          sexo: 'AQ',
          dia: 'AR',
          mes: 'AT',
          anio: 'AW'
        },
        subjectColumns: [
          { col: 'AY', keys: ['castellano'] },
          { col: 'BA', keys: ['ingles', 'inglés'] },
          { col: 'BB', keys: ['matematicas', 'matemáticas'] },
          { col: 'BE', keys: ['educacion fisica', 'educación física'] },
          { col: 'BF', keys: ['arte y patrimonio', 'arte', 'patrimonio'] },
          { col: 'BH', keys: ['ciencias naturales'] },
          { col: 'BJ', keys: ['geografia', 'historia', 'ciudadania', 'geografía', 'ciudadanía'] },
          { col: 'BL', keys: ['orientacion', 'orientación', 'orientación y convivencia'] },
          { col: 'BM', keys: ['grupo', 'creacion', 'recreacion', 'produccion', 'creación', 'recreación', 'producción'] }
        ],
        teacherRows: [59, 60, 61, 62, 63, 64, 65, 66, 67],
        sectionCell: { column: 'BO', row: 65 },
        totalGeneralCell: { column: 'BL', row: 67 },
        pageTotalCell: { column: 'BO', row: 67 },
        observaciones: { startRow: 69, endRow: 73, startCol: 'A', endCol: 'BP' },
        remisionFechaRow: 74,
        remisionNombreRow: 77,
        remisionCedulaRow: 79,
        teacherNameColumn: 'Z',
        teacherIdColumn: 'AR',
        remisionNombreColumn: 'B',
        remisionCedulaColumn: 'B'
      },
      '2': {
        template: 'formatoFinal2do.xlsx',
        sheetFallback: '2DO',
        nombreArchivo: '2Año',
        columnMap: {
          cedula: 'B',
          apellidos: 'Q',
          nombres: 'Z',
          lugarNacimiento: 'AL',
          ef: 'AP',
          sexo: 'AQ',
          dia: 'AR',
          mes: 'AT',
          anio: 'AW'
        },
        subjectColumns: [
          { col: 'AY', keys: ['castellano'] },
          { col: 'BA', keys: ['ingles', 'inglés'] },
          { col: 'BB', keys: ['matematicas', 'matemáticas'] },
          { col: 'BE', keys: ['educacion fisica', 'educación física'] },
          { col: 'BF', keys: ['arte y patrimonio', 'arte', 'patrimonio'] },
          { col: 'BH', keys: ['ciencias naturales'] },
          { col: 'BJ', keys: ['geografia', 'historia', 'ciudadania', 'geografía', 'ciudadanía'] },
          { col: 'BL', keys: ['orientacion', 'orientación', 'orientación y convivencia'] },
          { col: 'BM', keys: ['grupo', 'creacion', 'recreacion', 'produccion', 'creación', 'recreación', 'producción'] }
        ],
        teacherRows: [59, 60, 61, 62, 63, 64, 65, 66, 67],
        sectionCell: { column: 'BO', row: 65 },
        totalGeneralCell: { column: 'BL', row: 67 },
        pageTotalCell: { column: 'BO', row: 67 },
        observaciones: { startRow: 69, endRow: 73, startCol: 'A', endCol: 'BP' },
        remisionFechaRow: 74,
        remisionNombreRow: 77,
        remisionCedulaRow: 79,
        teacherNameColumn: 'Z',
        teacherIdColumn: 'AR',
        remisionNombreColumn: 'B',
        remisionCedulaColumn: 'B'
      },
      '3': {
        template: 'formatoFinal3ero.xlsx',
        sheetFallback: '3ERO',
        nombreArchivo: '3Año',
        columnMap: {
          cedula: 'C',
          apellidos: 'Q',
          nombres: 'Z',
          lugarNacimiento: 'AL',
          ef: 'AP',
          sexo: 'AQ',
          dia: 'AR',
          mes: 'AT',
          anio: 'AW'
        },
        subjectColumns: [
          { col: 'AY', keys: ['castellano'] },
          { col: 'BA', keys: ['ingles', 'inglés'] },
          { col: 'BB', keys: ['matematicas', 'matemáticas'] },
          { col: 'BE', keys: ['educacion fisica', 'educación física'] },
          { col: 'BF', keys: ['fisica', 'física'] },
          { col: 'BH', keys: ['quimica', 'química'] },
          { col: 'BK', keys: ['biologia', 'biología'] },
          { col: 'BL', keys: ['geografia', 'historia', 'ciudadania', 'geografía', 'ciudadanía'] },
          { col: 'BM', keys: ['orientacion', 'orientación', 'orientación y convivencia'] },
          {
            col: 'BN',
            keys: ['grupo', 'creacion', 'recreacion', 'produccion', 'creación', 'recreación', 'producción']
          }
        ],
        teacherRows: [59, 60, 61, 62, 63, 64, 65, 66, 67, 68],
        sectionCell: { column: 'BO', row: 65 },
        totalGeneralCell: { column: 'BL', row: 68 },
        pageTotalCell: { column: 'BO', row: 68 },
        observaciones: { startRow: 70, endRow: 74, startCol: 'A', endCol: 'BQ' },
        remisionFechaRow: 75,
        remisionNombreRow: 78,
        remisionCedulaRow: 80,
        teacherNameColumn: 'Z',
        teacherIdColumn: 'AR',
        remisionNombreColumn: 'B',
        remisionCedulaColumn: 'B'
      },
      '4': {
        template: 'formatoFInal4to.xlsx',
        sheetFallback: '4TO',
        nombreArchivo: '4Año',
        columnMap: {
          cedula: 'C',
          apellidos: 'R',
          nombres: 'Z',
          lugarNacimiento: 'AL',
          ef: 'AP',
          sexo: 'AQ',
          dia: 'AR',
          mes: 'AT',
          anio: 'AW'
        },
        subjectColumns: [
          { col: 'AY', keys: ['castellano'] },
          { col: 'BA', keys: ['ingles', 'inglés'] },
          { col: 'BB', keys: ['matematicas', 'matemáticas'] },
          { col: 'BD', keys: ['educacion fisica', 'educación física'] },
          { col: 'BF', keys: ['fisica', 'física'] },
          { col: 'BH', keys: ['quimica', 'química'] },
          { col: 'BK', keys: ['biologia', 'biología'] },
          { col: 'BL', keys: ['geografia', 'historia', 'ciudadania', 'geografía', 'ciudadanía'] },
          { col: 'BM', keys: ['formacion', 'soberania', 'nacional', 'formación', 'soberanía', 'fsn'] },
          { col: 'BN', keys: ['orientacion', 'orientación', 'orientación y convivencia', 'convivencia'] },
          {
            col: 'BO',
            keys: ['grupo', 'creacion', 'recreacion', 'produccion', 'creación', 'recreación', 'producción']
          }
        ],
        teacherRows: [59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
        sectionCell: { column: 'BN', row: 65 },
        totalGeneralCell: { column: 'BM', row: 69 },
        pageTotalCell: { column: 'BQ', row: 69 },
        observaciones: { startRow: 71, endRow: 75, startCol: 'A', endCol: 'BR' },
        remisionFechaRow: 76,
        remisionNombreRow: 79,
        remisionCedulaRow: 81,
        teacherNameColumn: 'Z',
        teacherIdColumn: 'AQ',
        remisionNombreColumn: 'B',
        remisionCedulaColumn: 'B'
      },
      '5': {
        template: 'formatoFinal5ero.xlsx',
        sheetFallback: '5TO',
        nombreArchivo: '5Año',
        columnMap: {
          cedula: 'C',
          apellidos: 'Q',
          nombres: 'Z',
          lugarNacimiento: 'AL',
          ef: 'AP',
          sexo: 'AQ',
          dia: 'AR',
          mes: 'AT',
          anio: 'AW'
        },
        subjectColumns: [
          { col: 'AY', keys: ['castellano'] },
          { col: 'BA', keys: ['ingles', 'inglés'] },
          { col: 'BB', keys: ['matematicas', 'matemáticas'] },
          { col: 'BE', keys: ['educacion fisica', 'educación física'] },
          { col: 'BF', keys: ['fisica', 'física'] },
          { col: 'BH', keys: ['quimica', 'química'] },
          { col: 'BK', keys: ['biologia', 'biología'] },
          { col: 'BL', keys: ['ciencias de la tierra', 'ciencias tierra', 'tierra'] },
          { col: 'BM', keys: ['geografia', 'historia', 'ciudadania', 'geografía', 'ciudadanía'] },
          { col: 'BN', keys: ['formacion', 'soberania', 'nacional', 'formación', 'soberanía', 'fsn'] },
          { col: 'BO', keys: ['orientacion', 'orientación', 'orientación y convivencia', 'convivencia'] },
          {
            col: 'BP',
            keys: ['grupo', 'creacion', 'recreacion', 'produccion', 'creación', 'recreación', 'producción']
          }
        ],
        teacherRows: [59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
        sectionCell: { column: 'BM', row: 65 },
        totalGeneralCell: { column: 'BM', row: 70 },
        pageTotalCell: { column: 'BQ', row: 70 },
        observaciones: { startRow: 72, endRow: 76, startCol: 'A', endCol: 'BS' },
        remisionFechaRow: 77,
        remisionNombreRow: 80,
        remisionCedulaRow: 81,
        teacherNameColumn: 'Z',
        teacherIdColumn: 'AP',
        remisionNombreColumn: 'B',
        remisionCedulaColumn: 'B'
      }
    };

    const formatoSeleccionado = PLANILLA_CONFIG[grado];

    if (formatoSeleccionado) {
      try {
        const templatePath = path.join(process.cwd(), 'public', formatoSeleccionado.template);
        const templateBuffer = await fs.readFile(templatePath);
        const loadSheetWithImages = async () => {
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(templateBuffer);
          const sheet = wb.worksheets[0];
          if (!sheet) throw new Error('La plantilla formatoFinal1ero.xlsx no contiene hojas válidas.');
          const media = wb.model.media || [];
          const images = sheet.getImages().map((img) => ({
            range: img.range,
            media: media[img.imageId - 1]
          }));
          return { wb, sheet, images };
        };

        const copySheetContents = (sourceSheet, targetSheet, sourceImages, workbook) => {
          targetSheet.state = sourceSheet.state;
          targetSheet.properties = { ...sourceSheet.properties };
          targetSheet.pageSetup = { ...sourceSheet.pageSetup };
          targetSheet.headerFooter = { ...sourceSheet.headerFooter };

          sourceSheet.columns?.forEach((col, idx) => {
            const targetCol = targetSheet.getColumn(idx + 1);
            targetCol.width = col.width;
            targetCol.hidden = col.hidden;
            targetCol.outlineLevel = col.outlineLevel;
            targetCol.style = col.style ? JSON.parse(JSON.stringify(col.style)) : undefined;
          });

          sourceSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            const targetRow = targetSheet.getRow(rowNumber);
            targetRow.height = row.height;
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const targetCell = targetRow.getCell(colNumber);
              targetCell.value = cell.value;
              targetCell.style = cell.style ? JSON.parse(JSON.stringify(cell.style)) : cell.style;
              targetCell.numFmt = cell.numFmt;
              targetCell.alignment = cell.alignment;
              targetCell.font = cell.font;
              targetCell.border = cell.border;
              targetCell.fill = cell.fill;
            });
            targetRow.commit();
          });

          targetSheet.model.merges = [];
          targetSheet._merges = {};
          const mergeSet = new Set();
          (sourceSheet.model.merges || []).forEach((merge) => {
            const key = merge.toUpperCase();
            if (mergeSet.has(key)) return;
            mergeSet.add(key);
            try {
              targetSheet.mergeCells(merge);
            } catch (err) {
              console.warn(`No se pudo combinar rango ${merge}:`, err.message);
            }
          });

          sourceImages.forEach((img) => {
            const imageMeta = img.media;
            if (!imageMeta) return;
            const imageId = workbook.addImage({
              extension: imageMeta.extension,
              buffer: imageMeta.buffer
            });
            targetSheet.addImage(imageId, img.range);
          });
        };

        const directorDoc = await Director.findOne({ key: 'global' }).lean();
        const directoraNombre = sanitizeString(directorDoc?.nombre).toUpperCase();
        const directoraCedula = sanitizeString(directorDoc?.cedula);

        const INSTITUTION_INFO = {
          codigo: 'P00001220',
          denominacion: 'UNIDAD EDUCATIVA COLEGIO LAS ACACIAS',
          direccionLinea1: 'AV. BOLÍVAR NORTE CALLE 25 Y 26, VALERA',
          telefono: '0271-2301303',
          direccionLinea2: 'VALERA, ESTADO TRUJILLO',
          entidadFederal: 'TRUJILLO',
          cdcee: 'UNIDAD EDUCATIVA COLEGIO LAS ACACIAS',
          directora: directoraNombre || 'CARMEN ELENA SANCHEZ RIVERO',
          directoraCedula: directoraCedula || 'X'
        };

        const academicInfo = {
          inicio: anioEscolarInicio,
          fin: anioEscolarFin,
          mes: mesReporte.toUpperCase()
        };

        const anioCursadoLabel = (() => {
          const n = Number(grado);
          const mapNumero = { 1: '1ero', 2: '2do', 3: '3ero', 4: '4to', 5: '5to' };
          const mapLetra = { 1: 'Primero', 2: 'Segundo', 3: 'Tercero', 4: 'Cuarto', 5: 'Quinto' };
          if (anioCursadoFormato === 'numero') return mapNumero[n] || String(grado);
          return mapLetra[n] || String(grado);
        })();

        const START_ROW = 17;
        const SUMMARY_ROWS = {
          inscritos: 52,
          aprobados: 54,
          reprobados: 55,
          nocursantes: 56
        };
        const TEACHER_NAME_COLUMN = formatoSeleccionado.teacherNameColumn || 'Z';
        const TEACHER_ID_COLUMN = formatoSeleccionado.teacherIdColumn || 'AR';
        const TEACHER_ROWS = formatoSeleccionado.teacherRows || [59, 60, 61, 62, 63, 64, 65, 66, 67];
        const SECTION_CELL = formatoSeleccionado.sectionCell || { column: 'BO', row: 65 };
        const TOTAL_GENERAL_CELL = formatoSeleccionado.totalGeneralCell || { column: 'BL', row: 67 };
        const PAGE_TOTAL_CELL = formatoSeleccionado.pageTotalCell || { column: 'BO', row: 67 };
        const PLACEHOLDER_VALUE = '*********';
        const columnMap =
          formatoSeleccionado.columnMap || {
            cedula: 'B',
            apellidos: 'Q',
            nombres: 'Z',
            lugarNacimiento: 'AL',
            ef: 'AP',
            sexo: 'AQ',
            dia: 'AR',
            mes: 'AT',
            anio: 'AW'
          };

        const subjectColumns =
          formatoSeleccionado.subjectColumns || [
            { col: 'AY', keys: ['castellano'] },
            { col: 'BA', keys: ['ingles', 'inglés'] },
            { col: 'BB', keys: ['matematicas', 'matemáticas'] },
            { col: 'BE', keys: ['educacion fisica', 'educación física'] },
            { col: 'BF', keys: ['arte y patrimonio', 'arte', 'patrimonio'] },
            { col: 'BH', keys: ['ciencias naturales'] },
            {
              col: 'BJ',
              keys: ['geografia', 'historia', 'ciudadania', 'geografía', 'ciudadanía']
            },
            {
              col: 'BL',
              keys: ['orientacion', 'orientación', 'orientación y convivencia']
            },
            {
              col: 'BM',
              keys: [
                'grupo',
                'creacion',
                'recreacion',
                'produccion',
                'creación',
                'recreación',
                'producción'
              ]
            }
          ];

        const normalize = (text = '') =>
          text
            .toString()
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const LETTER_GRADE_SCALE = [
          { min: 19, letter: 'A' }, // 19-20
          { min: 17, letter: 'B' }, // 17-18
          { min: 15, letter: 'C' }, // 15-16
          { min: 10, letter: 'D' }, // 10-14
          { min: 1, letter: 'E' },  // 1-9
          { min: 0, letter: 'F' }   // 0 o vacío explícito
        ];

        const LETTER_GRADE_VALUES = new Set(['A', 'B', 'C', 'D', 'E', 'F']);

        const shouldUseLetterGradeForKeys = (keys = []) => {
          return keys
            .map((key) => normalize(key))
            .some(
              (key) =>
                key.includes('orientacion') ||
                key.includes('convivencia') ||
                key.includes('participacion') ||
                key.includes('grupo')
            );
        };

        const formatLetterGradeIfNeeded = (valor, keys = []) => {
          if (!shouldUseLetterGradeForKeys(keys)) {
            return valor;
          }
          const upper = sanitizeString(valor).toUpperCase();
          if (!upper) return '';
          if (upper === 'NC' || LETTER_GRADE_VALUES.has(upper)) {
            return upper;
          }
          const numeric = parseNotaNumber(valor);
          if (numeric === null) {
            return upper;
          }
          const scale = LETTER_GRADE_SCALE.find((item) => numeric >= item.min) || LETTER_GRADE_SCALE[LETTER_GRADE_SCALE.length - 1];
          return scale.letter;
        };

        const matchesMateriaKey = (materiaNorm, key) => {
          if (!materiaNorm || !key) return false;
          const materiaClean = materiaNorm.replace(/\s+/g, ' ').trim();
          const keyClean = key.replace(/\s+/g, ' ').trim();

          // Evitar confundir Física (ciencia) con Educación Física
          if (keyClean === 'fisica' && materiaClean.includes('educacion')) {
            return false;
          }

          if (keyClean === 'educacion fisica' && materiaClean === 'fisica') {
            return false;
          }

          return materiaClean === keyClean || materiaClean.includes(keyClean);
        };

        const getNotaByMateria = (est, keys) => {
          const normalizedKeys = keys.map(normalize);
          const sanitizeNotaValor = (valor) => {
            if (valor === undefined || valor === null) return '';
            return String(valor).trim();
          };

          if (Array.isArray(est.notas)) {
            const matchingNotas = est.notas.filter((registro) => {
              const materiaNorm = normalize(registro.materia || '');
              return normalizedKeys.some((k) => matchesMateriaKey(materiaNorm, k));
            });

            if (!matchingNotas.length) {
              console.log('[ResumenFinal] Sin coincidencias en notas procesadas', {
                materiaBuscada: keys,
                materiasDisponibles: est.notas.map((n) => n.materia)
              });
            }

            if (matchingNotas.length) {
              const preferedOrder = ['DEF', '3M', '2M', '1M', ''];
              for (const momento of preferedOrder) {
                const nota = matchingNotas.find((registro) => {
                  return sanitizeString(registro.momento || '').toUpperCase() === momento;
                });
                if (!nota) continue;
                const valor = sanitizeNotaValor(nota.valor);
                if (!valor) continue;
                if (valor.toUpperCase() === 'NC') {
                  // Guardar para posible retorno si no encontramos valor numérico
                  continue;
                }
                return valor;
              }

              // Si no hubo valores numéricos, revisar si alguna nota es NC
              const notaNC = matchingNotas.find(
                (registro) => sanitizeNotaValor(registro.valor).toUpperCase() === 'NC'
              );
              if (notaNC) {
                console.log('[ResumenFinal] Nota NC encontrada en notas procesadas', {
                  materia: matchingNotas[0]?.materia,
                  registros: matchingNotas.map((n) => ({ momento: n.momento, valor: n.valor }))
                });
                return 'NC';
              }
            }
          }

          const rawEntries = Object.entries(est.raw || {});
          const preferedRawOrder = ['def', '3m', '2m', '1m'];
          const rawMatches = rawEntries.filter(([key]) => {
            const keyNorm = normalize(key);
            return normalizedKeys.some((k) => matchesMateriaKey(keyNorm, k));
          });

          if (!rawMatches.length) {
            console.log('[ResumenFinal] Sin coincidencias en raw para materia', {
              materiaBuscada: keys,
              headers: Object.keys(est.raw || {})
            });
          }

          if (rawMatches.length) {
            for (const prioridad of preferedRawOrder) {
              const match = rawMatches.find(([key]) => key.toLowerCase().includes(prioridad));
              if (!match) continue;
              const valor = sanitizeNotaValor(match[1]);
              if (!valor) continue;
              if (valor.toUpperCase() === 'NC') {
                continue;
              }
              return valor;
            }

            const rawNC = rawMatches.find(
              ([, value]) => sanitizeNotaValor(value).toUpperCase() === 'NC'
            );
            if (rawNC) {
              console.log('[ResumenFinal] Nota NC encontrada en raw del Excel', {
                key: rawNC[0],
                valor: rawNC[1]
              });
              return 'NC';
            }
          }
          return '';
        };

        const setCellValue = (sheet, col, rowNumber, value, options = {}) => {
          if (value === undefined || value === null || value === '') return;
          const cell = sheet.getCell(`${col}${rowNumber}`);
          cell.value = value;
          cell.font = options.font || { name: 'Arial', size: 9, bold: false };
          const alignment =
            options.alignment ||
            (options.alignLeft ? { horizontal: 'left', vertical: 'middle' } : null);
          if (alignment) {
            cell.alignment = alignment;
          }
        };

        const setMergedCellValue = (sheet, addr, value, options = {}) => {
          if (value === undefined || value === null) return;
          const cell = sheet.getCell(addr);
          const target = cell.isMerged && cell.master ? cell.master : cell;
          target.value = value;
          if (options.font) target.font = options.font;
          if (options.alignment) target.alignment = options.alignment;
        };

        const columnLetterToNumber = (col = '') => {
          const raw = String(col || '').toUpperCase().trim();
          if (!raw) return 0;
          let num = 0;
          for (let i = 0; i < raw.length; i += 1) {
            const code = raw.charCodeAt(i) - 64;
            if (code < 1 || code > 26) continue;
            num = num * 26 + code;
          }
          return num;
        };

        const wrapTextByMaxLen = (text, maxLen) => {
          const normalized = String(text || '').replace(/\r\n/g, '\n');
          const blocks = normalized.split('\n');
          const lines = [];

          for (const block of blocks) {
            const trimmed = String(block || '').replace(/\s+/g, ' ').trim();
            if (!trimmed) {
              lines.push('');
              continue;
            }
            const words = trimmed.split(' ');
            let current = '';
            for (const word of words) {
              if (!word) continue;
              if (!current) {
                if (word.length <= maxLen) {
                  current = word;
                } else {
                  // palabra más larga que el ancho: partirla
                  for (let i = 0; i < word.length; i += maxLen) {
                    lines.push(word.slice(i, i + maxLen));
                  }
                  current = '';
                }
                continue;
              }
              if ((current.length + 1 + word.length) <= maxLen) {
                current = `${current} ${word}`;
                continue;
              }
              lines.push(current);
              if (word.length <= maxLen) {
                current = word;
              } else {
                for (let i = 0; i < word.length; i += maxLen) {
                  lines.push(word.slice(i, i + maxLen));
                }
                current = '';
              }
            }
            if (current) lines.push(current);
          }

          return lines;
        };

        const fillObservaciones = (sheet, text) => {
          const config = formatoSeleccionado?.observaciones;
          if (!config) return;
          const rawText = sanitizeString(text);
          const startRow = Number(config.startRow);
          const endRow = Number(config.endRow);
          const startCol = String(config.startCol || 'A').toUpperCase();
          const endCol = String(config.endCol || 'BP').toUpperCase();
          if (!startRow || !endRow || endRow < startRow) return;

          const maxLines = endRow - startRow + 1;
          const maxLen = Math.max(1, columnLetterToNumber(endCol) - columnLetterToNumber(startCol) + 1);
          const lines = rawText ? wrapTextByMaxLen(rawText, maxLen) : [];

          for (let i = 0; i < maxLines; i += 1) {
            const row = startRow + i;
            const line = lines[i] || '';
            // Las celdas suelen estar combinadas desde A..(BP/BQ/BR/BS)
            const addr = `${startCol}${row}`;
            setMergedCellValue(sheet, addr, line, {
              font: { name: 'Arial', size: 9, bold: false },
              alignment: { horizontal: 'left', vertical: 'top', wrapText: false }
            });
          }
        };

        const fillInstitutionData = (sheet) => {
          setCellValue(sheet, 'V', 6, INSTITUTION_INFO.codigo, { alignLeft: true });
          setCellValue(sheet, 'BH', 6, INSTITUTION_INFO.denominacion, { alignLeft: true });

          setCellValue(sheet, 'V', 7, INSTITUTION_INFO.direccionLinea1, { alignLeft: true });
          setCellValue(sheet, 'BM', 7, INSTITUTION_INFO.telefono, {
            alignment: { horizontal: 'center', vertical: 'middle' }
          });

          setCellValue(sheet, 'T', 8, INSTITUTION_INFO.direccionLinea2, { alignLeft: true });
          setCellValue(sheet, 'AL', 8, INSTITUTION_INFO.entidadFederal, { alignLeft: true });
          setCellValue(sheet, 'BM', 8, INSTITUTION_INFO.cdcee, { alignLeft: true });

          setCellValue(sheet, 'Z', 9, INSTITUTION_INFO.directora, { alignLeft: true });
          if (INSTITUTION_INFO.directoraCedula) {
            setCellValue(sheet, 'BH', 9, INSTITUTION_INFO.directoraCedula, {
              alignment: { horizontal: 'center', vertical: 'middle' }
            });
          }
        };

        const formatDate = (date) => {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        const fillRemisionSection = (sheet) => {
          const todayFormatted = formatDate(new Date());
          const fechaRow = formatoSeleccionado.remisionFechaRow || 70;
          const nombreRow = formatoSeleccionado.remisionNombreRow || 73;
          const cedulaRow = formatoSeleccionado.remisionCedulaRow || 75;
          const nombreColumn = formatoSeleccionado.remisionNombreColumn || 'J';
          const cedulaColumn = formatoSeleccionado.remisionCedulaColumn || 'J';
          
          setMergedCellValue(sheet, `B${fechaRow}`, `VIII. Fecha de Remisión: ${todayFormatted}`, {
            font: { name: 'Arial', size: 9, bold: true },
            alignment: { horizontal: 'left', vertical: 'middle' }
          });
          
          setMergedCellValue(sheet, `${nombreColumn}${nombreRow}`, INSTITUTION_INFO.directora, {
            font: { name: 'Arial', size: 9, bold: false }
          });
          
          setMergedCellValue(sheet, `${cedulaColumn}${cedulaRow}`, INSTITUTION_INFO.directoraCedula || 'X', {
            font: { name: 'Arial', size: 9, bold: false }
          });
        };

        const fillAcademicInfo = (sheet, evaluacionLabel) => {
          const periodo = `${academicInfo.inicio}-${academicInfo.fin}`;
          setCellValue(sheet, 'BF', 3, periodo, {
            alignLeft: true,
            font: { name: 'Arial', size: 9, bold: true }
          });
          
          // NO escribir nada en BM4 (fila 4, columna BM debe permanecer vacía)
          
          // Escribir el tipo de evaluación en BF4
          const tipoEvaluacionFinal = evaluacionLabel || 'Final';
          console.log(`[ResumenFinal] Escribiendo tipo de evaluación en BF4: "${tipoEvaluacionFinal}"`);
          const cellBF4 = sheet.getCell('BF4');
          cellBF4.value = tipoEvaluacionFinal;
          cellBF4.font = { name: 'Arial', size: 9, bold: true };
          cellBF4.alignment = { horizontal: 'left', vertical: 'middle' };

          // Escribir Mes - Año en BN4 en mayúsculas
          const mesTexto = sanitizeString(academicInfo.mes).toUpperCase();
          const anioTexto = sanitizeString(academicInfo.fin).toUpperCase();
          if (mesTexto || anioTexto) {
            const mesAnio = [mesTexto, anioTexto].filter(Boolean).join(' - ');
            setCellValue(sheet, 'BN', 4, mesAnio, {
              alignLeft: true,
              font: { name: 'Arial', size: 9, bold: true }
            });
          }
        };

        const fillAnioCursado = (sheet) => {
          if (!anioCursadoLabel) return;
          try {
            const needle = 'ano cursado';
            let found = null;
            sheet.eachRow({ includeEmpty: false }, (row) => {
              if (found) return;
              row.eachCell({ includeEmpty: false }, (cell) => {
                if (found) return;
                const v = cell?.value;
                const text =
                  v && typeof v === 'object'
                    ? Array.isArray(v.richText)
                      ? v.richText.map((t) => t.text).join('')
                      : v.result || v.text || ''
                    : v;
                const norm = normalize(String(text || ''));
                if (norm.includes(needle)) {
                  found = { row: cell.row, col: cell.col };
                }
              });
            });
            if (!found) return;
            const target = sheet.getCell(found.row + 1, found.col);
            target.value = anioCursadoLabel;
            // Mantener estilo existente; solo asegurar centrado (por si la celda no lo está)
            target.alignment = { ...(target.alignment || {}), horizontal: 'center', vertical: 'middle' };
          } catch (e) {
            console.warn('No se pudo escribir AÑO CURSADO:', e?.message || e);
          }
        };

        const createEmptySubjectStats = () => {
          const stats = {};
          subjectColumns.forEach(({ col }) => {
            stats[col] = { aprobados: 0, reprobados: 0, nocursantes: 0 };
          });
          return stats;
        };

        const buildSubjectStats = (students) => {
          const stats = createEmptySubjectStats();
          students.forEach((est) => {
            subjectColumns.forEach(({ col, keys }) => {
              const nota = getNotaByMateria(est, keys);
              
              // Detectar si la nota es "NC" (No Calificado)
              const notaStr = String(nota || '').trim().toUpperCase();
              if (notaStr === 'NC') {
                stats[col].nocursantes += 1;
                return;
              }
              
              const notaNumber = parseNotaNumber(nota);
              if (notaNumber === null) return;
              if (notaNumber >= 10) {
                stats[col].aprobados += 1;
              } else {
                stats[col].reprobados += 1;
              }
            });
          });
          return {
            totalEstudiantes: students.length,
            porMateria: stats
          };
        };

        const fillSummaryRows = (sheet, summaryData) => {
          if (!summaryData) return;
          
          // Para 4º año, limpiar las columnas BE y BF de errores "#"
          if (grado === '4') {
            [SUMMARY_ROWS.inscritos, SUMMARY_ROWS.aprobados, SUMMARY_ROWS.reprobados, SUMMARY_ROWS.nocursantes].forEach((rowNum) => {
              // Limpiar BE
              const cellBE = sheet.getCell(`BE${rowNum}`);
              if (cellBE.value === '#' || cellBE.value === '#¡REF!' || cellBE.value === '#¡VALOR!' || String(cellBE.value || '').includes('#')) {
                cellBE.value = '';
                cellBE.numFmt = null;
              }
              // Limpiar BF si tiene errores
              const cellBF = sheet.getCell(`BF${rowNum}`);
              if (cellBF.value === '#' || cellBF.value === '#¡REF!' || cellBF.value === '#¡VALOR!' || String(cellBF.value || '').includes('#')) {
                // Solo limpiar si no es un número válido
                const notaNumber = parseNotaNumber(cellBF.value);
                if (notaNumber === null) {
                  cellBF.value = '';
                  cellBF.numFmt = null;
                }
              }
            });
          }
          
          subjectColumns.forEach(({ col }) => {
            const materiaStats = summaryData.porMateria[col] || { aprobados: 0, reprobados: 0, nocursantes: 0 };
            setCellValue(sheet, col, SUMMARY_ROWS.inscritos, summaryData.totalEstudiantes, {
              alignment: { horizontal: 'center', vertical: 'middle' }
            });
            setCellValue(sheet, col, SUMMARY_ROWS.aprobados, materiaStats.aprobados, {
              alignment: { horizontal: 'center', vertical: 'middle' }
            });
            setCellValue(sheet, col, SUMMARY_ROWS.reprobados, materiaStats.reprobados, {
              alignment: { horizontal: 'center', vertical: 'middle' }
            });
            setCellValue(sheet, col, SUMMARY_ROWS.nocursantes, materiaStats.nocursantes, {
              alignment: { horizontal: 'center', vertical: 'middle' }
            });
          });
        };

        const fillTeacherSection = (sheet, docentes = []) => {
          if (!docentes.length) return;
          
          // Mapeo de nombres de materias por grado
          const materiasPorGrado = {
            '1': ['Castellano', 'Inglés', 'Matemáticas', 'Educación Física', 'Arte y Patrimonio', 'Ciencias Naturales', 'Geografía, Historia y Ciudadanía', 'Orientación y Convivencia', 'Participación en Grupos de Creación, Recreación y Producción'],
            '2': ['Castellano', 'Inglés', 'Matemáticas', 'Educación Física', 'Arte y Patrimonio', 'Ciencias Naturales', 'Geografía, Historia y Ciudadanía', 'Orientación y Convivencia', 'Participación en Grupos de Creación, Recreación y Producción'],
            '3': ['Castellano', 'Inglés', 'Matemáticas', 'Educación Física', 'Física', 'Química', 'Biología', 'Geografía, Historia y Ciudadanía', 'Orientación y Convivencia', 'Participación en Grupos de Creación, Recreación y Producción'],
            '4': ['Castellano', 'Inglés', 'Matemáticas', 'Educación Física', 'Física', 'Química', 'Biología', 'Geografía, Historia y Ciudadanía', 'Formación para la Soberanía Nacional', 'Orientación y Convivencia', 'Participación en Grupos de Creación, Recreación y Producción'],
            '5': ['Castellano', 'Inglés', 'Matemáticas', 'Educación Física', 'Física', 'Química', 'Biología', 'Ciencias de la Tierra', 'Geografía, Historia y Ciudadanía', 'Formación para la Soberanía Nacional', 'Orientación y Convivencia', 'Participación en Grupos de Creación, Recreación y Producción']
          };
          
          const materias = materiasPorGrado[grado] || [];
          
          TEACHER_ROWS.forEach((rowNumber, index) => {
            const docente = docentes[index];
            if (!docente) return;
            const fullName = toTitleCase(
              `${docente.apellido || ''} ${docente.nombre || ''}`.trim()
            );
            if (fullName) {
              setCellValue(sheet, TEACHER_NAME_COLUMN, rowNumber, fullName, { alignLeft: true });
            }
            const cedula = sanitizeString(docente.cedula);
            if (cedula) {
              setCellValue(sheet, TEACHER_ID_COLUMN, rowNumber, cedula, {
                alignment: { horizontal: 'center', vertical: 'middle' }
              });
            }
            // Agregar nombre de la materia en columna Q
            if (materias[index]) {
              setCellValue(sheet, 'Q', rowNumber, materias[index], { alignLeft: true });
            }
          });
        };

        const MAX_STUDENTS_PER_SHEET = formatoSeleccionado.maxStudents || 35;
        const studentsChunks = [];
        for (let i = 0; i < estudiantesParsed.items.length; i += MAX_STUDENTS_PER_SHEET) {
          studentsChunks.push(estudiantesParsed.items.slice(i, i + MAX_STUDENTS_PER_SHEET));
        }
        if (studentsChunks.length === 0) studentsChunks.push([]);
        const summaryData = buildSubjectStats(estudiantesParsed.items);

        const fillSheet = (sheet, students, options = {}) => {
          const maxRows = options.maxRows || MAX_STUDENTS_PER_SHEET;
          students.forEach((est, idx) => {
            const currentRow = START_ROW + idx;
            setCellValue(sheet, columnMap.cedula, currentRow, est.cedula, { alignLeft: true });
            setCellValue(sheet, columnMap.apellidos, currentRow, est.apellido, { alignLeft: true });
            setCellValue(sheet, columnMap.nombres, currentRow, est.nombre, { alignLeft: true });
            setCellValue(sheet, columnMap.lugarNacimiento, currentRow, est.lugarNacimiento, {
              alignLeft: true
            });
            setCellValue(sheet, columnMap.ef, currentRow, est.ef, { alignLeft: true });
            setCellValue(sheet, columnMap.sexo, currentRow, est.sexo, { alignLeft: true });
            setCellValue(sheet, columnMap.dia, currentRow, est.fechaNacimiento?.dia || '', {
              alignLeft: true
            });
            setCellValue(sheet, columnMap.mes, currentRow, est.fechaNacimiento?.mes || '', {
              alignLeft: true
            });
            setCellValue(sheet, columnMap.anio, currentRow, est.fechaNacimiento?.anio || '', {
              alignLeft: true
            });

            subjectColumns.forEach(({ col, keys }) => {
              const nota = getNotaByMateria(est, keys);
              const valorFormateado = formatLetterGradeIfNeeded(nota, keys);
              const displayValue =
                valorFormateado === undefined ||
                valorFormateado === null ||
                valorFormateado === ''
                  ? '***'
                  : valorFormateado;
              setCellValue(sheet, col, currentRow, displayValue, { alignLeft: true });
            });
            
            // Para 4º año, limpiar la columna BE que está entre BD y BF para evitar errores
            if (grado === '4') {
              const cellBE = sheet.getCell(`BE${currentRow}`);
              if (cellBE.value === '#' || cellBE.value === '#¡REF!' || cellBE.value === '#¡VALOR!') {
                cellBE.value = '';
                cellBE.numFmt = null;
              }
            }
          });

          for (let idx = students.length; idx < maxRows; idx += 1) {
            const currentRow = START_ROW + idx;
            Object.values(columnMap).forEach((col) => {
              setCellValue(sheet, col, currentRow, PLACEHOLDER_VALUE, { alignLeft: true });
            });
            subjectColumns.forEach(({ col }) => {
              setCellValue(sheet, col, currentRow, PLACEHOLDER_VALUE, { alignLeft: true });
            });
            
            // Para 4º año, limpiar la columna BE en filas vacías también
            if (grado === '4') {
              const cellBE = sheet.getCell(`BE${currentRow}`);
              if (cellBE.value === '#' || cellBE.value === '#¡REF!' || cellBE.value === '#¡VALOR!') {
                cellBE.value = '';
                cellBE.numFmt = null;
              }
            }
          }

          if (options.summaryData) {
            fillSummaryRows(sheet, options.summaryData);
          }

          if (options.docentes) {
            fillTeacherSection(sheet, options.docentes);
          }

          if (options.seccion) {
            const sectionCell = sheet.getCell(`${SECTION_CELL.column}${SECTION_CELL.row}`);
            const originalSectionFormat = sectionCell.numFmt;
            sectionCell.value = options.seccion;
            if (originalSectionFormat) {
              sectionCell.numFmt = originalSectionFormat;
            }
            sectionCell.font = { name: 'Arial', size: 9, bold: false };
            sectionCell.alignment = { horizontal: 'left', vertical: 'middle' };
          }

          if (typeof options.totalGeneral === 'number') {
            const totalGeneralCell = sheet.getCell(`${TOTAL_GENERAL_CELL.column}${TOTAL_GENERAL_CELL.row}`);
            const originalTotalGeneralFormat = totalGeneralCell.numFmt;
            const originalTotalGeneralAlignment = totalGeneralCell.alignment;
            totalGeneralCell.value = options.totalGeneral;
            if (originalTotalGeneralFormat) {
              totalGeneralCell.numFmt = originalTotalGeneralFormat;
            }
            if (originalTotalGeneralAlignment) {
              totalGeneralCell.alignment = originalTotalGeneralAlignment;
            } else {
              totalGeneralCell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            totalGeneralCell.font = totalGeneralCell.font || { name: 'Arial', size: 9, bold: false };
          }

          if (typeof options.totalPagina === 'number') {
            const pageTotalCell = sheet.getCell(`${PAGE_TOTAL_CELL.column}${PAGE_TOTAL_CELL.row}`);
            const originalPageTotalFormat = pageTotalCell.numFmt;
            const originalPageTotalAlignment = pageTotalCell.alignment;
            pageTotalCell.value = options.totalPagina;
            if (originalPageTotalFormat) {
              pageTotalCell.numFmt = originalPageTotalFormat;
            }
            if (originalPageTotalAlignment) {
              pageTotalCell.alignment = originalPageTotalAlignment;
            } else {
              pageTotalCell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
            pageTotalCell.font = pageTotalCell.font || { name: 'Arial', size: 9, bold: false };
          }

          if (options.observaciones) {
            fillObservaciones(sheet, options.observaciones);
          }
          fillInstitutionData(sheet);
          fillAcademicInfo(sheet, tipoEvaluacionLabel);
          fillAnioCursado(sheet);
          fillRemisionSection(sheet);
        };

        const { wb: baseWorkbook, sheet: baseSheet } = await loadSheetWithImages();
        const templateSheetName =
          baseSheet.name || formatoSeleccionado.sheetFallback || 'RESUMEN';
        const totalEstudiantes = estudiantesParsed.items.length;
        const docentesParaPlanilla = docentesParsed.items || [];
        const firstChunk = studentsChunks[0] || [];
        fillSheet(baseSheet, firstChunk, {
          summaryData,
          docentes: docentesParaPlanilla,
          seccion,
          totalGeneral: totalEstudiantes,
          totalPagina: firstChunk.length,
          observaciones
        });

        for (let chunkIndex = 1; chunkIndex < studentsChunks.length; chunkIndex += 1) {
          const sheetName = `${templateSheetName}_${chunkIndex + 1}`;
          const { sheet: tempSheet, images: tempImages } = await loadSheetWithImages();
          const currentChunk = studentsChunks[chunkIndex] || [];
          fillSheet(tempSheet, currentChunk, {
            summaryData,
            docentes: docentesParaPlanilla,
            seccion,
            totalGeneral: totalEstudiantes,
            totalPagina: currentChunk.length,
            observaciones
          });
          const newSheet = baseWorkbook.addWorksheet(sheetName);
          copySheetContents(tempSheet, newSheet, tempImages, baseWorkbook);
        }

        const generatedBuffer = await baseWorkbook.xlsx.writeBuffer();
        excelBase64 = generatedBuffer.toString('base64');
        const nombreArchivo = formatoSeleccionado.nombreArchivo || `${grado}Año`;
        excelFileName = `Resumen_Final_${nombreArchivo}_${new Date().toISOString().split('T')[0]}.xlsx`;
      } catch (templateError) {
        console.error('Error al generar Excel desde plantilla:', templateError);
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: 'Resumen final almacenado correctamente.',
      resumenId: resumen._id,
      totales: resumen.totales,
      excelBase64,
      excelFileName
    });
  } catch (error) {
    console.error('Error al guardar resumen final:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar los archivos de resumen final.' },
      { status: 500 }
    );
  }
}

