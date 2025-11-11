import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Aula from '@/database/models/Aula';
import Estudiante from '@/database/models/Estudiante';

export async function GET(request) {
  try {
    await connectDB();

    const XLSX = await import('xlsx');
    const searchParams = request.nextUrl.searchParams;
    const aulaId = searchParams.get('aulaId');
    const momento = parseInt(searchParams.get('momento') || '1', 10);

    if (!aulaId || ![1,2,3].includes(momento)) {
      return NextResponse.json({ success: false, message: 'Parámetros inválidos (aulaId y momento requerido)' }, { status: 400 });
    }

    const aula = await Aula.findById(aulaId).lean();
    if (!aula) {
      return NextResponse.json({ success: false, message: 'Aula no encontrada' }, { status: 404 });
    }

    const asignacionesAula = Array.isArray(aula.asignaciones) ? aula.asignaciones : [];

    // Materias únicas en el orden en que están en el aula
    const materiasOrdenadas = Array.from(new Set(
      asignacionesAula
        .filter(a => a.materia && a.materia.nombre)
        .map(a => a.materia.nombre)
    ));

    // Obtener estudiantes desde la colección principal para nombres correctos
    const estudiantesIds = (aula.alumnos || []).map(al => al._id?.toString()).filter(Boolean);
    const cedulasLista = (aula.alumnos || []).map(al => al.idU || al.cedula).filter(Boolean);
    const estudiantesDocs = await Estudiante.find({
      $or: [
        { _id: { $in: estudiantesIds } },
        { idU: { $in: cedulasLista } }
      ]
    }).select('_id idU nombre apellido').lean();

    const idToInfo = new Map(estudiantesDocs.map(e => [e._id.toString(), e]));
    const idUToInfo = new Map(estudiantesDocs.map(e => [(e.idU || '').toString(), e]));

    // Utilitarios
    const esNoCuantitativa = (nombreMateria = '') => {
      const n = String(nombreMateria).toLowerCase();
      return ['orientación','orientacion','grupo','participación','participacion','orientación y convivencia','orientacion y convivencia'].includes(n);
    };

    const entero = (v) => {
      const n = parseFloat(v);
      return isNaN(n) ? '' : Math.round(n).toString();
    };

    // Calcular EV1..EV5 y NF por materia para el momento seleccionado
    const estudiantesConNF = (aula.alumnos || []).map((alumno, idx) => {
      const estudianteId = alumno._id?.toString() || alumno.id || '';
      let estDoc = idToInfo.get(estudianteId);
      if (!estDoc && (alumno.idU || alumno.cedula)) {
        estDoc = idUToInfo.get(String(alumno.idU || alumno.cedula));
      }
      const cedula = estDoc?.idU || alumno.idU || alumno.cedula || '';
      const apellido = (estDoc?.apellido && estDoc.apellido.trim()) || alumno.apellido || '';
      const nombre = (estDoc?.nombre && estDoc.nombre.trim()) || alumno.nombre || '';

      const detallePorMateria = {};
      for (const asig of asignacionesAula) {
        const nombreMateria = asig.materia?.nombre || 'Materia';
        const bloqueado = asig.momentosBloqueados?.[momento] === true;
        if (!detallePorMateria[nombreMateria]) detallePorMateria[nombreMateria] = { ev: ['', '', '', '', ''], nf: '' };
        if (bloqueado) {
          detallePorMateria[nombreMateria] = { ev: ['', '', '', '', ''], nf: '' };
          continue;
        }

        const actividades = Array.isArray(asig.actividades) ? asig.actividades : [];
        const parseFecha = (f) => {
          if (!f) return 0;
          if (typeof f === 'string' && f.includes('/')) {
            const parts = f.split(/[\/\-]/).map(p => parseInt(p, 10));
            // dd/mm/yyyy
            if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
              return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
            }
          }
          const t = new Date(f).getTime();
          return isNaN(t) ? 0 : t;
        };
        const actsMomento = actividades
          .filter(a => parseInt(a.momento) === momento)
          .sort((a, b) => parseFecha(a.fecha) - parseFecha(b.fecha));

        const notas = [];
        const ev = ['', '', '', '', ''];
        let evIndex = 0;
        for (const act of actsMomento) {
          const cal = (act.calificaciones || []).find(c => (c.alumnoId?.toString?.() || String(c.alumnoId)) === estudianteId);
          if (cal && cal.nota !== undefined && cal.nota !== null) {
            notas.push(parseFloat(cal.nota));
            if (evIndex < 5) {
              ev[evIndex] = entero(cal.nota);
              evIndex++;
            }
          } else {
            if (evIndex < 5) {
              ev[evIndex] = '';
              evIndex++;
            }
          }
        }

        if (notas.length === 0) {
          detallePorMateria[nombreMateria] = { ev, nf: '' };
        } else if (esNoCuantitativa(nombreMateria)) {
          detallePorMateria[nombreMateria] = { ev, nf: entero(notas[notas.length - 1]) };
        } else {
          const suma = notas.reduce((a,b) => a + (isNaN(b) ? 0 : b), 0);
          detallePorMateria[nombreMateria] = { ev, nf: entero(suma / notas.length) };
        }
      }

      return {
        orden: idx + 1,
        cedula,
        nombreCompleto: `${apellido} ${nombre}`.trim(),
        detallePorMateria
      };
    });

    // Orden por cédula
    estudiantesConNF.sort((a, b) => (a.cedula || '').localeCompare(b.cedula || '', undefined, { numeric: true }));
    estudiantesConNF.forEach((e, i) => { e.orden = i + 1; });

    // Construcción de hoja: N°, Nombre, Cédula + por materia: EV1..EV5, NF
    const headers = ['N°', 'Nombre', 'Cédula'];
    const subHeaders = [];
    materiasOrdenadas.forEach(() => {
      subHeaders.push('EV1','EV2','EV3','EV4','EV5','NF');
    });

    // Encabezado principal por materia (texto repetido antes de subheaders)
    const headerMaterias = ['N°', 'Nombre', 'Cédula'];
    materiasOrdenadas.forEach(mat => headerMaterias.push(mat, '', '', '', '', '', ''));

    const data = [headerMaterias, headers.concat(materiasOrdenadas.flatMap(() => subHeaders))];

    estudiantesConNF.forEach(est => {
      const row = [est.orden, est.nombreCompleto, est.cedula];
      materiasOrdenadas.forEach(mat => {
        const det = est.detallePorMateria[mat] || { ev: ['', '', '', '', ''], nf: '' };
        row.push(...det.ev, det.nf);
      });
      data.push(row);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Anchos: N°, Nombre amplio, Cédula medio, resto estrechos
    const cols = [{ wch: 4 }, { wch: 35 }, { wch: 14 }];
    materiasOrdenadas.forEach(() => cols.push({ wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }, { wch: 4 }));
    ws['!cols'] = cols;

    // Nombre de hoja
    const nombreAula = `${aula.anio || ''}${aula.seccion || ''}`.trim() || 'Aula';
    XLSX.utils.book_append_sheet(wb, ws, `${nombreAula} ${momento}M`);

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const fecha = new Date().toISOString().split('T')[0];
    const archivo = `SABANA_${nombreAula.replace(/\s+/g,'_')}_${momento}M_${fecha}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${archivo}"`
      }
    });
  } catch (error) {
    console.error('Error al generar sábana:', error);
    return NextResponse.json({ success: false, message: `Error al generar sábana: ${error.message}` }, { status: 500 });
  }
}


