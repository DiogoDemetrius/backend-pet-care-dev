const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @route POST /api/users
 * @desc Cria um novo usuário
 * @access Public
 */
router.post('/', userController.createUser);

/**
 * @route POST /api/users/login
 * @desc Autentica um usuário
 * @access Public
 */
router.post('/login', userController.loginUser);

/**
 * @route GET /api/users
 * @desc Lista todos os usuários com paginação
 * @access Private/Admin
 */
router.get('/', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  userController.getAllUsers
);

/**
 * @route GET /api/users/:id
 * @desc Busca um usuário pelo ID
 * @access Private
 */
router.get('/:id', 
  authMiddleware.verifyToken, 
  userController.getUserById
);

/**
 * @route PUT /api/users/:id
 * @desc Atualiza um usuário
 * @access Private
 */
router.put('/:id', 
  authMiddleware.verifyToken, 
  userController.updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Remove um usuário
 * @access Private/Admin
 */
router.delete('/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  userController.deleteUser
);

/**
 * @route PATCH /api/users/:id/deactivate
 * @desc Desativa a conta de um usuário
 * @access Private
 */
router.patch('/:id/deactivate', 
  authMiddleware.verifyToken, 
  userController.deactivateUser
);

/**
 * @route PATCH /api/users/:id/activate
 * @desc Reativa a conta de um usuário
 * @access Private/Admin
 */
router.patch('/:id/activate', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  userController.activateUser
);

/**
 * @route POST /api/users/forgot-password
 * @desc Solicita redefinição de senha
 * @access Public
 */
router.post('/forgot-password', userController.requestPasswordReset);

/**
 * @route POST /api/users/reset-password
 * @desc Redefine a senha com o token
 * @access Public
 */
router.post('/reset-password', userController.resetPassword);

/**
 * @route POST /api/users/change-password
 * @desc Altera a senha do usuário logado
 * @access Private
 */
router.post('/change-password', 
  authMiddleware.verifyToken, 
  userController.changePassword
);

module.exports = router;