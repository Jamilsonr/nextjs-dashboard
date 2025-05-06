/**
 * Utilitário de autenticação que fornece alternativas ao bcrypt
 * para uso em ambientes como Vercel onde a compilação nativa pode falhar
 */

import crypto from 'crypto';

/**
 * Gera um hash de senha usando crypto nativo do Node.js
 * Uma alternativa ao bcrypt.hash para ambientes onde bcrypt falha
 * @param {string} password - A senha a ser hasheada
 * @param {number} saltRounds - Número de rounds para o salt (ignorado, mantido para compatibilidade com bcrypt)
 * @returns {Promise<string>} - Hash da senha
 */
export async function hashPassword(password, saltRounds = 10) {
  // Tenta usar bcrypt primeiro, se disponível
  try {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.log('Usando implementação alternativa de hash (crypto) devido a erro no bcrypt:', error.message);
    
    // Implementação alternativa usando crypto
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    
    // Formato: algoritmo$iterações$salt$hash
    return `pbkdf2$1000$${salt}$${hash}`;
  }
}

/**
 * Compara uma senha com um hash
 * Uma alternativa ao bcrypt.compare para ambientes onde bcrypt falha
 * @param {string} password - A senha a ser verificada
 * @param {string} hashedPassword - O hash armazenado
 * @returns {Promise<boolean>} - true se a senha corresponder ao hash
 */
export async function comparePassword(password, hashedPassword) {
  // Verifica se é um hash do formato alternativo
  if (hashedPassword.startsWith('pbkdf2$')) {
    const [algorithm, iterations, salt, storedHash] = hashedPassword.split('$');
    
    // Gera o hash da senha fornecida usando os mesmos parâmetros
    const hash = crypto.pbkdf2Sync(
      password, 
      salt, 
      parseInt(iterations, 10), 
      64, 
      'sha512'
    ).toString('hex');
    
    // Compara os hashes
    return storedHash === hash;
  }
  
  // Se não for o formato alternativo, tenta usar bcrypt
  try {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Erro ao comparar senhas:', error);
    return false;
  }
}