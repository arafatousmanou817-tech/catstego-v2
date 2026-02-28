/**
 * CatStego — Stéganographie LSB
 * Encode/Decode messages dans les bits de poids faible des pixels
 */

const END_DELIMITER = '###END###';

/**
 * Encode un message dans une image via LSB
 * @param {HTMLImageElement|string} imageSource - Image ou URL base64
 * @param {string} message - Message chiffré à cacher
 * @returns {Promise<string>} - Image PNG encodée en base64
 */
export const encodeMessage = (imageSource, message) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const fullMessage = message + END_DELIMITER;
      const binaryMessage = textToBinary(fullMessage);

      // Vérifier la capacité
      const maxBits = Math.floor(data.length * 0.75); // 3 canaux RGB par pixel
      if (binaryMessage.length > maxBits) {
        reject(new Error(`Message trop long ! Maximum ${Math.floor(maxBits / 8)} caractères pour cette image.`));
        return;
      }

      let bitIndex = 0;
      for (let i = 0; i < data.length && bitIndex < binaryMessage.length; i++) {
        // Ignorer le canal alpha (i % 4 === 3)
        if (i % 4 === 3) continue;

        // Modifier le bit de poids faible
        data[i] = (data[i] & 0xFE) | parseInt(binaryMessage[bitIndex]);
        bitIndex++;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Impossible de charger l\'image'));

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
};

/**
 * Décode un message caché dans une image
 * @param {string} imageBase64 - Image PNG en base64
 * @returns {Promise<string>} - Message extrait (encore chiffré)
 */
export const decodeMessage = (imageBase64) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let binaryString = '';
      let extractedText = '';
      let charBuffer = '';

      for (let i = 0; i < data.length; i++) {
        if (i % 4 === 3) continue; // Ignorer alpha

        binaryString += (data[i] & 1).toString();

        if (binaryString.length === 8) {
          const charCode = parseInt(binaryString, 2);
          const char = String.fromCharCode(charCode);
          charBuffer += char;
          extractedText += char;
          binaryString = '';

          // Vérifier le délimiteur
          if (charBuffer.length > END_DELIMITER.length) {
            charBuffer = charBuffer.slice(1);
          }

          if (charBuffer === END_DELIMITER) {
            const message = extractedText.slice(0, -END_DELIMITER.length);
            resolve(message);
            return;
          }
        }
      }

      reject(new Error('Aucun message secret trouvé dans cette image'));
    };

    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.src = imageBase64;
  });
};

/**
 * Calcule la capacité maximale d'une image
 */
export const getImageCapacity = (width, height) => {
  // 3 bits par pixel (RGB), moins le délimiteur
  return Math.floor((width * height * 3) / 8) - END_DELIMITER.length;
};

// Helpers
const textToBinary = (text) => {
  return text.split('').map(char => 
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');
};
