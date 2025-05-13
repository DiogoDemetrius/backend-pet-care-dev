const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  raca: {
    type: String,
    required: true,
    trim: true
  },
  dataNascimento: {
    type: Date,
    required: true
  },
  genero: {
    type: String,
    enum: ['macho', 'fêmea'],
    required: true
  },
  // ID dos pais para calcular consanguinidade
  pai: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  },
  mae: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  },
  // Ancestrais para cálculos mais complexos de consanguinidade
  ancestrais: [{
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet'
    },
    geracao: Number
  }],
  // Classificação de displasia coxofemoral (A, B, C, D, E)
  // A e B = Normal, C = Leve, D = Moderada, E = Grave
  displasia: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E'],
    required: true
  },
  // Outros dados do pet
  proprietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registroOficial: {
    type: String,
    trim: true
  },
  microchip: {
    type: String,
    trim: true
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Método para obter a idade do pet em anos
petSchema.methods.getIdade = function() {
  const hoje = new Date();
  const nascimento = new Date(this.dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  
  // Ajustar idade se ainda não fez aniversário este ano
  if (hoje.getMonth() < nascimento.getMonth() || 
      (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  
  return idade;
};

const Pet = mongoose.model('Pet', petSchema);

module.exports = Pet;