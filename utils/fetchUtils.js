/**
 * Utilidad para manejar las respuestas de fetch de manera segura
 * Evita el error "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"
 * @param {Response} response - La respuesta de fetch
 * @returns {Promise<any>} - Los datos de la respuesta
 */
export async function handleApiResponse(response) {
  // Verificar si la respuesta es exitosa
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error en la respuesta:', response.status, response.statusText);
    console.error('Contenido de la respuesta:', errorText.substring(0, 200) + '...');
    throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
  }
  
  // Verificar el tipo de contenido antes de intentar parsear como JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    try {
      // Intentar leer el texto de la respuesta para diagnóstico
      const text = await response.text();
      console.error('Respuesta no JSON recibida:', text.substring(0, 200) + '...');
      throw new Error('La respuesta del servidor no es JSON válido');
    } catch (error) {
      console.error('Error al leer la respuesta:', error);
      throw new Error('Error al procesar la respuesta del servidor');
    }
  }
  
  // Si llegamos aquí, la respuesta es JSON válido
  try {
    return await response.json();
  } catch (error) {
    console.error('Error al parsear JSON:', error);
    throw new Error('Error al parsear la respuesta JSON del servidor');
  }
}
