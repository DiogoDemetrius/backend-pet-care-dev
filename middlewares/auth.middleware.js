const jwt = require('jsonwebtoken');

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não está definido nas variáveis de ambiente');
}

const authMiddleware = {
  /**
   * Middleware para verificar o token JWT
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   * @param {Function} next - Função next
   */
  verifyToken: (req, res, next) => {
    try {
      // Pegar o token do header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ message: 'Token não fornecido' });
      }
      
      // Formato esperado: "Bearer [token]"
      const parts = authHeader.split(' ');
      
      if (parts.length !== 2) {
        return res.status(401).json({ message: 'Erro no formato do token' });
      }
      
      const [scheme, token] = parts;
      
      if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ message: 'Token mal formatado' });
      }
      
      // Verificar se o token é válido
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: 'Token inválido ou expirado' });
        }
        
        // Salvar dados do usuário no objeto de requisição para uso posterior
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        };
        
        return next();
      });
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao autenticar token' });
    }
  },
  
  /**
   * Middleware para verificar se o usuário é admin
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   * @param {Function} next - Função next
   */
  isAdmin: (req, res, next) => {
    try {
      // Verifica se o usuário é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso restrito a administradores' });
      }
      
      return next();
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao verificar permissões' });
    }
  }
};

module.exports = authMiddleware;