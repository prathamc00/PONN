import React, { useState } from 'react';

// Dimensions matching standard A4 Landscape (1122 x 794)
export const CERT_WIDTH = 1122;
export const CERT_HEIGHT = 794;

export async function toDataUrl(src) {
  const response = await fetch(src, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${src}`);
  }
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to convert asset to data URL'));
    reader.readAsDataURL(blob);
  });
}

export async function firstSuccessfulDataUrl(candidates) {
  for (const src of candidates) {
    try {
      return await toDataUrl(src);
    } catch {
      // Try next candidate
    }
  }
  throw new Error('No valid image candidate found');
}

function loadImg(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 60)}`));
    img.src = src;
  });
}

export async function tryLoadImg(src) {
  try {
    return await loadImg(src);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PURE-CANVAS HIGH-RESOLUTION EXPORT (2x Retina, 2244 x 1588)
// Matches template.png authentic styling without artificial purple borders
// ─────────────────────────────────────────────────────────────────────────────
export async function buildCertificateDataUrl(cert, userName, logoDataUrls) {
  const W = CERT_WIDTH;
  const H = CERT_HEIGHT;
  const S = 2; // 2x retina scale

  const courseTitle = (cert?.course?.title || cert?.courseTitle || cert?.title || 'Course')
    .replace(/[–—-]?\s*Quiz\s*Completion/gi, '')
    .trim();

  const rawDate = cert?.earnedDate || cert?.issuedAt || cert?.createdAt || Date.now();
  const issueDate = new Date(rawDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const [ctaImg, msmeImg, signatureImg, stampImg, qrImg] = await Promise.all([
    tryLoadImg(logoDataUrls.cta),
    tryLoadImg(logoDataUrls.msme),
    tryLoadImg(logoDataUrls.signature),
    tryLoadImg(logoDataUrls.stamp),
    tryLoadImg(`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/verify/${cert.certificateId}`)}`),
  ]);

  const cv = document.createElement('canvas');
  cv.width = W * S;
  cv.height = H * S;
  const c = cv.getContext('2d');
  c.scale(S, S);

  // Pristine white paper background
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, W, H);

  // ── WATERMARK: Subtle centered CTA logo ──
  c.save();
  c.globalAlpha = 0.11;
  if (ctaImg) {
    const wmH = 340;
    const wmW = ctaImg.naturalWidth * (wmH / ctaImg.naturalHeight);
    c.drawImage(ctaImg, (W - wmW) / 2, (H - wmH) / 2 + 10, wmW, wmH);
  }
  c.restore();

  // ── HEADER: CTA Logo (Left) ──
  if (ctaImg) {
    const ctaH = 82;
    const ctaW = ctaImg.naturalWidth * (ctaH / ctaImg.naturalHeight);
    c.drawImage(ctaImg, 56, 42, ctaW, ctaH);
  }

  // ── HEADER: MSME Logo (Right) ──
  if (msmeImg) {
    const msmeH = 46;
    const msmeW = msmeImg.naturalWidth * (msmeH / msmeImg.naturalHeight);
    c.drawImage(msmeImg, W - 56 - msmeW, 58, msmeW, msmeH);
  }

  // ── HEADER: Center Institution & UDYAM Registration ──
  c.textAlign = 'center';
  c.fillStyle = '#4C1D95';
  c.font = 'bold 32px "Times New Roman", Times, serif';
  c.fillText('Crismatech Automation', W / 2, 74);

  c.fillStyle = '#2563EB';
  c.font = 'bold 20px "Times New Roman", Times, serif';
  c.fillText('UDYAM-KR-19-0001627', W / 2, 108);

  // ── SEPARATOR LINE: Clean horizontal purple divider bar ──
  c.fillStyle = '#5B21B6';
  c.fillRect(52, 140, W - 104, 3);

  // ── DATE (Right-aligned below bar) ──
  c.textAlign = 'right';
  c.fillStyle = '#1f2937';
  c.font = '15px "Times New Roman", Times, serif';
  c.fillText(`Date: ${issueDate}`, W - 54, 172);

  // ── TITLE: Cursive "Certificate of Achievement" ──
  c.textAlign = 'center';
  c.fillStyle = '#6D28D9';
  c.font = 'italic 52px "Brush Script MT", "Palatino Linotype", "URW Chancery L", cursive, serif';
  c.fillText('Certificate of Achievement', W / 2, 238);

  // ── BODY PARAGRAPHS (Left-aligned within clean margins) ──
  const startX = 54;
  const maxWidth = W - 108;
  const bodyY = 295;
  const lh = 30;

  // Paragraph 1 with colored dynamic spans
  c.font = '16px "Times New Roman", Times, serif';
  const scoreText = `${cert?.scorePercent || 100}%`;
  const gradeText = `${cert?.grade || 'A+'}`;

  // Helper for multi-line text wrapping with coloured spans
  const p1Segments = [
    { text: 'This is to certify that ', color: '#1f2937', bold: false },
    { text: `${userName}`, color: '#DC2626', bold: true },
    { text: ', has successfully completed the assessment for ', color: '#1f2937', bold: false },
    { text: `"${courseTitle} — Course Completion"`, color: '#DC2626', bold: true },
    { text: ' in our Organization with a score of ', color: '#1f2937', bold: false },
    { text: scoreText, color: '#1D4ED8', bold: true },
    { text: ' and has been awarded a grade of ', color: '#1f2937', bold: false },
    { text: `${gradeText}.`, color: '#1D4ED8', bold: true },
  ];

  let curX = startX;
  let curY = bodyY;

  for (const seg of p1Segments) {
    c.font = `${seg.bold ? 'bold ' : ''}16px "Times New Roman", Times, serif`;
    c.fillStyle = seg.color;
    const words = seg.text.split(' ');

    for (let i = 0; i < words.length; i++) {
      const word = words[i] + (i < words.length - 1 ? ' ' : '');
      const wordW = c.measureText(word).width;

      if (curX + wordW > startX + maxWidth && curX > startX) {
        curX = startX;
        curY += lh;
      }
      c.fillText(word, curX, curY);
      curX += wordW;
    }
  }

  // Paragraph 2
  curY += lh + 18;
  c.font = '16px "Times New Roman", Times, serif';
  c.fillStyle = '#1f2937';
  c.fillText(
    'The performance during the assessment was found satisfactory, demonstrating keen interest to learn and a commitment to academic excellence.',
    startX,
    curY
  );

  // Paragraph 3
  curY += lh + 4;
  c.fillText(
    'We appreciate the effort and wish continued success in all future endeavors.',
    startX,
    curY
  );

  // ── BOTTOM RIGHT: Signature & Official Rubber Stamp ──
  const stampW = 220;
  const stampH = 70;
  const stampX = W - 54 - stampW;
  const stampY = H - 38 - stampH;

  // Signature right above the stamp
  if (signatureImg) {
    const sigH = 88;
    const sigW = signatureImg.naturalWidth * (sigH / signatureImg.naturalHeight);
    c.drawImage(signatureImg, stampX + 15, stampY - sigH + 18, sigW, sigH);
  }

  // Official rubber stamp
  if (stampImg) {
    c.drawImage(stampImg, stampX, stampY, stampW, stampH);
  }

  // ── BOTTOM LEFT: Verification QR & Official Registry Hash ──
  const footY = H - 50;
  if (qrImg) {
    c.drawImage(qrImg, startX, footY - 45, 52, 52);
  }

  c.textAlign = 'left';
  c.fillStyle = '#4B5563';
  c.font = '11px "Times New Roman", Times, serif';
  c.fillText('Official Issued Credential', startX + 62, footY - 28);
  c.font = 'bold 12px monospace';
  c.fillStyle = '#111827';
  c.fillText(`ID: ${cert?.certificateId || 'CRISMATECH-VERIFIED'}`, startX + 62, footY - 12);
  c.font = '10px "Times New Roman", Times, serif';
  c.fillStyle = '#6B7280';
  c.fillText(`Verify: ${window.location.origin}/verify/${cert?.certificateId}`, startX + 62, footY + 4);

  return cv.toDataURL('image/png', 1.0);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHENTIC CERTIFICATE TEMPLATE COMPONENT
// True replica of template.png — clean paper, authentic stamp, no gaudy borders
// ─────────────────────────────────────────────────────────────────────────────
export default function CertificateTemplate({
  cert,
  userName,
  scale = 1,
  forExport = false,
  logoDataUrls,
}) {
  const W = CERT_WIDTH;
  const H = CERT_HEIGHT;
  const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '');

  const ctaSrc = logoDataUrls?.cta || `${base}/cta_logo_clean.png`;
  const msmeSrc = logoDataUrls?.msme || `${base}/msme_logo.png`;
  const signatureSrc = logoDataUrls?.signature || `${base}/sign_clean.png`;
  const stampSrc = logoDataUrls?.stamp || `${base}/stamp.png`;

  const courseTitle = (cert?.course?.title || cert?.courseTitle || cert?.title || 'Course')
    .replace(/[–—-]?\s*Quiz\s*Completion/gi, '')
    .trim();

  const rawDate = cert?.earnedDate || cert?.issuedAt || cert?.createdAt || Date.now();
  const issueDate = new Date(rawDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      style={{
        width: W,
        height: H,
        transform: forExport ? undefined : `scale(${scale})`,
        transformOrigin: 'top left',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Times New Roman", Times, Georgia, serif',
        boxSizing: 'border-box',
        padding: '44px 54px',
        boxShadow: forExport ? 'none' : '0 25px 60px -15px rgba(0,0,0,0.18), 0 0 1px rgba(0,0,0,0.1)',
        color: '#1f2937',
      }}
    >
      {/* ── BACKGROUND WATERMARK: CTA Logo ── */}
      <div
        style={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.11,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <img
          src={ctaSrc}
          alt=""
          style={{ width: 480, height: 'auto', display: 'block' }}
        />
      </div>

      {/* ── HEADER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* CTA Logo */}
        <div style={{ width: 220, display: 'flex', alignItems: 'center' }}>
          <img
            src={ctaSrc}
            alt="Crismatech Automation"
            style={{ height: 82, width: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Institution & Registration */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#4C1D95',
              letterSpacing: '0.5px',
              lineHeight: 1.2,
            }}
          >
            Crismatech Automation
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#2563EB',
              marginTop: 6,
              letterSpacing: '0.5px',
            }}
          >
            UDYAM-KR-19-0001627
          </div>
        </div>

        {/* MSME Logo */}
        <div style={{ width: 220, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <img
            src={msmeSrc}
            alt="MSME"
            style={{ height: 46, width: 'auto', objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* ── HORIZONTAL PURPLE BAR ── */}
      <div
        style={{
          height: 3,
          background: '#5B21B6',
          marginTop: 18,
          marginBottom: 10,
          position: 'relative',
          zIndex: 1,
        }}
      />

      {/* ── DATE ── */}
      <div
        style={{
          textAlign: 'right',
          fontSize: 15,
          color: '#1f2937',
          position: 'relative',
          zIndex: 1,
          marginBottom: 18,
        }}
      >
        Date: {issueDate}
      </div>

      {/* ── TITLE: Cursive "Certificate of Achievement" ── */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 32,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontFamily: '"Brush Script MT", "Palatino Linotype", "URW Chancery L", "Apple Chancery", cursive, serif',
            fontSize: 52,
            color: '#6D28D9',
            fontStyle: 'italic',
            fontWeight: 'normal',
          }}
        >
          Certificate of Achievement
        </span>
      </div>

      {/* ── BODY TEXT ── */}
      <div
        style={{
          fontSize: 16.5,
          lineHeight: 1.95,
          color: '#1f2937',
          textAlign: 'left',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <p style={{ marginBottom: 18 }}>
          This is to certify that{' '}
          <strong style={{ color: '#DC2626' }}>{userName}</strong>,{' '}
          has successfully completed the assessment for{' '}
          <strong style={{ color: '#DC2626' }}>"{courseTitle} — Course Completion"</strong>{' '}
          in our Organization with a score of{' '}
          <strong style={{ color: '#1D4ED8' }}>{cert?.scorePercent || 100}%</strong>{' '}
          and has been awarded a grade of{' '}
          <strong style={{ color: '#1D4ED8' }}>{cert?.grade || 'A+'}</strong>.
        </p>

        <p style={{ marginBottom: 18 }}>
          The performance during the assessment was found satisfactory, demonstrating keen
          interest to learn and a commitment to academic excellence.
        </p>

        <p>
          We appreciate the effort and wish continued success in all future endeavors.
        </p>
      </div>

      {/* ── FOOTER: Verification on Left, Signature & Authentic Stamp on Right ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 54,
          right: 54,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          zIndex: 1,
        }}
      >
        {/* Left: Verification Badge & QR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=56x56&data=${encodeURIComponent(`${window.location.origin}/verify/${cert?.certificateId}`)}`}
            alt="Verify QR"
            style={{ width: 50, height: 50, borderRadius: 4, border: '1px solid #e5e7eb', padding: 2, backgroundColor: '#ffffff' }}
          />
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Official Issued Credential
            </div>
            <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 12, color: '#111827', marginTop: 2 }}>
              ID: {cert?.certificateId || 'CRISMATECH-VERIFIED'}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
              Scan to verify authentic ledger record
            </div>
          </div>
        </div>

        {/* Right: Signature & Rubber Stamp */}
        <div style={{ position: 'relative', width: 230, minHeight: 110, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
          {/* Signature */}
          <img
            src={signatureSrc}
            alt="Signature"
            style={{
              height: 78,
              width: 'auto',
              objectFit: 'contain',
              marginBottom: -16,
              marginRight: 24,
              position: 'relative',
              zIndex: 2,
            }}
          />
          {/* Official Rubber Stamp */}
          <img
            src={stampSrc}
            alt="CRISMATECH AUTOMATION Stamp"
            style={{
              width: 220,
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>
      </div>
    </div>
  );
}
