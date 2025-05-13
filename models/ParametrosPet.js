const mongoose = require('mongoose');

const parametrosPetSchema = new mongoose.Schema({
  // Matriz de compatibilidade de displasia
  // Define quais graus de displasia podem ser cruzados
  matrizDisplasia: {
    type: Map,
    of: Map,
    default: () => new Map([
      ['A', new Map([
        ['A', true], ['B', true], ['C', false], ['D', false], ['E', false]
      ])],
      ['B', new Map([
        ['A', true], ['B', true], ['C', false], ['D', false], ['E', false]
      ])],
      ['C', new Map([
        ['A', false], ['B', false], ['C', false], ['D', false], ['E', false]
      ])],
      ['D', new Map([
        ['A', false], ['B', false], ['C', false], ['D', false], ['E', false]
      ])],
      ['E', new Map([
        ['A', false], ['B', false], ['C', false], ['D', false], ['E', false]
      ])]
    ])
  },
  
  // Limite de consanguinidade aceitável (percentual)
  limiteConsanguinidade: {
    type: Number,
    default: 12.5, // Geralmente, limite de 12.5% (equivalente a primos de primeiro grau)
    min: 0,
    max: 100
  },
  
  // Número máximo de gerações a considerar para cálculo de consanguinidade
  geracoesConsanguinidade: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  
  // Configurações adicionais
  ativo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ParametrosPet = mongoose.model('ParametrosPet', parametrosPetSchema);

module.exports = ParametrosPet;