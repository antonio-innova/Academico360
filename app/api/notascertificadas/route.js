import { NextResponse } from 'next/server';
import { connectDB } from '@/database/db';
import NotaCertificada from '@/database/models/NotaCertificada';
import mongoose from 'mongoose';

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

    console.log('📥 API recibió programas:', body.programas);
    console.log('📥 API recibió observaciones:', body.observaciones);

    if (!body?.estudiante?.cedula || !body?.estudiante?.nombres || !body?.estudiante?.apellidos) {
      return NextResponse.json({ success: false, message: 'Faltan datos del estudiante' }, { status: 400 });
    }

    const programasData = Array.isArray(body.programas) ? body.programas : [];
    console.log('🔧 Preparando programas para guardar:', programasData);
    
    const docData = {
      institucion: body.institucion || {},
      estudiante: body.estudiante,
      periodo: body.periodo || '',
      anioEscolar: body.anioEscolar || '',
      planEstudio: Array.isArray(body.planEstudio) ? body.planEstudio : [],
      observaciones: body.observaciones || '',
      creadoPor: body.creadoPor || 'control'
    };
    
    // Crear el documento primero (sin programas)
    const doc = await NotaCertificada.create(docData);
    
    // Actualizar los programas usando la colección directamente de MongoDB
    // Esto evita problemas con el schema de Mongoose en caché
    const db = mongoose.connection.db;
    const collection = db.collection('notacertificadas');
    
    const updateResult = await collection.updateOne(
      { _id: doc._id },
      { $set: { programas: programasData } }
    );
    console.log('✅ Resultado de updateOne directo en MongoDB:', updateResult);
    console.log('✅ Programas que se intentaron guardar:', programasData);

    // Recargar el documento completo directamente desde la colección de MongoDB
    const docCompletoRaw = await collection.findOne({ _id: doc._id });
    console.log('✅ Documento completo desde MongoDB (raw):', docCompletoRaw);
    console.log('✅ Programas en documento raw:', docCompletoRaw?.programas);
    
    // También recargar usando Mongoose para mantener consistencia
    const docCompleto = await NotaCertificada.findById(doc._id).lean();
    console.log('✅ Documento completo desde BD con programas:', docCompleto?.programas);
    console.log('✅ Documento completo desde BD con observaciones:', docCompleto?.observaciones);
    
    // Usar el documento raw si Mongoose no lo tiene
    const docFinal = docCompletoRaw || docCompleto;
    
    return NextResponse.json({ success: true, data: docFinal });
  } catch (error) {
    console.error('POST /api/notascertificadas error', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}



