import { NextResponse } from 'next/server';

// Este archivo ya no se utiliza en la aplicación
// Se ha eliminado la funcionalidad de puntos extras

export async function POST(request) {
  return NextResponse.json({ 
    success: false, 
    message: 'Esta API ha sido desactivada' 
  }, { status: 410 });
}
