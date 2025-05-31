const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const express = require('express');

// Dotenv'i ilk önce yükle
require('dotenv').config();

console.log('🤖 Bot başlatılıyor...');

// Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Bot token kontrolü
const token = process.env.BOT_TOKEN;
if (!token) {
    console.error('❌ BOT_TOKEN bulunamadı! .env dosyasını kontrol edin.');
    console.error('💡 .env dosyasında BOT_TOKEN=your_token_here şeklinde ekleyin.');
    process.exit(1);
}

// Bot oluştur
const bot = new TelegramBot(token, { 
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

// Ana kanal ID'si
const MAIN_CHANNEL_ID = process.env.MAIN_CHANNEL_ID;

console.log('📡 Token:', token ? '✅ Mevcut' : '❌ Eksik');
console.log('📢 Ana Kanal ID:', MAIN_CHANNEL_ID || '❌ Tanımlanmamış');

// Kripto etkinlikleri
const cryptoEvents = [
    "⭐ Devam eden KCEX TR Etkinlikleri 👇",
    "🎯 TRY Yatırma Şöleni ile 550 TRY Kazanma Fırsatı! 🚀",
    "☘️ %150 APR ile MNT Kazancınızı Katlayın 🔥",
    "⭐ 11.000 TL'ye Varan Ödüller Seni Bekliyor! 😍",
    "🔹 Bir retweet ile 30 $CORN! (İlk 800 katılımcı)",
    "⚔️ 775.000 TL Ödül Havuzuyla Alım/Satım Yarışması! 🚀",
    "💎 Tiğört ve Airdroplarla Telegram Davet Etkinliğini Kaçırmayın",
    "🚀 100 Milyon TL Değerinde Milyonlerin Yolu Yeniden Sizlerle! 🔥",
    "😊 Altın Yorum ile 750 TRY'ye Kadar Kazanma Şansı Yakalayın! 🧡"
];

// Grup listesi
const groupList = `**KCEX Telegram Toplulukları ve Kanalları 📢**

**KCEX P2P Grubu:** https://t.me/
**KCEX NFT Grubu:** https://t.me/
**KCEX API Grubu:** https://t.me/
**KCEX API Kanal:** https://t.me/
**KCEX Kripto Akış:** https://t.me/
**KCEX Global Grubu:** https://t.me/

🇬🇧 English    🇳🇬 Nigeria
🌍 Africa       🇵🇰 Pakistan  
🇸🇦 Arabic      🇵🇱 Polish
🇧🇩 Bengali     🇵🇹 Português
🇰🇭 Cambodian   🇷🇴 Romanian
🇨🇳 Chinese     🇷🇺 Russian
🇵🇭 Filipino    🇿🇦 South Africa
🇫🇷 French      🇪🇸 Spanish
🇮🇱 Hebrew      🇫🇮 Suomi
🇮🇳 Indian      🇸🇪 Svenska
🇮🇩 Indonesian  🇹🇭 Thai
🇮🇹 Italian     🇹🇷 Turkish
🇰🇿 Kazakhstan  🇺🇦 Ukrainian
🇲🇾 Malaysia    🇻🇳 Vietnamese`;

// Güvenlik uyarısı
const securityWarning = `**🛡️ KCEX TR Üyeleri İçin Güvenlik Uyarıları** ⚠️

⚠️ **Önemli Duyuru** ⚠️

**Bir KCEX personeli:**
🔴 **ASLA SİZE İLK ÖZEL MESAJ ATMAZ.**
🔴 **Herhangi bir sorunuzu çözmek için kripto varlıklarınızı transfer etmenizi veya cüzdan anahtarlarınızı istemez.**
🔴 **Herhangi bir projeye/şirkete yatırım yapmanızı istemez, tanıtmaz veya davet etmez.**

Benzer kullanıcı adlarıyla yönetici hesaplarını taklit eden dolandırıcılara karşı dikkatli olun. Şüpheli durumlarda Telegram üzerinden bildirip engelleyin.

💡 **İpucu:** Resmi KCEX hesaplarının mavi tik işareti vardır.`;

// Error handling
bot.on('polling_error', (error) => {
    console.error('❌ Polling hatası:', error.code, error.message);
});

bot.on('error', (error) => {
    console.error('❌ Bot hatası:', error);
});

// Debug - Gelen mesajları logla
bot.on('message', (msg) => {
    const chatType = msg.chat.type;
    const chatId = msg.chat.id;
    const chatTitle = msg.chat.title || msg.chat.first_name || 'Bilinmeyen';
    
    console.log(`💬 Mesaj geldi: "${msg.text}" | ${chatType} | ${chatTitle} (${chatId})`);
    
    // Grup ID'lerini otomatik logla
    if (chatType === 'group' || chatType === 'supergroup') {
        console.log(`📢 GRUP ID'Sİ: ${chatId} | Grup Adı: ${chatTitle}`);
    }
});

// Test komutu - debugging için
bot.onText(/\/test/, (msg) => {
    const chatId = msg.chat.id;
    console.log('🧪 Test komutu çalıştırıldı');
    console.log('Chat ID:', chatId);
    console.log('Chat Type:', msg.chat.type);
    
    bot.sendMessage(chatId, '✅ Bot çalışıyor ve mesaj alabiliyor!', {
        reply_to_message_id: msg.message_id
    }).then(() => {
        console.log('✅ Test mesajı gönderildi');
    }).catch(err => {
        console.error('❌ Test mesajı gönderilemedi:', err.message);
    });
});

// YENİ: Özel etkinlik test komutu
bot.onText(/\/specialtest/, (msg) => {
    const chatId = msg.chat.id;
    console.log('🧪 Özel etkinlik test komutu çalıştırıldı');
    
    // Önce kullanıcıya bilgi ver
    bot.sendMessage(chatId, '🧪 Özel etkinlik mesajı test ediliyor... Ana kanala gönderiliyor!', {
        reply_to_message_id: msg.message_id
    }).then(() => {
        console.log('✅ Test bilgi mesajı gönderildi');
        // Ardından özel etkinlik mesajını gönder
        sendSpecialEvent();
    }).catch(err => {
        console.error('❌ Test bilgi mesajı gönderilemedi:', err.message);
    });
});

// YENİ: Rastgele etkinlik test komutu
bot.onText(/\/eventtest/, (msg) => {
    const chatId = msg.chat.id;
    console.log('🧪 Rastgele etkinlik test komutu çalıştırıldı');
    
    // Önce kullanıcıya bilgi ver
    bot.sendMessage(chatId, '🧪 Rastgele etkinlik mesajı test ediliyor... Ana kanala gönderiliyor!', {
        reply_to_message_id: msg.message_id
    }).then(() => {
        console.log('✅ Test bilgi mesajı gönderildi');
        // Ardından rastgele etkinlik mesajını gönder
        sendRandomEvent();
    }).catch(err => {
        console.error('❌ Test bilgi mesajı gönderilemedi:', err.message);
    });
});

// Start komutu - güncellenmiş
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = `🎉 **Kripto Etkinlik Botuna Hoş Geldiniz!** 🎉

🤖 **Mevcut Komutlar:**
• /gruplar - Telegram gruplarımızı görüntüle
• /güvenlik - Güvenlik uyarılarını görüntüle
• /test - Bot test komutu
• /specialtest - Özel etkinlik mesajını test et
• /eventtest - Rastgele etkinlik mesajını test et
• /help - Yardım menüsü

🔔 **Bot otomatik olarak etkinlikleri her saat paylaşır.**

Bot ID: \`${chatId}\``;

    bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'Markdown'
    }).catch(err => {
        console.error('❌ Hoş geldin mesajı gönderilemedi:', err.message);
    });
});

