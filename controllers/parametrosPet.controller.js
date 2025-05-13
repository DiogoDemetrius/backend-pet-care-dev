const parametrosPetService = require('../services/parametrosPet.service');

/**
 * Controller para operações relacionadas aos parâmetros de reprodução de pets
 */
class ParametrosPetController {
  /**
   * Verifica a compatibilidade entre dois pets
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   */
  async verificarCompatibilidade(req, res) {
    try {
      const { petId1, petId2 } = req.body;
      
      // Validação básica
      if (!petId1 || !petId2) {
        return res.status(400).json({ 
          success: false, 
          message: 'É necessário fornecer os IDs de ambos os pets' 
        });
      }
      
      // Chama o serviço para verificar compatibilidade
      const resultado = await parametrosPetService.verificarCompatibilidade(petId1, petId2);
      
      return res.status(200).json({
        success: true,
        data: resultado
      });
    } catch (error) {
      console.error('Erro ao verificar compatibilidade:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao verificar compatibilidade'
      });
    }
  }
  
  /**
   * Calcula o coeficiente de consanguinidade entre dois pets
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   */
  async calcularConsanguinidade(req, res) {
    try {
      const { petId1, petId2 } = req.body;
      
      // Validação básica
      if (!petId1 || !petId2) {
        return res.status(400).json({ 
          success: false, 
          message: 'É necessário fornecer os IDs de ambos os pets' 
        });
      }
      
      // Chama o serviço para calcular consanguinidade
      const coeficiente = await parametrosPetService.calcularConsanguinidade(petId1, petId2);
      
      return res.status(200).json({
        success: true,
        data: {
          petId1,
          petId2,
          coeficiente: parseFloat(coeficiente.toFixed(2)) // Limita a 2 casas decimais
        }
      });
    } catch (error) {
      console.error('Erro ao calcular consanguinidade:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao calcular consanguinidade'
      });
    }
  }
  
  /**
   * Verifica compatibilidade de displasia entre dois pets
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   */
  async verificarDisplasia(req, res) {
    try {
      const { displasia1, displasia2 } = req.body;
      
      // Validação básica
      if (!displasia1 || !displasia2) {
        return res.status(400).json({ 
          success: false, 
          message: 'É necessário fornecer as classificações de displasia de ambos os pets' 
        });
      }
      
      // Chama o serviço para verificar compatibilidade de displasia
      const compativel = await parametrosPetService.verificarCompatibilidadeDisplasia(
        displasia1, 
        displasia2
      );
      
      return res.status(200).json({
        success: true,
        data: {
          displasia1,
          displasia2,
          compativel
        }
      });
    } catch (error) {
      console.error('Erro ao verificar compatibilidade de displasia:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao verificar compatibilidade de displasia'
      });
    }
  }
  
  /**
   * Obtém os parâmetros atuais do sistema
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   */
  async getParametros(req, res) {
    try {
      const parametros = await parametrosPetService.getParametros();
      
      return res.status(200).json({
        success: true,
        data: parametros
      });
    } catch (error) {
      console.error('Erro ao obter parâmetros:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao obter parâmetros'
      });
    }
  }
  
  /**
   * Atualiza os parâmetros do sistema
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   */
  async atualizarParametros(req, res) {
    try {
      const novosDados = req.body;
      
      // Validação básica
      if (!novosDados || Object.keys(novosDados).length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nenhum dado fornecido para atualização' 
        });
      }
      
      // Atualiza parâmetros
      const parametrosAtualizados = await parametrosPetService.atualizarParametros(novosDados);
      
      return res.status(200).json({
        success: true,
        message: 'Parâmetros atualizados com sucesso',
        data: parametrosAtualizados
      });
    } catch (error) {
      console.error('Erro ao atualizar parâmetros:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar parâmetros'
      });
    }
  }
}

module.exports = new ParametrosPetController();