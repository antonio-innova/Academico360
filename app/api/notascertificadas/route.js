import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import NotaCertificada from '@/database/models/NotaCertificada';

export async function GET(request) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const cedula = searchParams.get('cedula');

    const filter = {};
    if (cedula) {
      filter['estudiante.cedula'] = cedula;
    }

    const notas = await NotaCertificada.find(filter).sort({ fechaCreacion: -1 }).lean();
    return NextResponse.json({ success: true, data: notas });
  } catch (error) {
    console.error('GET /api/notascertificadas error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body?.estudiante?.cedula || !body?.estudiante?.nombres || !body?.estudiante?.apellidos) {
      return NextResponse.json({ success: false, message: 'Faltan datos del estudiante' }, { status: 400 });
    }

    const doc = await NotaCertificada.create({
      institucion: body.institucion || {},
      estudiante: body.estudiante,
      periodo: body.periodo || '',
      anioEscolar: body.anioEscolar || '',
      planEstudio: Array.isArray(body.planEstudio) ? body.planEstudio : [],
      observaciones: body.observaciones || '',
      creadoPor: body.creadoPor || 'control'
    });

    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    console.error('POST /api/notascertificadas error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}



