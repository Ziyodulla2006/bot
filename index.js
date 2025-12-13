// ==================== WEB SERVER ====================
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('🤖 Bot ishlayapti!');
});

app.listen(PORT, () => {
    console.log(`🌐 Web server ${PORT}-portda`);
});

// ==================== TELEGRAM BOT ====================
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Tokenlarni tekshirish
const TELEGRAM_TOKEN = "7603962484:AAHvqlF8ktgilUKQD6t3wfRa_4Ikfo4PWuk";
const GOOGLE_AI_KEY = "AIzaSyCPw3HdwBsmw6bKHuLrvja6KCbfaeGmEbE";

if (!TELEGRAM_TOKEN || !GOOGLE_AI_KEY) {
    console.error('❌ Tokenlar yoʻq!');
    process.exit(1);
}

// Botni yaratish
const bot = new TelegramBot(TELEGRAM_TOKEN, { 
    polling: true,
    filepath: false
});

// ==================== GOOGLE AI ====================
const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);

// ✅ FAQT BIR MODEL - gemini-1.0-pro (eng ishonchli)
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.0-pro" 
});
console.log('✅ Google AI modeli: gemini-1.0-pro');

// ==================== BOT KOMANDALARI ====================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🤖 Salom! Savolingizni yozing.");
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "📝 Faqat savol yozing, men javob beraman.");
});

// ==================== ASOSIY XABAR ====================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;

    try {
        await bot.sendChatAction(chatId, 'typing');
        
        // Google AI ga so'rov
        const result = await model.generateContent(text);
        const response = result.response.text();
        
        // Javobni yuborish (parse_mode siz)
        await bot.sendMessage(chatId, response);
        
        console.log(`[${chatId}] So'rov: "${text.substring(0,30)}..."`);
        
    } catch (error) {
        console.error(`[${chatId}] Google AI xatosi:`, error.message);
        await bot.sendMessage(chatId, '❌ Google AI xatosi. /help');
    }
});

// ==================== BOT ISHGA TUSHDI ====================
console.log('🤖 Telegram bot ishga tushdi...');
console.log('✅ Xabarlarni kutmoqda...');