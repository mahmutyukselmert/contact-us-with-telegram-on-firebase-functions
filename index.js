/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const WEBSITE_NAME = 'mahmutyukselmert.github.io'; //Website name
const ORIGIN_URL = 'https://mahmutyukselmert.github.io'; //Website URL

const functions = require("firebase-functions");
const cors = require("cors")({ origin: ORIGIN_URL }); 
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = ''; //YOUR_BOT_TOKEN
const CHAT_ID = ''; //YOUR_CHAT_ID

const ipRequestLog = new Map(); 

exports.sendTelegramMessage = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { name, email, subject, message } = req.body;

      if (req.method !== 'POST') {
        return res.status(405).send({ error: 'Geçersiz istek metodu. Sadece POST destekleniyor.' });
      }

      if ( !name || !email || !subject || !message) {
        return res.status(400).send({ error: 'Tüm alanların doldurulması zorunludur!' });
      }

      const ipAddress = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

      const now = Date.now();
      const lastRequestTime = ipRequestLog.get(ipAddress);

      if (lastRequestTime && now - lastRequestTime < 15 * 60 * 1000) {
        return res.status(429).send({ error: "Çok fazla istek gönderildi. Lütfen 15 dakika bekleyin." });
      }

      ipRequestLog.set(ipAddress, now);

      const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

      // Mesaj formatı
      const formattedMessage = `
  📬 *${WEBSITE_NAME} İletişim Formundan Yeni Mesaj*
  ----------------------------------
  👤 *Ad & Soyad*: ${name}
  📧 *E-Posta*: ${email}
  📋 *Konu*: ${subject}
  ✉️ *Mesaj*: ${message}
      `;

      const response = await axios.post(telegramApiUrl, {
        chat_id: CHAT_ID,
        text: formattedMessage,
        parse_mode: 'Markdown',
      });

      return res.status(200).send({ success: true, data: response.data });

    } catch (error) {
      console.error('Telegram mesajı gönderilemedi:', error);
      return res.status(500).send({ error: 'Mesaj Gönderilemedi.' });
    }
  });
});