// Gruplar komutu
bot.onText(/\/gruplar/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, groupList, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [{ text: '📢 Ana Kanalımız', url: 'https://t.me/your_main_channel' }],
                [{ text: '💬 Destek Grubu', url: 'https://t.me/your_support_group' }]
            ]
        }
    }).catch(err => {
        console.error('❌ Gruplar mesajı gönderilemedi:', err.message);
    });
});

// Güvenlik komutu
bot.onText(/\/güvenlik|\/guvenlik/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, securityWarning, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛡️ KCEX Doğruluk Kontrolü', url: 'https://www.bybit.com/tr-TR/help-center/' }],
                [{ text: '📢 Resmi Kanal', url: 'https://t.me/your_official_channel' }]
            ]
        }
    }).catch(err => {
        console.error('❌ Güvenlik mesajı gönderilemedi:', err.message);
    });
});

// Help komutu - güncellenmiş
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;

    const helpMessage = `🤖 **Bot Komutları:**

• /gruplar - Telegram gruplarımızı listele
• /güvenlik - Güvenlik uyarılarını göster  
• /test - Bot çalışıyor mu test et
• /specialtest - Özel etkinlik mesajını test et
• /eventtest - Rastgele etkinlik mesajını test et
• /help - Bu yardım mesajını göster

🔔 **Bot otomatik olarak:**
• Her saat etkinlik duyurusu yapar
• Günde 3 kez özel etkinlik mesajı gönderir

📊 **Bot Durumu:**
• Aktif: ✅
• Son Güncelleme: ${new Date().toLocaleString('tr-TR')}`;

    bot.sendMessage(chatId, helpMessage, { 
        parse_mode: 'Markdown' 
    }).catch(err => {
        console.error('❌ Yardım mesajı gönderilemedi:', err.message);
    });
});

