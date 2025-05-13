const userService = require('../services/user.service');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não está definido nas variáveis de ambiente');
}

const userController = {
  /**
   * Cria um novo usuário
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      const newUser = await userService.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Autentica um usuário
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async loginUser(req, res) {
    try {
      const { email, password } = req.body;

      // Verificar se o usuário existe
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Verificar a senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Senha inválida' });
      }

      // Gerar o token JWT
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role }, // Payload
        JWT_SECRET, // Segredo
        { expiresIn: JWT_EXPIRATION } // Opções
      );

      return res.status(200).json({ token });
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao autenticar usuário', error });
    }
  },

  /**
   * Lista todos os usuários com paginação
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      const result = await userService.getAllUsers(page, limit, filters);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Busca um usuário pelo ID
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se o usuário está tentando acessar seus próprios dados ou é admin
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const user = await userService.getUserById(id);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  /**
   * Atualiza um usuário
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Verificar se o usuário está tentando atualizar seus próprios dados ou é admin
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      // Impedir que usuários comuns alterem seu próprio role
      if (req.user.role !== 'admin' && updateData.role) {
        delete updateData.role;
      }
      
      const updatedUser = await userService.updateUser(id, updateData);
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Remove um usuário
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Desativa a conta de um usuário
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar se o usuário está tentando desativar sua própria conta ou é admin
      if (req.user.id !== id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      const result = await userService.deactivateUser(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Reativa a conta de um usuário
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async activateUser(req, res) {
    try {
      const { id } = req.params;
      const result = await userService.activateUser(id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Solicita redefinição de senha
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório' });
      }
      
      const result = await userService.requestPasswordReset(email);
      
      // Em produção, enviar o token por email em vez de retorná-lo diretamente
      // Aqui retornamos para facilitar testes
      res.status(200).json(result);
    } catch (error) {
      // Por segurança, não revelamos se o email existe ou não
      res.status(200).json({ message: 'Se o email existir, um link de redefinição será enviado' });
    }
  },

  /**
   * Redefine a senha com o token
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
      }
      
      const result = await userService.resetPassword(token, newPassword);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  /**
   * Altera a senha do usuário logado
   * @param {Object} req - Objeto de requisição
   * @param {Object} res - Objeto de resposta
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
      }
      
      const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

module.exports = userController;