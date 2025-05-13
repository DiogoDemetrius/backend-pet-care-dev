const express = require('express');
const router = express.Router();
const Pet = require('../models/Pet');
const authMiddleware = require('../middlewares/auth.middleware');

// Middleware para tratamento de erros
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route GET /api/pets
 * @desc Lista todos os pets ativos
 * @access Private
 */
router.get('/', authMiddleware.verifyToken, asyncHandler(async (req, res) => {
  const pets = await Pet.find({ ativo: true })
    .populate('proprietario', 'nome email')
    .select('-__v');
  
  res.status(200).json({
    success: true,
    count: pets.length,
    data: pets
  });
}));

/**
 * @route GET /api/pets/:id
 * @desc Obtém detalhes de um pet específico
 * @access Private
 */
router.get('/:id', authMiddleware.verifyToken, asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id)
    .populate('proprietario', 'nome email')
    .populate('pai', 'nome raca displasia')
    .populate('mae', 'nome raca displasia');
  
  if (!pet) {
    return res.status(404).json({
      success: false,
      message: 'Pet não encontrado'
    });
  }
  
  res.status(200).json({
    success: true,
    data: pet
  });
}));

/**
 * @route POST /api/pets
 * @desc Cadastra um novo pet
 * @access Private
 */
router.post('/', authMiddleware.verifyToken, asyncHandler(async (req, res) => {
  // Define o proprietário como o usuário atual
  req.body.proprietario = req.user.id;
  
  const novoPet = await Pet.create(req.body);
  
  res.status(201).json({
    success: true,
    data: novoPet
  });
}));

/**
 * @route PUT /api/pets/:id
 * @desc Atualiza um pet existente
 * @access Private
 */
router.put('/:id', authMiddleware.verifyToken, asyncHandler(async (req, res) => {
  let pet = await Pet.findById(req.params.id);
  
  if (!pet) {
    return res.status(404).json({
      success: false,
      message: 'Pet não encontrado'
    });
  }
  
  // Verifica se o usuário é o proprietário ou admin
  if (pet.proprietario.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Usuário não autorizado a modificar este pet'
    });
  }
  
  pet = await Pet.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: pet
  });
}));

/**
 * @route DELETE /api/pets/:id
 * @desc Marca um pet como inativo (soft delete)
 * @access Private
 */
router.delete('/:id', authMiddleware.verifyToken, asyncHandler(async (req, res) => {
  const pet = await Pet.findById(req.params.id);
  
  if (!pet) {
    return res.status(404).json({
      success: false,
      message: 'Pet não encontrado'
    });
  }
  
  // Verifica se o usuário é o proprietário ou admin
  if (pet.proprietario.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Usuário não autorizado a remover este pet'
    });
  }
  
  // Soft delete - apenas marca como inativo
  pet.ativo = false;
  await pet.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
}));

/**
 * @route GET /api/pets/proprietario/:id
 * @desc Lista todos os pets de um proprietário específico
 * @access Private
 */
router.get('/proprietario/:id', authMiddleware.verifyToken, asyncHandler(async (req, res) => {
  // Verifica se o usuário está buscando seus próprios pets ou é admin
  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Usuário não autorizado a visualizar estes pets'
    });
  }
  
  const pets = await Pet.find({ 
    proprietario: req.params.id,
    ativo: true 
  });
  
  res.status(200).json({
    success: true,
    count: pets.length,
    data: pets
  });
}));

/**
 * @route GET /api/pets/raca/:raca
 * @desc Lista todos os pets de uma raça específica
 * @access Private
 */
router.get('/raca/:raca', authMiddleware.verifyToken, asyncHandler(async (req, res) => {
  const pets = await Pet.find({ 
    raca: { $regex: req.params.raca, $options: 'i' },
    ativo: true 
  });
  
  res.status(200).json({
    success: true,
    count: pets.length,
    data: pets
  });
}));

module.exports = router;