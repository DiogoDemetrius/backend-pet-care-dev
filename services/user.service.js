const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { isValidObjectId } = require('mongoose');

// Configuração do JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_jwt_secret'; // Use variável de ambiente em produção
const JWT_EXPIRATION = '1d'; // Token expira em 1 dia

const userService = {
  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<Object>} Usuário criado sem a senha
   */
  async createUser(userData) {
    try {
      // Verificar se email já existe
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('Email já cadastrado');
      }

      // Criar o usuário
      const user = new User(userData);
      await user.save();
      
      // Retornar usuário sem a senha
      const userObj = user.toObject();
      delete userObj.password;
      
      return userObj;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Autentica um usuário e gera um token JWT
   * @param {String} email - Email do usuário
   * @param {String} password - Senha do usuário
   * @returns {Promise<Object>} Objeto com token e dados do usuário
   */
  async authenticateUser(email, password) {
    try {
      // Buscar usuário pelo email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        throw new Error('Conta desativada. Entre em contato com o suporte.');
      }

      // Verificar senha
      const isPasswordValid = await user.checkPassword(password);
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      // Atualizar data do último login
      user.lastLoginDate = new Date();
      await user.save();

      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: user._id,
          email: user.email,
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      );

      // Retornar o token e os dados do usuário (sem a senha)
      const userObj = user.toObject();
      delete userObj.password;
      
      return { token, user: userObj };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Busca todos os usuários com paginação
   * @param {Number} page - Página atual
   * @param {Number} limit - Limite de itens por página
   * @param {Object} filters - Filtros para a busca
   * @returns {Promise<Object>} Objeto com usuários e informações de paginação
   */
  async getAllUsers(page = 1, limit = 10, filters = {}) {
    try {
      const query = { ...filters };
      
      // Converter página e limite para números
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      
      // Calcular o salto (quantos documentos pular)
      const skip = (pageNumber - 1) * limitNumber;
      
      // Buscar usuários com paginação
      const users = await User.find(query)
        .select('-password') // Excluir o campo password
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 }); // Ordenar por data de criação decrescente
      
      // Contar total de usuários para cálculo de páginas
      const total = await User.countDocuments(query);
      
      return {
        users,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          pages: Math.ceil(total / limitNumber)
        }
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Busca um usuário pelo ID
   * @param {String} userId - ID do usuário
   * @returns {Promise<Object>} Usuário encontrado
   */
  async getUserById(userId) {
    try {
      if (!isValidObjectId(userId)) {
        throw new Error('ID de usuário inválido');
      }
      
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualiza um usuário pelo ID
   * @param {String} userId - ID do usuário
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object>} Usuário atualizado
   */
  async updateUser(userId, updateData) {
    try {
      if (!isValidObjectId(userId)) {
        throw new Error('ID de usuário inválido');
      }
      
      // Verificar se email já existe (se estiver sendo atualizado)
      if (updateData.email) {
        const existingUser = await User.findOne({ 
          email: updateData.email,
          _id: { $ne: userId } // Exclui o usuário atual da busca
        });
        
        if (existingUser) {
          throw new Error('Email já está em uso');
        }
      }
      
      // Se a senha estiver sendo atualizada, vai acionar o hook pre-save
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Atualizar os campos
      Object.keys(updateData).forEach(key => {
        user[key] = updateData[key];
      });
      
      await user.save();
      
      // Retornar usuário atualizado sem a senha
      const userObj = user.toObject();
      delete userObj.password;
      
      return userObj;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Deleta um usuário pelo ID
   * @param {String} userId - ID do usuário
   * @returns {Promise<Object>} Resultado da operação
   */
  async deleteUser(userId) {
    try {
      if (!isValidObjectId(userId)) {
        throw new Error('ID de usuário inválido');
      }
      
      const result = await User.deleteOne({ _id: userId });
      
      if (result.deletedCount === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      return { message: 'Usuário removido com sucesso' };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Desativa a conta de um usuário (soft delete)
   * @param {String} userId - ID do usuário
   * @returns {Promise<Object>} Resultado da operação
   */
  async deactivateUser(userId) {
    try {
      if (!isValidObjectId(userId)) {
        throw new Error('ID de usuário inválido');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      user.isActive = false;
      await user.save();
      
      return { message: 'Conta desativada com sucesso' };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reativa a conta de um usuário
   * @param {String} userId - ID do usuário
   * @returns {Promise<Object>} Resultado da operação
   */
  async activateUser(userId) {
    try {
      if (!isValidObjectId(userId)) {
        throw new Error('ID de usuário inválido');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      user.isActive = true;
      await user.save();
      
      return { message: 'Conta reativada com sucesso' };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Inicia o processo de redefinição de senha
   * @param {String} email - Email do usuário
   * @returns {Promise<Object>} Token de redefinição e sua expiração
   */
  async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Email não encontrado');
      }
      
      // Gerar token aleatório
      const resetToken = crypto.randomBytes(20).toString('hex');
      
      // Definir expiração (1 hora)
      const resetTokenExpires = Date.now() + 3600000;
      
      // Salvar token no usuário
      user.resetToken = resetToken;
      user.resetTokenExpires = resetTokenExpires;
      await user.save();
      
      return { 
        resetToken,
        resetTokenExpires,
        message: 'Token de redefinição de senha gerado'
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Redefine a senha com base no token
   * @param {String} token - Token de redefinição
   * @param {String} newPassword - Nova senha
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  async resetPassword(token, newPassword) {
    try {
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        throw new Error('Token inválido ou expirado');
      }
      
      // Atualizar senha
      user.password = newPassword;
      
      // Limpar token de redefinição
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      
      await user.save();
      
      return { message: 'Senha redefinida com sucesso' };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Altera a senha do usuário (quando logado)
   * @param {String} userId - ID do usuário
   * @param {String} currentPassword - Senha atual
   * @param {String} newPassword - Nova senha
   * @returns {Promise<Object>} Mensagem de sucesso
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      if (!isValidObjectId(userId)) {
        throw new Error('ID de usuário inválido');
      }
      
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Verificar senha atual
      const isPasswordValid = await user.checkPassword(currentPassword);
      if (!isPasswordValid) {
        throw new Error('Senha atual incorreta');
      }
      
      // Definir nova senha
      user.password = newPassword;
      await user.save();
      
      return { message: 'Senha alterada com sucesso' };
    } catch (error) {
      throw error;
    }
  }
};

module.exports = userService;