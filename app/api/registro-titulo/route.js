import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

const TEMPLATE_PATH = path.join(process.cwd(), 'public', 'notatitulo.xlsx');
const STORAGE_DIR = path.join(process.cwd(), 'public', 'uploads', 'registro-titulo');
const STUDENT_ROW_START = 17;
const STUDENT_ROW_END = 41;
const STUDENTS_PER_SHEET = STUDENT_ROW_END - STUDENT_ROW_START + 1;

const DEFAULT_SCHOOL = {
  codigo: 'P000012200',
  denominacionEponimo: 'Unidad Educativa Colegio Las Acacias',
  direccion: 'Av. Bolívar Norte Calle 25 y 26, Valera',
  telefono: '0271-2301303',
  municipio: 'Valera',
  entidadFederal: 'Trujillo',
  cdcee: 'Unidad Educativa Colegio Las Acacias'
};

const normalize = (value) =>
  (value ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const getPlainValue = (cellValue) => {
  if (cellValue === null || cellValue === undefined) return '';
  if (typeof cellValue === 'object') {
    if (Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((t) => t.text).join('');
    }
    if (cellValue.text) return cellValue.text;
    if (cellValue.result) return cellValue.result;
    if (cellValue.formula) return cellValue.result ?? '';
  }
  return cellValue;
};

const toNumberString = (value) => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return value.toString();
  const parsed = Number(value);
  if (!Number.isNaN(parsed)) return parsed.toString();
  return String(value);
};

const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const captureSheetSnapshot = (sheet) => {
  const snapshot = {
    properties: { ...sheet.properties },
    pageSetup: { ...sheet.pageSetup },
    views: sheet.views ? deepClone(sheet.views) : undefined,
    columns: sheet.columns
      ? sheet.columns.map((col) => ({
          width: col.width,
          hidden: col.hidden,
          outlineLevel: col.outlineLevel,
          style: col.style ? deepClone(col.style) : undefined
        }))
      : [],
    rows: [],
    merges: sheet._merges ? Array.from(sheet._merges) : []
  };

  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const rowSnapshot = {
      number: rowNumber,
      height: row.height,
      cells: []
    };
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowSnapshot.cells.push({
        col: colNumber,
        value: deepClone(cell.value),
        numFmt: cell.numFmt,
        font: cell.font ? { ...cell.font } : undefined,
        alignment: cell.alignment ? { ...cell.alignment } : undefined,
        border: cell.border ? deepClone(cell.border) : undefined,
        fill: cell.fill ? deepClone(cell.fill) : undefined,
        style: cell.style ? deepClone(cell.style) : undefined
      });
    });
    snapshot.rows.push(rowSnapshot);
  });

  return snapshot;
};

const applySnapshotToSheet = (sheet, snapshot) => {
  sheet.properties = { ...snapshot.properties };
  sheet.pageSetup = { ...snapshot.pageSetup };
  sheet.views = snapshot.views ? deepClone(snapshot.views) : undefined;

  if (snapshot.columns && snapshot.columns.length) {
    sheet.columns = snapshot.columns.map((col) => ({
      width: col.width,
      hidden: col.hidden,
      outlineLevel: col.outlineLevel,
      style: col.style ? deepClone(col.style) : undefined
    }));
  }

  snapshot.rows.forEach((rowSnapshot) => {
    const row = sheet.getRow(rowSnapshot.number);
    row.height = rowSnapshot.height;
    rowSnapshot.cells.forEach((cellSnapshot) => {
      const cell = row.getCell(cellSnapshot.col);
      cell.value = deepClone(cellSnapshot.value);
      if (cellSnapshot.numFmt) cell.numFmt = cellSnapshot.numFmt;
      if (cellSnapshot.font) cell.font = { ...cellSnapshot.font };
      if (cellSnapshot.alignment) cell.alignment = { ...cellSnapshot.alignment };
      if (cellSnapshot.border) cell.border = deepClone(cellSnapshot.border);
      if (cellSnapshot.fill) cell.fill = deepClone(cellSnapshot.fill);
      if (cellSnapshot.style) cell.style = deepClone(cellSnapshot.style);
    });
    if (typeof row.commit === 'function') row.commit();
  });

  if (snapshot.merges && snapshot.merges.length) {
    snapshot.merges.forEach((range) => sheet.mergeCells(range));
  }
};

