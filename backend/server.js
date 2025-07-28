const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const dns = require('dns').promises;
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'excelFile', maxCount: 1 },
  { name: 'imageFiles', maxCount: 10 }
]);

app.get('/', (req, res) => {
  res.send('✅ Email Backend Server is running!');
});

app.get('/download-excel', (req, res) => {
  const filePath = path.join(__dirname, 'contacts.xlsx');
  res.download(filePath, 'contacts.xlsx');
});

// Email validation
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const hasMXRecord = async (email) => {
  try {
    const domain = email.split('@')[1];
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
};

function formatMessage(message) {
  if (!message) return '';
  const cleaned = message.replace(/(\n\s*){2,}/g, '\n');
  const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  return lines.map(line => `<p>${line}</p>`).join('');
}

app.post('/send-emails', upload, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!req.files || !req.files['excelFile']) {
      return res.status(400).json({ message: 'Excel file is required.' });
    }

    const excelBuffer = req.files['excelFile'][0].buffer;
    const images = req.files['imageFiles'] || [];

    const workbook = xlsx.read(excelBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const contactsRaw = xlsx.utils.sheet_to_json(sheet);

    const contacts = contactsRaw.map(contact => {
      const normalized = {};
      for (const key in contact) {
        normalized[key.toLowerCase()] = contact[key];
      }
      return normalized;
    });

    console.log('Parsed contacts:', contacts);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    const baseStyle = `
      <style>
        body { font-family: Arial, sans-serif; font-size: 14px; }
        p { margin: 6px 0 !important; line-height: 1.4; }
        ul { margin: 6px 0 10px 20px; }
        li { margin-bottom: 4px; }
        img { display: block; margin: 10px 0; max-width: 100%; }
      </style>
    `;

    const results = [];

    for (const contact of contacts) {
      const email = contact.email?.trim();
      console.log(`Processing email: ${email}`);

      if (!email || !isValidEmail(email) || !(await hasMXRecord(email))) {
        console.log(`❌ Invalid or unreachable email: ${email}`);
        results.push({ email: email || 'Unknown', status: 'Invalid Email' });
        continue;
      }

      let personalized = message
        .replace('{{name}}', contact.name || '')
        .replace('{{number}}', contact.number || '');

      let formattedMessage = formatMessage(personalized);

      const attachments = images.map((img, idx) => ({
        filename: img.originalname,
        content: img.buffer,
        cid: `img-${idx}`
      }));

      const embeddedImages = attachments.map(att => `<img src="cid:${att.cid}" />`).join('');
      if (formattedMessage.includes('{{image}}')) {
        formattedMessage = formattedMessage.replace('{{image}}', embeddedImages);
      }

      const htmlContent = baseStyle + formattedMessage;

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject,
        html: htmlContent,
        attachments
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to: ${email}`);
        results.push({ email, status: 'Sent' });
      } catch (err) {
        console.error(`❌ Failed to send to ${email}:`, err.message);
        results.push({ email, status: 'Failed' });
      }
    }

    console.log('Final results:', results);

    const successEmails = results.filter(r => r.status === 'Sent').map(r => r.email);
    const failedEmails = results.filter(r => r.status !== 'Sent').map(r => r.email);

    return res.status(200).json({
      results,
      successEmails,
      failedEmails
    });

  } catch (error) {
    console.error('❌ Server error:', error.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
