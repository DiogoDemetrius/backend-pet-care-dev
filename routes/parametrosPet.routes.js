const express = require('express');
const router = express.Router();
const parametrosPetController = require('../controllers/parametrosPet.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * @route POST /api/parametros-pet/compatibilidade
 * @desc Verifica compatibilidade geral entre dois pets
 * @access Private
 */
router.post('/compatibilidade', authMiddleware.verifyToken, parametrosPetController.verificarCompatibilidade);

/**
 * @route POST /api/parametros-pet/consanguinidade
 * @desc Calcula o coeficiente de consanguinidade entre dois pets
 * @access Private
 */
router.post('/consanguinidade', authMiddleware.verifyToken, parametrosPetController.calcularConsanguinidade);

/**
 * @route POST /api/parametros-pet/displasia
 * @desc Verifica compatibilidade de displasia entre dois pets
 * @access Private
 */
router.post('/displasia', authMiddleware.verifyToken, parametrosPetController.verificarDisplasia);

/**
 * @route GET /api/parametros-pet
 * @desc Obtém os parâmetros atuais do sistema
 * @access Private
 */
router.get('/', authMiddleware.verifyToken, parametrosPetController.getParametros);

/**
 * @route PUT /api/parametros-pet
 * @desc Atualiza os parâmetros do sistema
 * @access Private (Admin)
 */
router.put('/', authMiddleware.verifyToken, authMiddleware.isAdmin, parametrosPetController.atualizarParametros);

module.exports = router;