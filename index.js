const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// ==================== KONFIGURATSIYA ====================
const TELEGRAM_TOKEN = "7603962484:AAHvqlF8ktgilUKQD6t3wfRa_4Ikfo4PWuk";
const GOOGLE_AI_KEY = "AIzaSyCPw3HdwBsmw6bKHuLrvja6KCbfaeGmEbE";

if (!TELEGRAM_TOKEN || !GOOGLE_AI_KEY) {
    console.error('❌ XATO: .env faylda tokenlar yoʻq!');
    process.exit(1);
}

// Telegram botni yaratish (polling rejimi)
const bot = new TelegramBot(TELEGRAM_TOKEN, { 
    polling: true,
    filepath: false
});

// Google AI ni yaratish
const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
// O'ZGARTIRISHDAN KEYIN
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// ==================== YORDAMCHI FUNKTSIYALAR ====================

// Telegram uchun matnni tozalash (xatoliksiz yuborish uchun)
function cleanTelegramText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Telegramda muammo chiqaradigan belgilarni escape qilish
    const dangerousChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    let cleaned = text;
    
    // Har bir xavfli belgini escape qilish
    dangerousChars.forEach(char => {
        cleaned = cleaned.split(char).join('\\' + char);
    });
    
    // Telegram xabar chegarasi (4096 belgi)
    const MAX_LENGTH = 4096;
    if (cleaned.length > MAX_LENGTH) {
        cleaned = cleaned.substring(0, MAX_LENGTH - 100) + '\n\n... (javob juda uzun, qisqartirildi)';
    }
    
    return cleaned;
}

// Uzoq javoblarni bo'laklarga bo'lish
function splitMessage(text, maxLength = 4000) {
    if (text.length <= maxLength) return [text];
    
    const parts = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentPart = '';
    
    for (const sentence of sentences) {
        if ((currentPart + sentence).length > maxLength && currentPart) {
            parts.push(currentPart.trim());
            currentPart = sentence;
        } else {
            currentPart += ' ' + sentence;
        }
    }
    
    if (currentPart.trim()) {
        parts.push(currentPart.trim());
    }
    
    return parts;
}

// ==================== USERLAR CHAT TARIXI ====================
const userSessions = new Map();

function getUserSession(chatId) {
    if (!userSessions.has(chatId)) {
        userSessions.set(chatId, {
            history: [],
            lastActive: Date.now()
        });
    }
    return userSessions.get(chatId);
}

function clearUserSession(chatId) {
    userSessions.delete(chatId);
}

// 1 soat davomida faol bo'lmagan sessiyalarni tozalash
setInterval(() => {
    const now = Date.now();
    const HOUR = 60 * 60 * 1000;
    
    for (const [chatId, session] of userSessions.entries()) {
        if (now - session.lastActive > HOUR) {
            userSessions.delete(chatId);
        }
    }
}, 30 * 60 * 1000); // Har 30 daqiqada tekshirish

// ==================== TELEGRAM KOMANDALARI ====================

// /start - boshlash komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Foydalanuvchi';
    
    const welcomeMessage = `👋 Assalomu alaykum, *${firstName}*!\n\n` +
                          `🤖 Men *Google Gemini AI* bilan ishlaydigan yordamchi botman.\n\n` +
                          `📝 Menga istalgan savolingizni yozing:\n` +
                          `• Dasturlash haqida\n` +
                          `• Matematik masalalar\n` +
                          `• Tarjima qilish\n` +
                          `• Yordam kerak bo'lgan har qanday mavzu\n\n` +
                          `⚙️ *Foydali komandalar:*\n` +
                          `/help - Yordam olish\n` +
                          `/clear - Chat tarixini tozalash\n` +
                          `/info - Bot haqida ma'lumot`;
    
    bot.sendMessage(chatId, cleanTelegramText(welcomeMessage));
});

// /help - yordam komandasi
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `🆘 *YORDAM* 🆘\n\n` +
                       `📖 *Qanday foydalanish:*\n` +
                       `1. Menga oddiygina savol yozing\n` +
                       `2. Men Google Gemini AI orqali javob beraman\n` +
                       `3. Suhbat davom etishi uchun ketma-ket savol bering\n\n` +
                       `🔧 *Mavjud komandalar:*\n` +
                       `• /start - Botni qayta ishga tushirish\n` +
                       `• /clear - Chat tarixini tozalash (kontekstni yo'q qilish)\n` +
                       `• /info - Bot haqida ma'lumot\n` +
                       `• /help - Ushbu yordam xabarini ko'rish\n\n` +
                       `⚠️ *Eslatmalar:*\n` +
                       `• Savollaringiz aniq va tushunarli bo'lsin\n` +
                       `• Uzoq javoblar bir necha qismga bo'linishi mumkin\n` +
                       `• Agar javob to'liq bo'lmasa, "davom eting" deb yozing`;
    
    bot.sendMessage(chatId, cleanTelegramText(helpMessage));
});

// /clear - chat tarixini tozalash
bot.onText(/\/clear/, (msg) => {
    const chatId = msg.chat.id;
    clearUserSession(chatId);
    bot.sendMessage(chatId, '✅ *Chat tarixi tozalandi!*\nYangi suhbat boshlaymiz.');
});

