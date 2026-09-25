require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const noteRoutes = require('./routes/noteRoutes');
// const chatbotRoutesB = require('./routes/chatbotRoutesB'); // Module B (debug experiment, preserved)
const chatbotRoutes = require('./routes/chatbotRoutes');      // Module A (active)

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/chatbot', chatbotRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ews_db';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB EWS Database');
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey || groqKey.trim() === '' || groqKey === 'your_groq_api_key_here') {
      console.log('\x1b[31m%s\x1b[0m', '❌ [Chatbot] GROQ_API_KEY is MISSING or UNCONFIGURED in backend/.env');
    } else {
      console.log('\x1b[32m%s\x1b[0m', `✅ [Chatbot] GROQ_API_KEY loaded (${groqKey.trim().slice(0, 8)}...)`);
    }
    app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

