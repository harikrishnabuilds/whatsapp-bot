const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const { VERIFY_TOKEN, WA_TOKEN, PHONE_ID, GEMINI_KEY } = process.env;

// Meta verifies your webhook here
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});

// Incoming WhatsApp messages arrive here
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || msg.type !== 'text') return;

  try {
    const ai = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      { contents: [{ parts: [{ text: 'You are a helpful customer support assistant. Keep replies short. Customer says: ' + msg.text.body }] }] }
    );
    const reply = ai.data.candidates[0].content.parts[0].text;

    await axios.post(
      `https://graph.facebook.com/v21.0/${PHONE_ID}/messages`,
      { messaging_product: 'whatsapp', to: msg.from, text: { body: reply } },
      { headers: { Authorization: `Bearer ${WA_TOKEN}` } }
    );
  } catch (e) {
    console.error(e.response?.data || e.message);
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Bot running'));