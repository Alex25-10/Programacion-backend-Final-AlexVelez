const fs = require('fs').promises;
const path = require('path');

class CartManager {
  constructor() {
    // Usa path.resolve para rutas absolutas confiables
    this.path = path.resolve(__dirname, '../../data/carts.json');
    this.initializeFile().catch(console.error); // Manejo de error inicial
  }

  async initializeFile() {
    try {
      // Verifica si el directorio existe, si no, lo crea
      await fs.mkdir(path.dirname(this.path), { recursive: true });
      
      // Verifica si el archivo existe
      try {
        await fs.access(this.path);
      } catch {
        // Si no existe, lo crea con array vacío
        await fs.writeFile(this.path, '[]', 'utf8');
      }
    } catch (error) {
      console.error('Error inicializando archivo:', error);
      throw error;
    }
  }

  // ... resto de tus métodos
}

module.exports = CartManager; // ¡Exportación correcta!