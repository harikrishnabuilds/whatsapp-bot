const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const { VERIFY_TOKEN, WA_TOKEN, PHONE_ID, GROQ_KEY } = process.env;
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(403);
  }
});
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || msg.type !== 'text') return;
  try {
    const ai = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a helpful customer support assistant. Keep replies short.' },
          { role: 'user', content: msg.text.body }
        ]
      },
      { headers: { Authorization: `Bearer ${GROQ_KEY}` } }
    );
    const reply = ai.data.choices[0].message.content;
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
