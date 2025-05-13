const Pet = require('../models/Pet');
const ParametrosPet = require('../models/ParametrosPet');

/**
 * Serviço responsável por calcular a compatibilidade entre pets
 * com base em consanguinidade e displasia coxofemoral
 */
class ParametrosPetService {
  /**
   * Verifica compatibilidade de displasia coxofemoral entre dois pets
   * @param {String} displasia1 - Classificação do primeiro pet (A-E)
   * @param {String} displasia2 - Classificação do segundo pet (A-E)
   * @returns {Promise<Boolean>} - Retorna se são compatíveis
   */
  async verificarCompatibilidadeDisplasia(displasia1, displasia2) {
    try {
      // Busca os parâmetros atuais do sistema
      const parametros = await this.getParametros();
      
      // Verifica na matriz de compatibilidade
      const matrizDisplasia = parametros.matrizDisplasia;
      
      // Caso a matriz não esteja definida, retornamos false
      if (!matrizDisplasia || !matrizDisplasia.has(displasia1) || !matrizDisplasia.get(displasia1).has(displasia2)) {
        return false;
      }
      
      // Retorna o valor da matriz para este par
      return matrizDisplasia.get(displasia1).get(displasia2);
    } catch (error) {
      console.error('Erro ao verificar compatibilidade de displasia:', error);
      throw error;
    }
  }

  /**
   * Calcula o coeficiente de consanguinidade entre dois pets
   * @param {String} petId1 - ID do primeiro pet
   * @param {String} petId2 - ID do segundo pet
   * @returns {Promise<Number>} - Retorna o coeficiente de consanguinidade (0-100%)
   */
  async calcularConsanguinidade(petId1, petId2) {
    try {
      // Busca informações completas dos pets com seus ancestrais
      const [pet1, pet2] = await Promise.all([
        this.getPetComAncestral(petId1),
        this.getPetComAncestral(petId2)
      ]);
      
      // Se algum dos pets não for encontrado, retorna erro
      if (!pet1 || !pet2) {
        throw new Error('Um ou ambos os pets não foram encontrados');
      }
      
      // Se ambos são o mesmo pet, a consanguinidade é 100%
      if (pet1._id.toString() === pet2._id.toString()) {
        return 100;
      }
      
      // Verifica se um é ancestral direto do outro (pai/mãe)
      if ((pet1.pai && pet1.pai.toString() === pet2._id.toString()) || 
          (pet1.mae && pet1.mae.toString() === pet2._id.toString()) ||
          (pet2.pai && pet2.pai.toString() === pet1._id.toString()) ||
          (pet2.mae && pet2.mae.toString() === pet1._id.toString())) {
        return 50; // Pai/filho = 50% de genes compartilhados
      }
      
      // Verifica se são irmãos completos (mesmo pai e mesma mãe)
      if (pet1.pai && pet2.pai && pet1.mae && pet2.mae &&
          pet1.pai.toString() === pet2.pai.toString() && 
          pet1.mae.toString() === pet2.mae.toString()) {
        return 50; // Irmãos completos = 50% de genes compartilhados
      }
      
      // Verifica se são meio-irmãos (apenas um genitor em comum)
      if ((pet1.pai && pet2.pai && pet1.pai.toString() === pet2.pai.toString()) ||
          (pet1.mae && pet2.mae && pet1.mae.toString() === pet2.mae.toString())) {
        return 25; // Meio-irmãos = 25% de genes compartilhados
      }
      
      // Para cálculos mais complexos, precisamos analisar a árvore genealógica
      // Implementação do método de Wright para cálculo de consanguinidade
      return await this.calcularConsanguinidadeWright(pet1, pet2);
    } catch (error) {
      console.error('Erro ao calcular consanguinidade:', error);
      throw error;
    }
  }
  
  /**
   * Calcula consanguinidade usando o método de Wright
   * @param {Object} pet1 - Primeiro pet com ancestrais
   * @param {Object} pet2 - Segundo pet com ancestrais
   * @returns {Promise<Number>} - Percentual de consanguinidade
   */
  async calcularConsanguinidadeWright(pet1, pet2) {
    try {
      // Busca os parâmetros para saber quantas gerações analisar
      const parametros = await this.getParametros();
      const geracoes = parametros.geracoesConsanguinidade || 5;
      
      // Monta árvores genealógicas dos dois pets
      const arvore1 = await this.montarArvoreGenealogica(pet1._id, geracoes);
      const arvore2 = await this.montarArvoreGenealogica(pet2._id, geracoes);
      
      // Encontra ancestrais comuns
      const ancestraisComuns = this.encontrarAncestraisComuns(arvore1, arvore2);
      
      if (ancestraisComuns.length === 0) {
        return 0; // Sem ancestrais comuns, não há consanguinidade
      }
      
      // Calcula coeficiente usando o método de Wright
      let coeficiente = 0;
      
      // Para cada ancestral comum, calculamos sua contribuição
      for (const ancestral of ancestraisComuns) {
        // n1 = número de gerações do pet1 ao ancestral comum
        // n2 = número de gerações do pet2 ao ancestral comum
        const n1 = arvore1.get(ancestral.toString()).geracao;
        const n2 = arvore2.get(ancestral.toString()).geracao;
        
        // Fórmula de Wright: (1/2)^(n1 + n2)
        const contribuicao = Math.pow(0.5, n1 + n2);
        coeficiente += contribuicao;
      }
      
      // Convertemos para percentual
      return coeficiente * 100;
    } catch (error) {
      console.error('Erro no cálculo de consanguinidade pelo método de Wright:', error);
      throw error;
    }
  }
  
