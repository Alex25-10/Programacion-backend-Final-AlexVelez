
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// Eventos de conexión mejorados
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB conectado exitosamente!');
});

mongoose.connection.on('error', (err) => {
  console.error(`🔴 Error de conexión: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 MongoDB desconectado - Intentando reconexión...');
  setTimeout(connectDB, 5000);
});

// Conexión principal con verificación de singleton
let isConnecting = false;

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('ℹ️ Usando conexión existente a MongoDB');
      return;
    }
    if (isConnecting) {
      console.log('ℹ️ Conexión a MongoDB en progreso...');
      return;
    }

    isConnecting = true;
    console.log('🔵 Intentando conectar a MongoDB...');
    
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Conexión a MongoDB establecida');

    // Manejo de cierre de conexión
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('✋ Conexión a MongoDB cerrada por terminación de la app');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error crítico al conectar a MongoDB:', error.message);
    // Reintentar conexión después de 5 segundos
    setTimeout(connectDB, 5000);
  } finally {
    isConnecting = false;
  }
};

// Verificación de estado mejorada
export const checkDBStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    dbName: mongoose.connection.name || 'not-connected',
    host: mongoose.connection.host || 'none',
    ping: mongoose.connection.db ? 'alive' : 'dead',
    mongoVersion: mongoose.version
  };
};