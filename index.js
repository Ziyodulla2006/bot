// ==================== 1. PAKETLAR ====================
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
require('dotenv').config();

// ==================== 2. WEB SERVER ====================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
    res.json({ status: 'ok', bot: 'active' });
});

app.get('/', (req, res) => {
    res.send('🤖 Bot ishlayapti!');
});

app.listen(PORT, () => {
    console.log(`🌐 Server ${PORT}-portda`);
});

// ==================== 3. TELEGRAM BOT ====================
const TELEGRAM_TOKEN = "7603962484:AAHvqlF8ktgilUKQD6t3wfRa_4Ikfo4PWuk";

if (!TELEGRAM_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN yoʻq!');
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { 
    polling: true,
    filepath: false
});

console.log('✅ Bot ishga tushdi. Token mavjud.');

// ==================== 4. KOMANDALAR ====================
bot.onText(/\/start/, (msg) => {
    const firstName = msg.from?.first_name || 'Do\'stim';
    bot.sendMessage(msg.chat.id, 
        `Salom ${firstName}! 👋\n\n` +
        `🤖 Men test rejimidagi yordamchi botman.\n` +
        `Hozircha Google AI bilan muammo bor.\n\n` +
        `Savolingizni yozing, men sizga yordam berishga harakat qilaman!`
    );
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `🆘 YORDAM\n\n` +
        `1. Menga savol yozing\n` +
        `2. Men foydali javob berishga harakat qilaman\n` +
        `3. Agar javob to'g'ri bo'lmasa, qayta so'rang\n\n` +
        `ℹ️ Hozir Google AI ishlamayapti, shuning uchun javoblar oddiy bo'ladi.`
    );
});

bot.onText(/\/info/, (msg) => {
    bot.sendMessage(msg.chat.id,
        `📊 BOT MA'LUMOTI\n\n` +
        `🤖 Nomi: Test Bot\n` +
        `⚡ Holati: Faol ✅\n` +
        `🔧 Versiya: 1.0\n` +
        `👨‍💻 Yaratuvchi: Ziyodulla\n` +
        `🕐 Server: Render.com\n\n` +
        `⚠️ Google AI hozircha ishlamayapti`
    );
});

// ==================== 5. ASOSIY XABAR QAYTA ISHLASH ====================
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from?.id;
    
    // Faqat haqiqiy xabarlarni qayta ishlash
    if (!userId || !text || text.startsWith('/')) return;
    if (msg.from?.is_bot) return;
    
    console.log(`[${userId}] "${text}"`);
    
    try {
        await bot.sendChatAction(chatId, 'typing');
        
        // 1 soniya kutish (yozayotgandek ko'rinish)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // TEST JAVOBLARI
        let response;
        
        if (text.toLowerCase().includes('salom') || text.toLowerCase().includes('hello')) {
            response = `Salom! 😊 Men yordamchi botman. Savolingiz bor mi?`;
        
        } else if (text.toLowerCase().includes('ism') || text.toLowerCase().includes('name')) {
            response = `Mening ismim AI Bot. Sizning ismingiz nima?`;
        
        } else if (text.toLowerCase().includes('dasturlash') || text.toLowerCase().includes('programming')) {
            response = `Dasturlash uchun quyidagi tillarni o'rganishingiz mumkin:\n` +
                      `• Python - AI va ma'lumotlar tahlili uchun\n` +
                      `• JavaScript - veb-dasturlash uchun\n` +
                      `• Java - Android ilovalar uchun\n\n` +
                      `Qaysi til haqida ko'proq ma'lumot kerak?`;
        
        } else if (text.toLowerCase().includes('yosh') || text.toLowerCase().includes('age')) {
            response = `Men sun'iy intellekt botiman, mening aniq "yoshim" yo'q! 😄`;
        
        } else if (text.toLowerCase().includes('qanaqas') || text.toLowerCase().includes('how are')) {
            response = `Rahmat, yaxshiman! Sizchi? 😊`;
        
        } else if (text.includes('?')) {
            response = `Yaxshi savol! 🤔\n` +
                      `Hozir Google AI ishlamayapti, shuning uchun men to'liq javob bera olmayman.\n` +
                      `Lekin siz savolingizni batafsilroq yozsangiz, yordam berishga harakat qilaman.`;
        
        } else {
            response = `"${text}" - qiziq savol! 🤖\n\n` +
                      `Men hozir test rejimidaman. Google AI bilan muammo bor.\n` +
                      `Tez orada to'liq versiyada ishlay boshlayman!\n\n` +
                      `/help - yordam olish`;
        }
        
        await bot.sendMessage(chatId, response);
        
    } catch (error) {
        console.error('Xato:', error.message);
        await bot.sendMessage(chatId, 
            `😅 Kechirasiz, xatolik yuz berdi.\n` +
            `/start ni bosing yoki qayta urinib ko'ring.`
        );
    }
});

// ==================== 6. BOSHQA XABARLAR ====================
bot.on(['sticker', 'photo'], (msg) => {
    bot.sendMessage(msg.chat.id, '👍 Kutilmagan xabar! Matnli savol yozing.');
});

console.log('🤖 Bot tayyor! Xabarlarni kutmoqda...');