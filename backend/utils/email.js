const nodemailer = require('nodemailer');
require('dotenv').config();

// ─────────────────────────────────────────────
// Validation de la config au démarrage
// ─────────────────────────────────────────────
const isConfigured =
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_HOST;

if (!isConfigured) {
  console.warn('⚠️  [EMAIL] Variables EMAIL_USER / EMAIL_PASS / EMAIL_HOST manquantes.');
  console.warn('   Les emails seront simulés (code visible dans les logs).');
}

// ─────────────────────────────────────────────
// Transporter — compatible avec tes variables Railway :
//   EMAIL_HOST=smtp.gmail.com
//   EMAIL_PORT=465
//   EMAIL_SECURE=true
//   EMAIL_USER=ousmanoubounyamine@gmail.com
//   EMAIL_PASS=jtbz azxk zxtt catf   ← App Password Google
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Vérifie la connexion SMTP au démarrage (non bloquant)
if (isConfigured) {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ [EMAIL] Connexion SMTP échouée :', error.message);
      console.error('   → Vérifie EMAIL_USER et EMAIL_PASS (App Password) dans Railway.');
    } else {
      console.log('✅ [EMAIL] Connexion SMTP OK — prêt à envoyer des emails.');
    }
  });
}

// ─────────────────────────────────────────────
// Template HTML
// ─────────────────────────────────────────────
const buildVerificationHtml = (code) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Vérification CatStego</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
               style="background:#1A1A2E;border-radius:16px;overflow:hidden;border:1px solid #2a2a4a;">
          <tr>
            <td align="center" style="padding:32px 24px 16px;background:linear-gradient(135deg,#FF6B35,#E94560);">
              <div style="font-size:42px;margin-bottom:8px;">🐱</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">CatStego</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Messages secrets dans des chats</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 24px;">
              <h2 style="margin:0 0 12px;color:#ffffff;font-size:18px;font-weight:600;">Vérification de ton compte</h2>
              <p style="margin:0 0 24px;color:#a0a0b8;font-size:14px;line-height:1.6;">
                Utilise le code ci-dessous pour confirmer ton adresse email.
                Il expire dans <strong style="color:#FF6B35;">15 minutes</strong>.
              </p>
              <div style="background:#0D0D0D;border:2px solid #FF6B35;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
                <span style="font-size:38px;font-weight:700;letter-spacing:12px;color:#FF6B35;font-family:'Courier New',monospace;">
                  ${code}
                </span>
              </div>
              <p style="margin:0;color:#606080;font-size:12px;line-height:1.6;">
                Si tu n'as pas demandé ce code, ignore cet email — ton compte ne sera pas créé.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #2a2a4a;">
              <p style="margin:0;color:#404060;font-size:11px;text-align:center;">
                © ${new Date().getFullYear()} CatStego — Tous droits réservés
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─────────────────────────────────────────────
// Fonction principale d'envoi
// ─────────────────────────────────────────────
const sendVerificationEmail = async (to, code) => {
  if (!isConfigured || process.env.NODE_ENV === 'development') {
    console.log('─'.repeat(50));
    console.log('✉️  [EMAIL SIMULATION]');
    console.log(`   Destinataire : ${to}`);
    console.log(`   Code         : ${code}`);
    console.log('─'.repeat(50));
    return;
  }

  const mailOptions = {
    from: `"CatStego 🐱" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${code} — Ton code de vérification CatStego`,
    text: `Ton code de vérification CatStego est : ${code}\nIl expire dans 15 minutes.`,
    html: buildVerificationHtml(code),
  };

  // L'erreur remonte volontairement : si l'email échoue, la route /register
  // renvoie un 500 plutôt que de créer un compte impossible à vérifier.
  await transporter.sendMail(mailOptions);
  console.log(`✅ [EMAIL] Code envoyé à ${to}`);
};

module.exports = { sendVerificationEmail };
