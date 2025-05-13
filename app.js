const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar rotas
const userRoutes = require('./routes/user.routes');
const petRoutes = require('./routes/pet.routes'); // Importar rotas de pets
const parametrosPetRoutes = require('./routes/parametrosPet.routes'); // Importar rotas de parâmetros

// Inicializar app
const app = express();

// Configuração de middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging
app.use(cors()); // Habilitar CORS
app.use(helmet()); // Segurança HTTP

// Rate limiting para evitar ataques de força bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limita cada IP a 100 requisições por janela de 15 minutos
});
app.use('/api/', limiter);

// Rotas
app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes); // Adicionar rotas de pets
app.use('/api/parametros-pet', parametrosPetRoutes); // Adicionar rotas de parâmetros de pets

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

module.exports = app;