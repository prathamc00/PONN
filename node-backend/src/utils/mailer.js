import nodemailer from 'nodemailer';

let transporter = null;

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'CRISMATECH Education <director@crismatech.com>';

  if (mailer) {
    return mailer.sendMail({ from, to, subject, text, html });
  }

  console.info(`📧 [DEV EMAIL SIMULATOR] To: ${to} | Subject: "${subject}"\n${text || html}\n`);
  return { simulated: true, to, subject };
}
