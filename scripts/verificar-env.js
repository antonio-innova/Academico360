#!/usr/bin/env node

/**
 * Script para verificar la configuración de variables de entorno
 * Ejecutar con: node scripts/verificar-env.js
 */

console.log('🔍 Verificando configuración de variables de entorno...\n');

// Verificar variables críticas
const variablesRequeridas = [
  'MONGODB_URI',
  'NODE_ENV'
];

const variablesOpcionales = [
  'PORT'
];

console.log('📋 Variables requeridas:');
variablesRequeridas.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
  } else {
    console.log(`  ❌ ${varName}: NO DEFINIDA`);
  }
});

console.log('\n📋 Variables opcionales:');
variablesOpcionales.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`  ✅ ${varName}: ${value}`);
  } else {
    console.log(`  ⚠️  ${varName}: NO DEFINIDA (usando valor por defecto)`);
  }
});

console.log('\n🔧 Estado de la configuración:');
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`  Entorno: ${nodeEnv}`);

if (nodeEnv === 'production') {
  if (!process.env.MONGODB_URI) {
    console.log('  ❌ ERROR: En producción, MONGODB_URI debe estar definida');
    process.exit(1);
  } else {
    console.log('  ✅ Configuración de producción válida');
  }
} else {
  console.log('  ✅ Configuración de desarrollo válida');
}

console.log('\n📝 Instrucciones:');
console.log('  1. Si ves ❌, crea o actualiza tu archivo .env');
console.log('  2. Copia env.example como .env si no existe');
console.log('  3. Configura las variables con tus valores reales');
console.log('  4. Ejecuta este script nuevamente para verificar');

console.log('\n✨ Verificación completada!');
