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

// File upload config
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'excelFile', maxCount: 1 },
  { name: 'imageFiles', maxCount: 10 }
]);

// Routes
app.get('/', (req, res) => {
  res.send('✅ Email Backend Server is running!');
});

app.get('/download-excel', (req, res) => {
  const filePath = path.join(__dirname, 'contacts.xlsx');
  res.download(filePath, 'contacts.xlsx');
});

// Helper: sanitize message, wrap plain lines in <p>, and replace multiple <br>
function formatMessage(message) {
  if (!message) return '';

  // Remove excessive blank lines and replace with single <br>
  let cleaned = message.replace(/(\n\s*){2,}/g, '\n');

  // Split by lines and wrap each line in <p>
  const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Convert plain text lines to <p>
  const wrapped = lines.map(line => `<p>${line}</p>`).join('');

  return wrapped;
}

app.post('/send-emails', upload, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!req.files || !req.files['excelFile']) {
      return res.status(400).json({ message: 'Excel file is required.' });
    }

    const excelBuffer = req.files['excelFile'][0].buffer;
    const images = req.files['imageFiles'] || [];

    // Parse Excel contacts
    const workbook = xlsx.read(excelBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const contacts = xlsx.utils.sheet_to_json(sheet);

    // Email transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    // Base style to reduce spacing
    const baseStyle = `
      <style>
        body { font-family: Arial, sans-serif; font-size: 14px; }
        p { margin: 6px 0 !important; line-height: 1.4; }
        ul { margin: 6px 0 10px 20px; }
        li { margin-bottom: 4px; }
        img { display: block; margin: 10px 0; max-width: 100%; }
      </style>
    `;

    // Loop through contacts
    for (const contact of contacts) {
      if (!contact.email) {
        console.log('⚠️ Skipped contact with missing email:', contact);
        continue;
      }

      // Replace placeholders in raw message text first
      let personalizedRaw = message
        .replace('{{name}}', contact.name || '')
        .replace('{{number}}', contact.number || '');

      // Format the message: wrap lines in <p>
      let formattedMessage = formatMessage(personalizedRaw);

      // Embed images
      const attachments = images.map((img, idx) => ({
        filename: img.originalname,
        content: img.buffer,
        cid: `embedded-image-${idx}`
      }));

      // Create image tags to replace {{image}} placeholder if present
      const imageTags = attachments.map(att => `<img src="cid:${att.cid}" />`).join('');

      // If the message includes {{image}}, replace it
      if (formattedMessage.includes('{{image}}')) {
        formattedMessage = formattedMessage.replace('{{image}}', imageTags);
      }

      // Compose final html with base styles and formatted content
      const htmlContent = baseStyle + formattedMessage;

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
    res.status(500).json({ message: error.message || 'Failed to send emails.' });
  }
});

app.listen(5000, () => {
  console.log('🚀 Server running at http://localhost:5000');
});
