/**
 * Script para actualizar el _id de Miguel Andrés Carrasquero.
 *
 * Modo de uso (mongosh):
 *   mongosh "TU_URI" scripts/update_miguel_id.js
 *
 * Asegúrate de apuntar a la base correcta (DBAcademico) en TU_URI.
 */

const oldId = ObjectId('650000000000000000000062');
const newId = ObjectId('68c2ef0e02fdc26e5df6ac36');

// Evitar duplicados en el _id nuevo
if (db.estudiantes.findOne({ _id: newId })) {
  throw new Error('Ya existe un documento con el _id nuevo. Deteniendo.');
}

const doc = db.estudiantes.findOne({ _id: oldId });
if (!doc) {
  throw new Error('No se encontró el documento con el _id viejo.');
}

// Clonar con nuevo _id
doc._id = newId;
db.estudiantes.insertOne(doc);

// Borrar el viejo
db.estudiantes.deleteOne({ _id: oldId });

print('Actualizado correctamente. Verificación:');
printjson(db.estudiantes.findOne({ _id: newId }));



