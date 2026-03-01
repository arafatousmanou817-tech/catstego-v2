const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password',
  },
});

const sendVerificationEmail = async (to, code) => {
  // En mode développement ou si les variables sont celles par défaut, logguer le code
  const isDummyConfig = !process.env.EMAIL_USER || process.env.EMAIL_USER === 'user@example.com';

  if (process.env.NODE_ENV === 'development' || isDummyConfig) {
    console.log(`✉️ [SIMULATION] Verification email to ${to}: ${code}`);
    return;
  }

  const mailOptions = {
    from: `"CatStego" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Code de vérification CatStego',
    text: `Votre code de vérification est : ${code}`,
    html: `<p>Votre code de vérification est : <strong>${code}</strong></p><p>Ce code expire dans 15 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur sendVerificationEmail:', error.message);
    // En cas d'erreur SMTP, on log et on simule pour ne pas bloquer le dev/test
    console.log(`✉️ [FALLBACK] Email non envoyé, code pour ${to}: ${code}`);
  }
};

module.exports = {
  sendVerificationEmail,
};
