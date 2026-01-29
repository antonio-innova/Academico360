import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Director from '@/database/models/Director';

const DIRECTOR_KEY = 'global';

export async function GET() {
  try {
    await connectDB();
    const director = await Director.findOne({ key: DIRECTOR_KEY }).lean();
    return NextResponse.json({
      success: true,
      data: director ? { nombre: director.nombre, cedula: director.cedula } : null
    });
  } catch (error) {
    console.error('GET /api/director error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function upsertDirector(request) {
  await connectDB();
  const body = await request.json();

  const nombre = String(body?.nombre || '').trim();
  const cedula = String(body?.cedula || '').trim();

  if (!nombre || !cedula) {
    return NextResponse.json(
      { success: false, message: 'Faltan datos requeridos (nombre, cedula)' },
      { status: 400 }
    );
  }

  const actualizadoPor = body?.actualizadoPor ? String(body.actualizadoPor) : 'control';

  const director = await Director.findOneAndUpdate(
    { key: DIRECTOR_KEY },
    { key: DIRECTOR_KEY, nombre, cedula, actualizadoPor },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({
    success: true,
    data: { nombre: director.nombre, cedula: director.cedula }
  });
}

export async function PUT(request) {
  try {
    return await upsertDirector(request);
  } catch (error) {
    console.error('PUT /api/director error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// Opcional: soportar POST por compatibilidad
export async function POST(request) {
  try {
    return await upsertDirector(request);
  } catch (error) {
    console.error('POST /api/director error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