  /**
   * Monta árvore genealógica de um pet até X gerações
   * @param {String} petId - ID do pet
   * @param {Number} geracoes - Número de gerações a considerar
   * @returns {Promise<Map>} - Mapa de ancestrais (id -> {pet, geracao})
   */
  async montarArvoreGenealogica(petId, geracoes) {
    const arvore = new Map();
    const fila = [{ id: petId, geracao: 0 }];
    
    while (fila.length > 0) {
      const { id, geracao } = fila.shift();
      
      // Se já atingimos o limite de gerações, não continuamos
      if (geracao > geracoes) continue;
      
      // Se já visitamos este pet, pulamos
      if (arvore.has(id.toString())) continue;
      
      // Busca o pet no banco de dados
      const pet = await Pet.findById(id);
      if (!pet) continue;
      
      // Adiciona à árvore
      arvore.set(id.toString(), { pet, geracao });
      
      // Adiciona pais à fila
      if (pet.pai) {
        fila.push({ id: pet.pai, geracao: geracao + 1 });
      }
      if (pet.mae) {
        fila.push({ id: pet.mae, geracao: geracao + 1 });
      }
    }
    
    return arvore;
  }
  
  /**
   * Encontra ancestrais comuns entre duas árvores genealógicas
   * @param {Map} arvore1 - Primeira árvore genealógica
   * @param {Map} arvore2 - Segunda árvore genealógica
   * @returns {Array} - Lista de IDs dos ancestrais comuns
   */
  encontrarAncestraisComuns(arvore1, arvore2) {
    const ancestraisComuns = [];
    
    // Itera por todos os ancestrais da primeira árvore
    for (const [id] of arvore1) {
      // Se estiver também na segunda árvore, é um ancestral comum
      if (arvore2.has(id)) {
        ancestraisComuns.push(id);
      }
    }
    
    return ancestraisComuns;
  }
  
  /**
   * Busca um pet com informações de ancestrais
   * @param {String} petId - ID do pet
   * @returns {Promise<Object>} - Pet com ancestrais
   */
  async getPetComAncestral(petId) {
    return await Pet.findById(petId)
      .populate('pai')
      .populate('mae')
      .exec();
  }
  
  /**
   * Busca ou cria o registro de parâmetros
   * @returns {Promise<Object>} - Parâmetros atuais
   */
  async getParametros() {
    let parametros = await ParametrosPet.findOne({ ativo: true });
    
    if (!parametros) {
      // Se não existir, cria com valores padrão
      parametros = await ParametrosPet.create({
        ativo: true
      });
    }
    
    return parametros;
  }
  
  /**
   * Atualiza os parâmetros do sistema
   * @param {Object} novosDados - Novos parâmetros
   * @returns {Promise<Object>} - Parâmetros atualizados
   */
  async atualizarParametros(novosDados) {
    try {
      const parametros = await this.getParametros();
      
      // Atualiza campos se fornecidos
      if (novosDados.matrizDisplasia) {
        parametros.matrizDisplasia = novosDados.matrizDisplasia;
      }
      
      if (novosDados.limiteConsanguinidade !== undefined) {
        parametros.limiteConsanguinidade = novosDados.limiteConsanguinidade;
      }
      
      if (novosDados.geracoesConsanguinidade !== undefined) {
        parametros.geracoesConsanguinidade = novosDados.geracoesConsanguinidade;
      }
      
      await parametros.save();
      return parametros;
    } catch (error) {
      console.error('Erro ao atualizar parâmetros:', error);
      throw error;
    }
  }
  
  /**
   * Verifica compatibilidade geral entre dois pets
   * @param {String} petId1 - ID do primeiro pet
   * @param {String} petId2 - ID do segundo pet
   * @returns {Promise<Object>} - Resultado da compatibilidade
   */
  async verificarCompatibilidade(petId1, petId2) {
    try {
      // Busca os pets
      const [pet1, pet2] = await Promise.all([
        Pet.findById(petId1),
        Pet.findById(petId2)
      ]);
      
      // Verifica se os pets foram encontrados
      if (!pet1 || !pet2) {
        throw new Error('Um ou ambos os pets não foram encontrados');
      }
      
      // Verifica se são de gêneros diferentes
      const generoCompativel = pet1.genero !== pet2.genero;
      
      // Calcula consanguinidade
      const consanguinidade = await this.calcularConsanguinidade(petId1, petId2);
      
      // Busca parâmetros para limite de consanguinidade
      const parametros = await this.getParametros();
      const consanguinidadeCompativel = consanguinidade <= parametros.limiteConsanguinidade;
      
      // Verifica compatibilidade de displasia
      const displasiaCompativel = await this.verificarCompatibilidadeDisplasia(
        pet1.displasia, 
        pet2.displasia
      );
      
      // Prepara resultado
      const resultado = {
        petId1,
        petId2,
        generoCompativel,
        consanguinidade: parseFloat(consanguinidade.toFixed(2)),
        consanguinidadeCompativel,
        displasiaCompativel,
        compativel: generoCompativel && consanguinidadeCompativel && displasiaCompativel
      };
      
      return resultado;
    } catch (error) {
      console.error('Erro ao verificar compatibilidade:', error);
      throw error;
    }
  }
}

module.exports = new ParametrosPetService();