const fillHeader = (sheet, schoolData, docData) => {
  sheet.getCell('K7').value = schoolData.codigo || '';
  sheet.getCell('AT7').value = schoolData.denominacionEponimo || schoolData.nombre || '';
  sheet.getCell('Q8').value = schoolData.direccion || '';
  sheet.getCell('BK8').value = schoolData.telefono || '';
  sheet.getCell('I9').value = schoolData.municipio || '';
  sheet.getCell('AE9').value = schoolData.entidadFederal || '';
  sheet.getCell('BK9').value = schoolData.cdcee || '';
  sheet.getCell('W13').value = docData.documentoNombre || '';
  sheet.getCell('AW13').value = docData.documentoCodigo || '';
};

const fillStudentRows = (sheet, studentsChunk) => {
  studentsChunk.forEach((student, index) => {
    const targetRow = STUDENT_ROW_START + index;
    sheet.getCell(`J${targetRow}`).value = student.cedula || '';
    sheet.getCell(`Z${targetRow}`).value = student.nombreCompleto || '';
    sheet.getCell(`AI${targetRow}`).value = student.entidadFederal || '';
    sheet.getCell(`AN${targetRow}`).value = student.lugarNacimiento || '';
    sheet.getCell(`AS${targetRow}`).value = student.dia || '';
    sheet.getCell(`AT${targetRow}`).value = student.mes || '';
    sheet.getCell(`AW${targetRow}`).value = student.anio || '';
  });
};

const REQUIRED_HEADERS = {
  cedula: ['cedula', 'cedula de identidad', 'cédula', 'cédula de identidad'],
  apellido: ['apellido', 'apellidos'],
  nombre: ['nombre', 'nombres'],
  lugarNacimiento: ['lugar de nacimiento', 'lugar nacimiento', 'lugar'],
  entidadFederal: ['ef', 'entidad federal', 'estado'],
  dia: ['dia', 'día'],
  mes: ['mes'],
  anio: ['ano', 'año']
};

const buildHeaderMap = (row) => {
  const map = {};
  row.eachCell((cell, colNumber) => {
    const key = normalize(getPlainValue(cell.value));
    if (key) map[key] = colNumber;
  });
  return map;
};