// Rastgele etkinlik gönderme
function sendRandomEvent() {
    if (!MAIN_CHANNEL_ID) {
        console.error('❌ MAIN_CHANNEL_ID tanımlanmamış! Etkinlik gönderilemedi.');
        return;
    }

    const randomEvent = cryptoEvents[Math.floor(Math.random() * cryptoEvents.length)];
    console.log('📤 Etkinlik gönderiliyor:', randomEvent.substring(0, 50) + '...');

    bot.sendMessage(MAIN_CHANNEL_ID, randomEvent, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🎯 Etkinliğe Katıl', url: 'https://www.bybit.com/tr-TR/' }],
                [{ text: '📢 Kanalımız', url: 'https://t.me/your_main_channel' }]
            ]
        }
    }).then(() => {
        console.log('✅ Etkinlik başarıyla gönderildi');
    }).catch(err => {
        console.error('❌ Etkinlik gönderilemedi:', err.message);
        console.error('💡 Kanal ID doğru mu? Bot kanala eklendi mi? Yönetici yetkisi var mı?');
    });
}

// Özel etkinlik mesajı
function sendSpecialEvent() {
    if (!MAIN_CHANNEL_ID) {
        console.error('❌ MAIN_CHANNEL_ID tanımlanmamış! Özel etkinlik gönderilemedi.');
        return;
    }

    const specialEventMessage = `🎯 **Türkiye Kullanıcılarımıza Özel Etkinliklerimizi İncelediniz mi?**

⭐ Devam eden KCEX TR Etkinlikleri 👇
🎯 TRY Yatırma Şöleni ile 550 TRY Kazanma Fırsatı! 🚀
☘️ %150 APR ile MNT Kazancınızı Katlayın 🔥
⭐ 11.000 TL'ye Varan Ödüller Seni Bekliyor! 😍
🔹 Bir retweet ile 30 $CORN! (İlk 800 katılımcı)
⚔️ 775.000 TL Ödül Havuzuyla Alım/Satım Yarışması! 🚀
💎 Tiğört ve Airdroplarla Telegram Davet Etkinliğini Kaçırmayın
🚀 100 Milyon TL Değerinde Milyonlerin Yolu Yeniden Sizlerle! 🔥
😊 Altın Yorum ile 750 TRY'ye Kadar Kazanma Şansı Yakalayın! 🧡

🔥 **Hemen katılın, fırsatları kaçırmayın!**`;

    console.log('📤 Özel etkinlik mesajı gönderiliyor...');

    bot.sendMessage(MAIN_CHANNEL_ID, specialEventMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '🎯 Tüm Etkinliklere Katıl', url: 'https://www.bybit.com/tr-TR/' }]
            ]
        }
    }).then(() => {
        console.log('✅ Özel etkinlik mesajı başarıyla gönderildi');
    }).catch(err => {
        console.error('❌ Özel etkinlik gönderilemedi:', err.message);
    });
}

// Cron jobs
console.log('⏰ Cron joblar ayarlaniyor...');

// Her saat etkinlik gönder (0. dakikada)
cron.schedule('0 * * * *', () => {
    console.log('⏰ Saatlik etkinlik zamani:', new Date().toLocaleString('tr-TR'));
    sendRandomEvent();
}, {
    timezone: "Europe/Istanbul"
});

// Günde 3 kez özel etkinlik (09:00, 15:00, 21:00 TR saati)
cron.schedule('0 9,15,21 * * *', () => {
    console.log('⏰ Ozel etkinlik zamani:', new Date().toLocaleString('tr-TR'));
    sendSpecialEvent();
}, {
    timezone: "Europe/Istanbul"
});

// Express health check
app.get('/', (req, res) => {
    const status = {
        status: 'Bot çalışıyor! 🤖',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        bot_username: bot.options?.username || 'Bilinmiyor'
    };
    res.json(status);
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Express server başlat
app.listen(PORT, () => {
    console.log(`🌐 Express sunucu ${PORT} portunda çalışıyor`);
    console.log(`🔗 Health check: http://localhost:${PORT}`);
});

// Bot başarıyla başlatıldığında
bot.getMe().then((botInfo) => {
    console.log('✅ Bot başarıyla başlatıldı!');
    console.log(`🤖 Bot adı: ${botInfo.first_name}`);
    console.log(`👤 Kullanıcı adı: @${botInfo.username}`);
    console.log(`🆔 Bot ID: ${botInfo.id}`);
    console.log('🚀 Bot hazır ve komutları bekliyor...');
}).catch(err => {
    console.error('❌ Bot başlatılamadı:', err.message);
    console.error('💡 Token doğru mu? İnternet bağlantısı var mı?');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Bot kapatiliyor...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Bot sonlandiriliyor...');
    bot.stopPolling();
    process.exit(0);
});