/**
 * Servicio de validación de Hash-Chaining
 * Verifica la integridad de la cadena de bloques de datos
 */

class HashChainService {
  constructor() {
    this.chain = [];
    this.maxChainLength = 100; // Mantener últimos 100 bloques
  }

  /**
   * Calcula el hash SHA-256 de un objeto de datos
   * @param {Object} data - Datos a hashear
   * @returns {Promise<string>} Hash en formato hexadecimal
   */
  async calculateHash(data) {
    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Valida un nuevo mensaje en la cadena
   * @param {Object} message - Mensaje con hash_previous y hash_current
   * @returns {Promise<Object>} Resultado de validación
   */
  async validateMessage(message) {
    const {
      hash_previous,
      hash_current,
      sequence_number,
      ...dataToHash
    } = message;

    // Calcular el hash esperado del mensaje actual (sin incluir el hash_current)
    const calculatedHash = await this.calculateHash(dataToHash);

    // Si es el primer mensaje
    if (this.chain.length === 0) {
      this.chain.push({
        sequence: sequence_number,
        hash: hash_current,
        timestamp: message.timestamp,
        valid: true
      });

      return {
        valid: true,
        message: 'First block in chain',
        sequence: sequence_number,
        chainLength: this.chain.length
      };
    }

    // Obtener el último bloque de la cadena
    const lastBlock = this.chain[this.chain.length - 1];

    // Validar que el hash_previous coincida con el hash del bloque anterior
    const previousHashValid = hash_previous === lastBlock.hash;

    // Validar que el hash_current sea correcto
    const currentHashValid = hash_current === calculatedHash;

    // Validar secuencia
    const sequenceValid = sequence_number === lastBlock.sequence + 1;

    const isValid = previousHashValid && currentHashValid && sequenceValid;

    // Agregar a la cadena
    this.chain.push({
      sequence: sequence_number,
      hash: hash_current,
      timestamp: message.timestamp,
      valid: isValid,
      previousHashMatch: previousHashValid,
      currentHashMatch: currentHashValid,
      sequenceMatch: sequenceValid
    });

    // Mantener solo los últimos N bloques
    if (this.chain.length > this.maxChainLength) {
      this.chain.shift();
    }

    return {
      valid: isValid,
      previousHashMatch: previousHashValid,
      currentHashMatch: currentHashValid,
      sequenceMatch: sequenceValid,
      sequence: sequence_number,
      chainLength: this.chain.length,
      message: isValid ? 'Block validated successfully' : 'Block validation failed'
    };
  }

  /**
   * Obtiene estadísticas de la cadena
   * @returns {Object} Estadísticas
   */
  getChainStats() {
    if (this.chain.length === 0) {
      return {
        totalBlocks: 0,
        validBlocks: 0,
        invalidBlocks: 0,
        integrityPercentage: 100,
        lastSequence: 0
      };
    }

    const validBlocks = this.chain.filter(block => block.valid).length;
    const invalidBlocks = this.chain.length - validBlocks;

    return {
      totalBlocks: this.chain.length,
      validBlocks,
      invalidBlocks,
      integrityPercentage: (validBlocks / this.chain.length) * 100,
      lastSequence: this.chain[this.chain.length - 1].sequence,
      lastTimestamp: this.chain[this.chain.length - 1].timestamp
    };
  }

  /**
   * Obtiene los últimos N bloques de la cadena
   * @param {number} count - Número de bloques
   * @returns {Array} Últimos bloques
   */
  getRecentBlocks(count = 10) {
    return this.chain.slice(-count);
  }

  /**
   * Reinicia la cadena
   */
  reset() {
    this.chain = [];
  }
}

// Exportar instancia singleton
const hashChainService = new HashChainService();
export default hashChainService;
