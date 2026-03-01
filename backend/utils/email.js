const nodemailer = require('nodemailer');
require('dotenv').config();

const sendVerificationEmail = async (to, code) => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // Simulation si config absente ou incomplète
  const isSimulation = !host || !user || !pass || user === 'user@example.com';

  if (process.env.NODE_ENV === 'development' || isSimulation) {
    console.log('-------------------------------------------');
    console.log(`✉️ [SIMULATION EMAIL] To: ${to}`);
    console.log(`🔑 Code: ${code}`);
    console.log('-------------------------------------------');
    return true;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user, pass },
  });

  const mailOptions = {
    from: `"CatStego" <${user}>`,
    to,
    subject: 'Votre code de vérification CatStego',
    text: `Votre code de vérification est : ${code}. Il expire dans 15 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #FF6B35; margin-top: 0;">Bienvenue sur CatStego ! 🐱</h2>
        <p>Votre code de vérification est :</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1A1A2E; margin: 20px 0;">${code}</div>
        <p style="color: #666; font-size: 12px;">Ce code expire dans 15 minutes.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur SMTP:', error.message);
    console.log(`✉️ [FALLBACK] Code pour ${to}: ${code}`);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
};
