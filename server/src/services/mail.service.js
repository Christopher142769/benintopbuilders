import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const useConsole =
    !env.smtpHost ||
    env.smtpHost.includes('example.com') ||
    env.nodeEnv === 'test';
  if (useConsole) {
    transporter = {
      sendMail: async (opts) => {
        logger.info(
          { to: opts.to, subject: opts.subject, text: opts.text },
          'Email (mode console — SMTP non configuré)'
        );
        return { messageId: `dev-${Date.now()}` };
      },
    };
    return transporter;
  }
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
  });
  return transporter;
}

function wrapHtml(title, body) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"/><title>${title}</title></head>
<body style="margin:0;background:#F7F8FA;font-family:Manrope,Arial,sans-serif;color:#15171C">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:24px;border:1.5px solid rgba(21,23,28,.09);overflow:hidden">
    <div style="background:#15171C;color:#fff;padding:20px 28px;font-weight:800;font-size:18px">
      Bénin Top <span style="color:#F97316">Builders</span>
    </div>
    <div style="padding:28px">${body}</div>
    <div style="padding:16px 28px;border-top:1px solid rgba(29,80,200,.28);font-size:12px;color:#666">
      Plateforme BTP · FCFA · Labellisation vérifiée
    </div>
  </div>
</body></html>`;
}

export async function sendMail({ to, subject, html, text }) {
  const transport = getTransporter();
  return transport.sendMail({
    from: env.mailFrom,
    to,
    subject,
    html,
    text,
  });
}

export async function sendOtpEmail(email, code) {
  const subject = 'Votre code de vérification BTB';
  const text = `Votre code Bénin Top Builders est ${code}. Valide 10 minutes.`;
  const html = wrapHtml(
    subject,
    `<p style="margin:0 0 12px">Bonjour,</p>
     <p style="margin:0 0 16px">Voici votre code de vérification (valide <strong>10 minutes</strong>) :</p>
     <p style="font-size:32px;letter-spacing:8px;font-weight:800;color:#1D50C8;margin:0 0 16px">${code}</p>
     <p style="margin:0;color:#666;font-size:14px">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`
  );
  await sendMail({ to: email, subject, html, text });
  return code;
}

export async function sendWelcomeEmail(user) {
  const subject = 'Bienvenue sur Bénin Top Builders';
  const name = user.prenom || user.entreprise || 'membre';
  const text = `Bienvenue ${name} ! Votre compte BTB est actif.`;
  const html = wrapHtml(
    subject,
    `<p>Bienvenue <strong>${name}</strong>,</p>
     <p>Votre adhésion est active. Accédez à votre tableau de bord pour publier votre fiche, répondre aux appels d'offres et plus encore.</p>
     <p><a href="${env.clientUrl}/dashboard" style="display:inline-block;background:#F97316;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:800">Ouvrir mon espace</a></p>`
  );
  await sendMail({ to: user.email, subject, html, text });
}

export async function sendPasswordResetEmail(email, resetUrl) {
  const subject = 'Réinitialisation de mot de passe BTB';
  const text = `Réinitialisez votre mot de passe : ${resetUrl}`;
  const html = wrapHtml(
    subject,
    `<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
     <p><a href="${resetUrl}" style="display:inline-block;background:#1D50C8;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:800">Choisir un nouveau mot de passe</a></p>
     <p style="color:#666;font-size:14px">Lien valide 1 heure. Si ce n'était pas vous, ignorez cet e-mail.</p>`
  );
  await sendMail({ to: email, subject, html, text });
}
