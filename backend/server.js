const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
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

app.post('/send-emails', upload, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!req.files || !req.files['excelFile']) {
      return res.status(400).json({ error: 'Excel file is required.' });
    }

    const excelBuffer = req.files['excelFile'][0].buffer;
    const images = req.files['imageFiles'] || [];

    const workbook = xlsx.read(excelBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const contacts = xlsx.utils.sheet_to_json(sheet);
    console.log('Parsed contacts:', contacts);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    for (const contact of contacts) {
      if (!contact.email) {
        console.log('⚠️ Skipped contact with missing email:', contact);
        continue;
      }

      const personalizedMessage = message
        .replace('{{name}}', contact.name || '')
        .replace('{{number}}', contact.number || '');

      const attachments = images.map((img, idx) => ({
        filename: img.originalname,
        content: img.buffer,
        cid: `embedded-image-${idx}`
      }));

      let htmlContent = personalizedMessage;
      if (message.includes('{{image}}')) {
        const imageTags = attachments.map(att => `<img src="cid:${att.cid}" style="max-width:100%;"/><br/>`).join('');
        htmlContent = htmlContent.replace('{{image}}', imageTags);
      }

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: contact.email,
        subject,
        html: htmlContent,
        attachments
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to: ${contact.email}`);
    }

    res.json({ message: 'Emails sent successfully!' });

  } catch (error) {
    console.error('❌ Email send error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to send emails.' });
  }
});

app.listen(5000, () => {
  console.log('🚀 Server running at http://localhost:5000');
});
