const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
require('dotenv').config();   // load .env file

const app = express();
app.use(express.json());

// ✅ Atlas connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connected to MongoDB Atlas"))
.catch(err => console.error("❌ Connection error:", err));

// Schema & Model
const urlSchema = new mongoose.Schema({
  shortId: { type: String, unique: true },
  longUrl: { type: String, required: true },
  accessCount: { type: Number, default: 0 }
});

const Url = mongoose.model('Url', urlSchema);

// POST /shortUrl
app.post('/shortUrl', async (req, res) => {
  try {
    const { longUrl } = req.body;
    if (!longUrl) return res.status(400).json({ error: 'Long URL required' });

    const shortId = nanoid(6);
    const newUrl = new Url({ shortId, longUrl });
    await newUrl.save();

    res.json({ shortUrl: `http://localhost:3000/${shortId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:shortId
app.get('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const urlEntry = await Url.findOne({ shortId });

    if (!urlEntry) return res.status(404).send('URL not found');

    urlEntry.accessCount++;
    await urlEntry.save();

    res.redirect(urlEntry.longUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /:shortId
app.patch('/:shortId', async (req, res) => {
  try {
    const { shortId } = req.params;
    const updates = req.body;

    const urlEntry = await Url.findOneAndUpdate({ shortId }, updates, { new: true });
    if (!urlEntry) return res.status(404).send('URL not found');

    res.json(urlEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
