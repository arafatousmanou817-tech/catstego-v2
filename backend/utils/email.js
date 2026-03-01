const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password',
  },
});

const sendVerificationEmail = async (to, code) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`✉️ [DEV] Verification email to ${to}: ${code}`);
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
    console.error('Erreur sendVerificationEmail:', error);
    throw new Error('Impossible d\'envoyer l\'email de vérification');
  }
};

module.exports = {
  sendVerificationEmail,
};
