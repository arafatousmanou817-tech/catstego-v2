import CryptoJS from 'crypto-js';

/**
 * Chiffrement XOR simple
 */
export const xorEncrypt = (text, key) => {
  if (!key) return text;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  // Encoder en base64 pour éviter les caractères non-imprimables
  return btoa(unescape(encodeURIComponent(result)));
};

export const xorDecrypt = (encoded, key) => {
  if (!key) return encoded;
  try {
    const text = decodeURIComponent(escape(atob(encoded)));
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    throw new Error('Clé incorrecte ou données corrompues');
  }
};

/**
 * Chiffrement AES-256
 */
export const aesEncrypt = (text, key) => {
  const encrypted = CryptoJS.AES.encrypt(text, key).toString();
  return encrypted;
};

export const aesDecrypt = (ciphertext, key) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Déchiffrement échoué');
    return decrypted;
  } catch {
    throw new Error('Clé incorrecte ou données corrompues');
  }
};

/**
 * Chiffrer selon l'algorithme choisi
 */
export const encrypt = (text, key, algorithm = 'xor') => {
  if (!key) return text;
  if (algorithm === 'aes') return aesEncrypt(text, key);
  return xorEncrypt(text, key);
};

export const decrypt = (ciphertext, key, algorithm = 'xor') => {
  if (!key) return ciphertext;
  if (algorithm === 'aes') return aesDecrypt(ciphertext, key);
  return xorDecrypt(ciphertext, key);
};

/**
 * Évaluer la force d'une clé (0-4)
 */
export const getKeyStrength = (key) => {
  if (!key) return 0;
  let score = 0;
  if (key.length >= 8) score++;
  if (key.length >= 16) score++;
  if (/[A-Z]/.test(key) && /[a-z]/.test(key)) score++;
  if (/[0-9!@#$%^&*()_+\-=\[\]{}|;':",.<>?]/.test(key)) score++;
  return score;
};

export const getStrengthLabel = (score) => {
  const labels = ['Très faible', 'Faible', 'Correct', 'Fort', 'Très fort'];
  const colors = ['#E94560', '#FF6B35', '#FFC107', '#4CAF50', '#00BCD4'];
  return { label: labels[score], color: colors[score] };
};