// /info - bot haqida ma'lumot
bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id;
    
    const infoMessage = `🤖 *BOT HAQIDA MA\'LUMOT*\n\n` +
                       `📍 *Platforma:* Google Gemini AI\n` +
                       `🚀 *Model:* Gemini 1.5 Flash\n` +
                       `💬 *Funksiya:* AI yordamchisi\n` +
                       `📊 *Foydalanuvchilar:* ${userSessions.size}\n\n` +
                       `⚡ *Texnologiyalar:*\n` +
                       `• Node.js Telegram Bot API\n` +
                       `• Google Generative AI\n` +
                       `• JavaScript ES6+\n\n` +
                       `📞 *Qo'llab-quvvatlash:* @ (o'zingizning username yoki kanalingiz)`;
    
    bot.sendMessage(chatId, cleanTelegramText(infoMessage));
});

// ==================== ASOSIY XABAR QAYTA ISHLASH ====================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;
    
    // Agar xabar bo'sh yoki komanda bo'lsa, o'tkazib yuborish
    if (!messageText || messageText.startsWith('/')) {
        return;
    }
    
    try {
        // "Yozmoqda..." statusini ko'rsatish
        await bot.sendChatAction(chatId, 'typing');
        
        // Foydalanuvchi sessiyasini yangilash
        const session = getUserSession(chatId);
        session.lastActive = Date.now();
        
        // Google AI ga so'rov yuborish
        console.log(`[${chatId}] So'rov: ${messageText.substring(0, 50)}...`);
        
        const chat = model.startChat({
            history: session.history,
            generationConfig: {
                maxOutputTokens: 1500,
                temperature: 0.7,
            },
        });
        
        const result = await chat.sendMessage(messageText);
        const responseText = result.response.text();
        
        // Sessiya tarixini yangilash (cheklangan hajmda saqlash)
        session.history.push({
            role: "user",
            parts: [{ text: messageText }]
        });
        session.history.push({
            role: "model",
            parts: [{ text: responseText }]
        });
        
        // Tarixni cheklash (oxirgi 6 ta xabar)
        if (session.history.length > 6) {
            session.history = session.history.slice(-6);
        }
        
        // Javobni tozalash va yuborish
        const cleanedResponse = cleanTelegramText(responseText);
        const messageParts = splitMessage(cleanedResponse);
        
        // Har bir qismni alohida yuborish
        for (let i = 0; i < messageParts.length; i++) {
            if (i === 0) {
                await bot.sendMessage(chatId, messageParts[i]);
            } else {
                // Keyingi qismlarni biroz kechiktirib yuborish
                await new Promise(resolve => setTimeout(resolve, 300));
                await bot.sendMessage(chatId, `(${i + 1}/${messageParts.length})\n${messageParts[i]}`);
            }
        }
        
        console.log(`[${chatId}] Javob yuborildi (${responseText.length} belgi)`);
        
    } catch (error) {
        console.error(`[${chatId}] XATOLIK:`, error.message);
        
        // Foydalanuvchiga tushunarli xato xabarini yuborish
        let errorMessage = `❌ *Kechirasiz, xatolik yuz berdi!*\n\n`;
        
        if (error.message.includes('API key') || error.message.includes('429')) {
            errorMessage += `🔑 *Sabab:* API kaliti bilan muammo\n` +
                           `✅ *Yechim:* Iltimos, biroz kutib, qayta urinib ko'ring`;
        } else if (error.message.includes('safety')) {
            errorMessage += `🛡️ *Sabab:* Xavfsizlik siyosatiga zid so'rov\n` +
                           `✅ *Yechim:* Boshqa shaklda so'rov bering`;
        } else {
            errorMessage += `⚙️ *Sabab:* Ichki server xatosi\n` +
                           `✅ *Yechim:* /clear bilan chatni tozalang va qayta urinib ko'ring`;
        }
        
        bot.sendMessage(chatId, cleanTelegramText(errorMessage));
    }
});

// ==================== BOSHQA TURLI XABARLAR ====================

// Agar foydalanuvchi sticker, rasm yoki ovozli xabar yuborsa
bot.on(['sticker', 'photo', 'voice', 'video', 'document'], (msg) => {
    const chatId = msg.chat.id;
    const response = `📁 *Kechirasiz, men faqat matnli xabarlarni qayta ishlay olaman!*\n\n` +
                    `Iltimos, savolingizni matn shaklida yozing.`;
    bot.sendMessage(chatId, cleanTelegramText(response));
});

// ==================== BOTNI ISHGA TUSHIRISH ====================

console.log('='.repeat(50));
console.log('🤖 TELEGRAM AI BOT ISHGA TUSHMOQDA...');
console.log('='.repeat(50));
console.log(`📱 Bot foydalanuvchilari: ${userSessions.size}`);
console.log(`🚀 Platforma: Google Gemini AI`);
console.log(`✅ Holat: FAOL`);
console.log('='.repeat(50));
console.log('⏳ Xabarlarni kutmoqda...\n');