// ==================== 1. WEB SERVER (UptimeRobot uchun) ====================
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// UptimeRobot uchun maxsus endpoint
app.get('/health', (req, res) => {
    console.log('🔄 UptimeRobot so\'rovi qabul qilindi');
    res.json({ 
        status: 'online', 
        service: 'Telegram AI Bot',
        timestamp: new Date().toISOString()
    });
});

// Asosiy sahifa
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Telegram AI Bot</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; }
                h1 { color: #0088cc; }
                .status { color: green; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>🤖 Telegram AI Bot</h1>
            <p class="status">✅ Bot faol ishlamoqda</p>
            <p>Bot manzili: <a href="https://t.me/bubotemasbott_bot">@bubotemasbott_bot</a></p>
            <p>Server vaqti: ${new Date().toLocaleString()}</p>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🌐 Web server ${PORT}-portda ishga tushdi`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

// ==================== 2. TELEGRAM BOT ====================
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Tokenlarni tekshirish
const TELEGRAM_TOKEN = "7603962484:AAHvqlF8ktgilUKQD6t3wfRa_4Ikfo4PWuk";
const GOOGLE_AI_KEY = "AIzaSyCPw3HdwBsmw6bKHuLrvja6KCbfaeGmEbE";

if (!TELEGRAM_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN .env faylda yoʻq!');
    process.exit(1);
}

if (!GOOGLE_AI_KEY) {
    console.warn('⚠️ GOOGLE_AI_KEY yoʻq. Bot faqat test rejimida ishlaydi.');
}

// Botni yaratish
const bot = new TelegramBot(TELEGRAM_TOKEN, {
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10,
            allowed_updates: ['message']
    }
    },
    filepath: false
});

// ==================== 3. GOOGLE AI KONFIGURATSIYASI ====================
let googleAIEnabled = false;
let model = null;

if (GOOGLE_AI_KEY) {
    try {
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
        
        // Modelni ishonchli variantda tanlash
        model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        googleAIEnabled = true;
        console.log('✅ Google AI muvaffaqiyatli ulandi (gemini-1.0-pro)');
        
    } catch (error) {
        console.warn('⚠️ Google AI ulanishi muvaffaqiyatsiz:', error.message);
        console.warn('⚠️ Bot faqat test rejimida ishlaydi');
    }
} else {
    console.log('ℹ️  Google AI kaliti yoʻq. Bot test rejimida.');
}

// ==================== 4. YORDAMCHI FUNKTSIYALAR ====================

// Matnni tozalash (backslash va formatlash xatolarisiz)
function cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Faqat qo'shtirnoq va boshqa maxsus belgilarni escape qilish
    const escapeMap = {
        '"': '\\"',
        "'": "\\'",
        '\\': '\\\\'
    };
    
    let result = text;
    Object.entries(escapeMap).forEach(([char, escaped]) => {
        result = result.replace(new RegExp(`\\${char}`, 'g'), escaped);
    });
    
    // Uzunlikni cheklash
    if (result.length > 4000) {
        result = result.substring(0, 3997) + '...';
    }
    
    return result;
}

// ==================== 5. TELEGRAM KOMANDALARI ====================

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'Foydalanuvchi';
    
    const status = googleAIEnabled ? '✅ AI faol' : '⚠️ Test rejimi';
    
    const message = `Assalomu alaykum, ${firstName}!\n\n` +
                   `🤖 Men ${status}\n\n` +
                   `Savollaringizni menga yozing:\n` +
                   `• Dasturlash\n` +
                   `• Matematika\n` +
                   `• Tarjima\n` +
                   `• Boshqa mavzular\n\n` +
                   `📌 Komandalar:\n` +
                   `/help - Yordam\n` +
                   `/status - Bot holati\n` +
                   `/clear - Yangi suhbat`;
    
    bot.sendMessage(chatId, message);
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 
        `🆘 YORDAM\n\n` +
        `1. Oddiy savol yozing\n` +
        `2. Men javob beraman\n` +
        `3. Suhbatni davom ettiring\n\n` +
        `ℹ️ Agar javob kelmasa, /clear bilan yangilang`
    );
});

bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    const status = googleAIEnabled ? '✅ AI faol' : '⚠️ Test rejimi';
    
    bot.sendMessage(chatId,
        `📊 BOT HOLATI\n\n` +
        `🤖 AI: ${status}\n` +
        `🔗 Server: Faol\n` +
        `🕐 Vaqt: ${new Date().toLocaleTimeString()}\n\n` +
        `Bot @ziyodulla tomonidan yaratilgan`
    );
});

bot.onText(/\/clear/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '🧹 Suhbat yangilandi! Endi savolingizni yozing.');
});

// ==================== 6. ASOSIY XABAR QAYTA ISHLASH ====================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from?.id;
    
    // 1. Faqat haqiqiy foydalanuvchi xabarlarini qayta ishlash
    if (!userId || !text || text.trim() === '') return;
    
    // 2. Komandalarni o'tkazib yuborish
    if (text.startsWith('/')) return;
    
    // 3. Bot xabarlarini o'tkazib yuborish
    if (msg.from?.is_bot) return;
    
    console.log(`[${userId}] So'rov: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    
    try {
        // "Yozmoqda..." statusi
        await bot.sendChatAction(chatId, 'typing');
        
        let response;
        
        if (googleAIEnabled && model) {
            // Google AI dan javob olish
            const result = await model.generateContent(text);
            response = cleanText(result.response.text());
        } else {
            // Test rejimi (Google AI yo'q)
            response = `🤖 Test rejimi\n\n` +
                      `Sizning savolingiz: "${text.substring(0, 100)}"\n\n` +
                      `ℹ️ Google AI hozircha ishlamayapti. ` +
                      `Bot to'liq versiyasi yaqinda ishga tushadi.`;
        }
        
        // Javobni yuborish
        await bot.sendMessage(chatId, response);
        
        console.log(`[${userId}] Javob yuborildi`);
        
    } catch (error) {
        console.error(`[${userId}] Xato:`, error.message);
        
        // Xato turiga qarab javob
        let errorMessage;
        
        if (error.message.includes('GoogleGenerativeAI') || 
            error.message.includes('404') || 
            error.message.includes('API')) {
            
            errorMessage = `🤖 AI hozircha mavjud emas\n\n` +
                          `Sabab: Google AI serverida muammo\n` +
                          `Yechim: /clear bilan yangilang va qayta urinib koʻring`;
            
        } else if (error.message.includes('409') || 
                   error.message.includes('Conflict')) {
            
            errorMessage = `⚠️ Bot allaqachon ishlayapti\n\n` +
                          `Iltimos, biroz kutib qayta urinib koʻring`;
            
        } else {
            errorMessage = `❌ Texnik xatolik\n\n` +
                          `Sabab: ${error.message.substring(0, 100)}\n` +
                          `Yechim: /clear bilan yangilang`;
        }
        
        await bot.sendMessage(chatId, errorMessage);
    }
});

// ==================== 7. BOSHQA XABAR TURLARI ====================

bot.on(['sticker', 'photo', 'voice', 'video', 'document'], (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        `📁 Kechirasiz, men faqat matnli xabarlarni qayta ishlay olaman.\n` +
        `Iltimos, savolingizni matn shaklida yozing.`
    );
});

// ==================== 8. BOT ISHGA TUSHDI ====================

console.log('='.repeat(60));
console.log('🤖 TELEGRAM AI BOT ISHGA TUSHMOQDA...');
console.log('='.repeat(60));
console.log(`📱 Telegram Token: ${TELEGRAM_TOKEN ? '✅ MAVJUD' : '❌ YOQ'}`);
console.log(`🤖 Google AI: ${googleAIEnabled ? '✅ FAOL' : '⚠️ TEST REJIMI'}`);
console.log(`🌐 Server Port: ${PORT}`);
console.log('='.repeat(60));
console.log('✅ Bot faol. Xabarlarni kutmoqda...\n');
console.log('ℹ️  UptimeRobot uchun: http://localhost:' + PORT + '/health');
console.log('ℹ️  Asosiy sahifa: http://localhost:' + PORT);
console.log('='.repeat(60));