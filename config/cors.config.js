const cors = require('cors');

const corsOptions = {
  origin: function(origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      '*'];
    
    // Verificar se a origem está na lista ou se não há origem (como em requisições do mesmo domínio)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware de tratamento de preflight OPTIONS
const handleOptions = (req, res, next) => {
  // Se for uma requisição OPTIONS, responda imediatamente com status 200
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
};

// Exporta dois middlewares: o cors configurado e o handler de OPTIONS
module.exports = {
  cors: cors(corsOptions),
  handleOptions
};