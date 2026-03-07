# 🔐 Crypto Wallet - محفظة العملات المشفرة

محفظة عملات مشفرة كاملة الميزات مع دعم ETH و USDC على عدة شبكات blockchain.

## ✨ الميزات

### 🎯 إدارة المحافظ
- ✅ إنشاء محفظة جديدة مع عبارة سرية (12 كلمة)
- ✅ استيراد محفظة عبر العبارة السرية
- ✅ استيراد محفظة عبر المفتاح الخاص
- ✅ حفظ آمن مع تشفير

### 🌐 دعم Blockchain
- ✅ **Tenderly Virtual Base** - للاختبار والتطوير
- ✅ **Base Mainnet** - شبكة Base الرئيسية  
- ✅ **Ethereum Mainnet** - شبكة Ethereum الرئيسية
- ✅ عرض رقم Block الحالي
- ✅ روابط Block Explorer

### 💰 العملات المدعومة
- ✅ **ETH** - إرسال واستقبال
- ✅ **USDC** - إرسال واستقبال (ERC-20)
  - Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
  - Ethereum: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

### 🔄 المعاملات
- ✅ إرسال ETH (معاملات حقيقية)
- ✅ إرسال USDC (ERC-20 tokens)
- ✅ تأكيد المعاملات على البلوكشين
- ✅ عرض Transaction Hash
- ✅ Gas estimation

### 📱 ميزات إضافية
- ✅ QR Code للإرسال/الاستقبال
- ✅ نسخ العنوان
- ✅ تحديث فوري للأرصدة
- ✅ واجهة عربية جميلة

## 🚀 التقنيات المستخدمة

- **Frontend**: React Native + Expo
- **Blockchain**: ethers.js v6
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Security**: expo-secure-store

## 📦 التثبيت

```bash
# Frontend
cd frontend
yarn install
yarn start

# Backend  
cd backend
pip install -r requirements.txt
python server.py
```

## 🔑 البيئة المطلوبة

أنشئ ملف `.env` في مجلد `frontend`:

```env
EXPO_PUBLIC_TENDERLY_VIRTUAL_BASE_RPC=https://virtual.base.rpc.tenderly.co/YOUR_KEY
EXPO_PUBLIC_ALCHEMY_ETH_KEY=your_alchemy_key
EXPO_PUBLIC_ALCHEMY_BASE_KEY=your_alchemy_key
```

## 🎨 الاستخدام

1. افتح التطبيق
2. اختر "إنشاء محفظة جديدة" أو "استيراد محفظة"
3. احفظ العبارة السرية في مكان آمن
4. شاهد أرصدتك من ETH و USDC
5. أرسل واستقبل العملات

## 🔒 الأمان

- جميع المفاتيح الخاصة محفوظة محلياً على جهازك
- تشفير كامل باستخدام expo-secure-store
- لا يتم إرسال المفاتيح إلى أي سيرفر
- جميع المعاملات مباشرة على البلوكشين

## 📱 التطبيق المباشر

[https://encrypted-purse.preview.emergentagent.com](https://encrypted-purse.preview.emergentagent.com)

## 📄 الترخيص

MIT License

## 👨‍💻 المطور

Built with ❤️ by Emergent Agent