const resolveColumn = (headerMap, aliases) => {
  for (const alias of aliases) {
    if (headerMap[alias]) return headerMap[alias];
  }
  return null;
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const excelFile = formData.get('excel');
    const payloadRaw = formData.get('payload');

    if (!excelFile || typeof excelFile === 'string') {
      return NextResponse.json(
        { success: false, message: 'No se recibió el archivo Excel requerido.' },
        { status: 400 }
      );
    }

    const templateExists = await fs
      .access(TEMPLATE_PATH)
      .then(() => true)
      .catch(() => false);

    if (!templateExists) {
      return NextResponse.json(
        { success: false, message: 'No se encontró la plantilla notatitulo.xlsx en la carpeta public.' },
        { status: 404 }
      );
    }

    const uploadBuffer = Buffer.from(await excelFile.arrayBuffer());
    let payload = {};
    if (payloadRaw) {
      try {
        payload = JSON.parse(payloadRaw);
      } catch (error) {
        console.warn('No se pudo parsear el payload del registro de título:', error);
      }
    }

    const workbookSource = new ExcelJS.Workbook();
    await workbookSource.xlsx.load(uploadBuffer);
    const sourceSheet = workbookSource.worksheets[0];
    if (!sourceSheet) {
      return NextResponse.json(
        { success: false, message: 'El Excel proporcionado no contiene hojas válidas.' },
        { status: 400 }
      );
    }

    const headerRow = sourceSheet.getRow(1);
    const headerMap = buildHeaderMap(headerRow);

    const columnIndexes = Object.fromEntries(
      Object.entries(REQUIRED_HEADERS).map(([key, aliases]) => [key, resolveColumn(headerMap, aliases.map(normalize))])
    );

    for (const [key, index] of Object.entries(columnIndexes)) {
      if (!index) {
        return NextResponse.json(
          { success: false, message: `No se encontró la columna requerida para "${key}" en el Excel recibido.` },
          { status: 400 }
        );
      }
    }

    const students = [];
    sourceSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cedula = getPlainValue(row.getCell(columnIndexes.cedula).value);
      const nombre = getPlainValue(row.getCell(columnIndexes.nombre).value);
      const apellido = getPlainValue(row.getCell(columnIndexes.apellido).value);
      const lugar = getPlainValue(row.getCell(columnIndexes.lugarNacimiento).value);
      const entidadFederal = getPlainValue(row.getCell(columnIndexes.entidadFederal).value);
      const dia = toNumberString(getPlainValue(row.getCell(columnIndexes.dia).value));
      const mes = toNumberString(getPlainValue(row.getCell(columnIndexes.mes).value));
      const anio = toNumberString(getPlainValue(row.getCell(columnIndexes.anio).value));

      if (
        !cedula &&
        !nombre &&
        !apellido &&
        !lugar &&
        !entidadFederal &&
        !dia &&
        !mes &&
        !anio
      ) {
        return;
      }

      students.push({
        cedula: cedula ? cedula.toString().trim() : '',
        nombreCompleto: `${nombre || ''} ${apellido || ''}`.trim(),
        lugarNacimiento: lugar ? lugar.toString().trim() : '',
        entidadFederal: entidadFederal ? entidadFederal.toString().trim() : '',
        dia,
        mes,
        anio
      });
    });

    if (students.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No se encontraron registros de estudiantes en el Excel cargado.' },
        { status: 400 }
      );
    }

    const schoolData = {
      ...DEFAULT_SCHOOL,
      ...(payload?.colegio || {})
    };

    const docData = {
      documentoNombre: payload?.documentoNombre || '',
      documentoCodigo: payload?.documentoCodigo || ''
    };

    const templateWorkbook = new ExcelJS.Workbook();
    await templateWorkbook.xlsx.readFile(TEMPLATE_PATH);
    const baseSheet = templateWorkbook.worksheets[0];
    if (!baseSheet) {
      return NextResponse.json(
        { success: false, message: 'La plantilla notatitulo.xlsx no contiene una hoja válida.' },
        { status: 500 }
      );
    }

    const templateSnapshot = captureSheetSnapshot(baseSheet);
    const baseName = baseSheet.name || 'REGISTRO_TITULO';

    const studentChunks = chunkArray(students, STUDENTS_PER_SHEET);
    studentChunks.forEach((chunk, index) => {
      const sheet =
        index === 0
          ? baseSheet
          : (() => {
              let suffix = index + 1;
              let sheetName = `${baseName}_${suffix}`;
              while (templateWorkbook.getWorksheet(sheetName)) {
                suffix += 1;
                sheetName = `${baseName}_${suffix}`;
              }
              const cloneSheet = templateWorkbook.addWorksheet(sheetName);
              applySnapshotToSheet(cloneSheet, templateSnapshot);
              return cloneSheet;
            })();

      fillHeader(sheet, schoolData, docData);
      fillStudentRows(sheet, chunk);
    });

    const outputBuffer = await templateWorkbook.xlsx.writeBuffer();
    const base64 = Buffer.from(outputBuffer).toString('base64');
    const outputFileName = `Registro_Titulo_${Date.now()}.xlsx`;

    return NextResponse.json({
      success: true,
      message: 'Registro de título generado correctamente.',
      fileName: outputFileName,
      excelBase64: base64,
      totalEstudiantes: students.length,
      hojasGeneradas: studentChunks.length
    });
  } catch (error) {
    console.error('Error en el registro de título:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar el registro de título.', error: error.message },
      { status: 500 }
    );
  }
}

