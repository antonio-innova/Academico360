import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import Plantel from '@/database/models/Plantel';

// GET - Obtener todos los planteles
export async function GET(request) {
  try {
    await connectDB();
    const planteles = await Plantel.find({}).sort({ nombre: 1 }).lean();
    return NextResponse.json({ success: true, data: planteles });
  } catch (error) {
    console.error('GET /api/planteles error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - Crear un nuevo plantel
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.nombre || !body.localidad || !body.ef) {
      return NextResponse.json({ 
        success: false, 
        message: 'Faltan datos requeridos (nombre, localidad, ef)' 
      }, { status: 400 });
    }

    const plantel = await Plantel.create({
      nombre: body.nombre,
      localidad: body.localidad,
      ef: body.ef,
      creadoPor: body.creadoPor || 'control'
    });

    return NextResponse.json({ success: true, data: plantel });
  } catch (error) {
    console.error('POST /api/planteles error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT - Actualizar un plantel
export async function PUT(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body._id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID del plantel requerido' 
      }, { status: 400 });
    }

    const plantel = await Plantel.findByIdAndUpdate(
      body._id,
      {
        nombre: body.nombre,
        localidad: body.localidad,
        ef: body.ef
      },
      { new: true }
    );

    if (!plantel) {
      return NextResponse.json({ 
        success: false, 
        message: 'Plantel no encontrado' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: plantel });
  } catch (error) {
    console.error('PUT /api/planteles error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE - Eliminar un plantel
export async function DELETE(request) {
  try {
    await connectDB();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID del plantel requerido' 
      }, { status: 400 });
    }

    const plantel = await Plantel.findByIdAndDelete(id);

    if (!plantel) {
      return NextResponse.json({ 
        success: false, 
        message: 'Plantel no encontrado' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Plantel eliminado correctamente' });
  } catch (error) {
    console.error('DELETE /api/planteles error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

