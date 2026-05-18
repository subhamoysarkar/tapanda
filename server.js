require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable GZIP compression to optimize payload size
app.use(compression());

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files with Cache-Control headers for optimization
const staticOptions = {
  maxAge: '7d', // Cache static assets (images, css, js) for 7 days
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // Don't cache HTML to ensure latest content is always served
      res.setHeader('Cache-Control', 'public, max-age=0');
    }
  }
};
app.use(express.static(__dirname, staticOptions));

/* ─── Email Transporter ────────────────────────────────────────────────────── */
// Port 587 (STARTTLS) is confirmed working on GoDaddy cPanel shared hosting.
// secure:false means the connection starts plain then upgrades via STARTTLS.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'p3plzcpnl509111.prod.phx3.secureserver.net',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // STARTTLS — upgrades after connect
  auth: {
    user: process.env.SMTP_USER || 'enquiry@tapanda.in',
    pass: process.env.SMTP_PASS
  },
  tls: { rejectUnauthorized: false } // Accept GoDaddy shared-hosting self-signed certs
});

/* ─── POST /send-enquiry ───────────────────────────────────────────────────── */
// Contact Form — Website Enquiry
app.post('/send-enquiry', async (req, res) => {
  const { name, email, phone, projectType, brief } = req.body;
  const submitTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  const mailBody = `Submitted At: ${submitTime}
Full Name: ${name || 'N/A'}
Email Address: ${email || 'N/A'}
Phone: ${phone || 'N/A'}
Project Type: ${projectType || 'N/A'}
Brief: ${brief || 'N/A'}`;

  try {
    // 1. Send notification to the internal team
    await transporter.sendMail({
      from: `"Ta Panda Innovation" <${process.env.SMTP_USER || 'enquiry@tapanda.in'}>`,
      to: 'tapandainnovation@gmail.com',
      subject: `Website Enquiry | ${name || 'N/A'}`,
      text: mailBody
    });

    // 2. Send nicely branded acknowledgement email to the customer
    if (email) {
      const ackBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You — Ta Panda Innovation</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <!-- Gold Top Bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#C9A84C,#e8c96e,#C9A84C);height:4px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding:36px 40px 24px;">
              <p style="margin:0;font-size:11px;letter-spacing:4px;color:#C9A84C;text-transform:uppercase;font-weight:600;">Ta Panda Innovation</p>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:1px;line-height:1.3;">
                Your Enquiry is<br><span style="color:#C9A84C;font-weight:600;">Received.</span>
              </h1>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C44,transparent);"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;color:#cccccc;font-size:15px;line-height:1.8;">
              <p style="margin:0 0 16px;">Dear <strong style="color:#ffffff;">${name || 'Valued Customer'}</strong>,</p>
              <p style="margin:0 0 16px;">
                Thank you for reaching out to <strong style="color:#C9A84C;">Ta Panda Innovation</strong>. We've successfully received your enquiry and our design team is already taking a look.
              </p>
              <p style="margin:0 0 24px;">
                We pride ourselves on delivering <em>pixel-perfect spaces with aesthetic intelligence</em> — and your vision deserves nothing less. One of our experts will get back to you shortly to begin the conversation.
              </p>

              <!-- Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a1a;border-left:3px solid #C9A84C;border-radius:4px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;color:#C9A84C;text-transform:uppercase;">Your Enquiry Summary</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
                      <tr>
                        <td style="color:#888;font-size:13px;padding:4px 0;width:130px;">Project Type</td>
                        <td style="color:#ffffff;font-size:13px;padding:4px 0;">${projectType || 'Not specified'}</td>
                      </tr>
                      <tr>
                        <td style="color:#888;font-size:13px;padding:4px 0;vertical-align:top;">Your Brief</td>
                        <td style="color:#ffffff;font-size:13px;padding:4px 0;">${brief || 'Not specified'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#aaa;font-size:13px;">Meanwhile, feel free to explore our portfolio or reach us directly:</p>
              <p style="margin:0;">
                <a href="https://tapanda.in" style="color:#C9A84C;text-decoration:none;font-size:13px;">🌐 tapanda.in</a> &nbsp;|&nbsp;
                <a href="mailto:enquiry@tapanda.in" style="color:#C9A84C;text-decoration:none;font-size:13px;">✉️ enquiry@tapanda.in</a> &nbsp;|&nbsp;
                <a href="https://wa.me/919163979444" style="color:#C9A84C;text-decoration:none;font-size:13px;">📱 WhatsApp Us</a>
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 40px 36px;">
              <a href="https://tapanda.in/#projects" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#e8c96e);color:#000000;text-decoration:none;padding:14px 32px;border-radius:4px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">View Our Portfolio</a>
            </td>
          </tr>

          <!-- Gold Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C44,transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 40px;">
              <p style="margin:0 0 6px;font-size:12px;color:#555;">Warm regards,</p>
              <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#C9A84C;letter-spacing:1px;">Ta Panda Innovation</p>
              <p style="margin:0;font-size:11px;color:#444;letter-spacing:1px;">Precision Designed. Perfectly Executed.</p>
              <p style="margin:16px 0 0;font-size:10px;color:#333;">Sanjeeva Town Duplex, Thakdari Road, Newtown, Kolkata — 700156</p>
              <p style="margin:4px 0 0;font-size:10px;color:#333;">This is an automated acknowledgement. Please do not reply to this email.</p>
            </td>
          </tr>

          <!-- Gold Bottom Bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#C9A84C,#e8c96e,#C9A84C);height:2px;"></td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
      await transporter.sendMail({
        from: `"Ta Panda Innovation" <${process.env.SMTP_USER || 'enquiry@tapanda.in'}>`,
        to: email,
        subject: `We've Received Your Enquiry — Ta Panda Innovation`,
        html: ackBody
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Email send error (enquiry):', err.message);
    res.json({ success: true, warning: 'Email not sent – check SMTP configuration.' });
  }
});

/* ─── POST /send-consultation ─────────────────────────────────────────────── */
// Consultation Modal — Website Consultation Request
app.post('/send-consultation', async (req, res) => {
  const { name, phone } = req.body;
  const submitTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

  const mailBody = `Submitted At: ${submitTime}
Full Name: ${name || 'N/A'}
Phone: ${phone || 'N/A'}`;

  try {
    await transporter.sendMail({
      from: `"Ta Panda Innovation" <${process.env.SMTP_USER || 'enquiry@tapanda.in'}>`,
      to: 'tapandainnovation@gmail.com',
      subject: `Website Consultation Request | ${name || 'N/A'}`,
      text: mailBody
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error (consultation):', err.message);
    res.json({ success: true, warning: 'Email not sent – check SMTP configuration.' });
  }
});

/* ─── Multer Storage ───────────────────────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || 'uncategorized';
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const dir = path.join(__dirname, 'images', 'projects', slug);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    cb(null, `${safeName}${ext}`);
  }
});
const upload = multer({ storage });

/* ─── POST /upload-image ──────────────────────────────────────────────────── */
app.post('/upload-image', upload.array('file'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded.' });
    }
    const category = req.body.category || 'uncategorized';
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const paths = req.files.map(file => `images/projects/${slug}/${file.filename}`);
    res.json({ success: true, paths });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during upload.' });
  }
});

/* ─── GET /projects-data ─────────────────────────────────────────────────── */
app.get('/projects-data', (req, res) => {
  const dataPath = path.join(__dirname, 'projects-data.json');
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json({ categories: [] });
      return res.status(500).json({ success: false, error: 'Failed to read data file.' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ success: false, error: 'Invalid JSON in data file.' });
    }
  });
});

/* ─── POST /save-projects-data ──────────────────────────────────────────── */
app.post('/save-projects-data', (req, res) => {
  const dataPath = path.join(__dirname, 'projects-data.json');
  fs.writeFile(dataPath, JSON.stringify(req.body, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to write file.' });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`Ta Panda Server is running!`);
  console.log(`Main Website: http://localhost:${PORT}/`);
  console.log(`CRM Admin:    http://localhost:${PORT}/admin.html`);
  console.log(`==============================================\n`);
});
