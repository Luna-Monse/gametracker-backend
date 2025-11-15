const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gametracker';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Modelo de Juego
const juegoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  plataforma: String,
  genero: String,
  completado: { type: Boolean, default: false },
  puntuacion: { type: Number, min: 0, max: 5, default: 0 },
  horasJugadas: { type: Number, default: 0 },
  portada: String,
  fechaAgregado: { type: Date, default: Date.now }
});

const Juego = mongoose.model('Juego', juegoSchema);

// Modelo de Reseña
const resenaSchema = new mongoose.Schema({
  juegoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Juego', required: true },
  titulo: String,
  contenido: { type: String, required: true },
  puntuacion: { type: Number, min: 0, max: 5 },
  fecha: { type: Date, default: Date.now }
});

const Resena = mongoose.model('Resena', resenaSchema);

// ==================== RUTAS DE JUEGOS ====================

// GET - Obtener todos los juegos
app.get('/api/juegos', async (req, res) => {
  try {
    const juegos = await Juego.find().sort({ fechaAgregado: -1 });
    res.json(juegos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener juegos' });
  }
});

// GET - Obtener un juego por ID
app.get('/api/juegos/:id', async (req, res) => {
  try {
    const juego = await Juego.findById(req.params.id);
    if (!juego) return res.status(404).json({ error: 'Juego no encontrado' });
    res.json(juego);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el juego' });
  }
});

// POST - Crear un nuevo juego
app.post('/api/juegos', async (req, res) => {
  try {
    const nuevoJuego = new Juego(req.body);
    const juegoGuardado = await nuevoJuego.save();
    res.status(201).json(juegoGuardado);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear el juego' });
  }
});

// PUT - Actualizar un juego
app.put('/api/juegos/:id', async (req, res) => {
  try {
    const juegoActualizado = await Juego.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!juegoActualizado) return res.status(404).json({ error: 'Juego no encontrado' });
    res.json(juegoActualizado);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar el juego' });
  }
});

// DELETE - Eliminar un juego
app.delete('/api/juegos/:id', async (req, res) => {
  try {
    const juegoEliminado = await Juego.findByIdAndDelete(req.params.id);
    if (!juegoEliminado) return res.status(404).json({ error: 'Juego no encontrado' });
    
    // Eliminar reseñas asociadas
    await Resena.deleteMany({ juegoId: req.params.id });
    
    res.json({ mensaje: 'Juego eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el juego' });
  }
});

// ==================== RUTAS DE RESEÑAS ====================

// GET - Obtener todas las reseñas
app.get('/api/resenas', async (req, res) => {
  try {
    const resenas = await Resena.find().populate('juegoId').sort({ fecha: -1 });
    res.json(resenas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

// GET - Obtener reseñas de un juego específico
app.get('/api/resenas/juego/:juegoId', async (req, res) => {
  try {
    const resenas = await Resena.find({ juegoId: req.params.juegoId }).sort({ fecha: -1 });
    res.json(resenas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

// POST - Crear una nueva reseña
app.post('/api/resenas', async (req, res) => {
  try {
    const nuevaResena = new Resena(req.body);
    const resenaGuardada = await nuevaResena.save();
    res.status(201).json(resenaGuardada);
  } catch (error) {
    res.status(400).json({ error: 'Error al crear la reseña' });
  }
});

// PUT - Actualizar una reseña
app.put('/api/resenas/:id', async (req, res) => {
  try {
    const resenaActualizada = await Resena.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!resenaActualizada) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json(resenaActualizada);
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar la reseña' });
  }
});

// DELETE - Eliminar una reseña
app.delete('/api/resenas/:id', async (req, res) => {
  try {
    const resenaEliminada = await Resena.findByIdAndDelete(req.params.id);
    if (!resenaEliminada) return res.status(404).json({ error: 'Reseña no encontrada' });
    res.json({ mensaje: 'Reseña eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la reseña' });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: '🎮 API de GameTracker funcionando' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
