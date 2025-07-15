const products = [
  {
    id: "office365lifetime",
    name: {
      en: "Office 365 Lifetime Genuine Account (Up to 5 Devices)",
      si: "Office 365 ජීවිත කාලීන ගිණුම (ඉහළම උපාංග 5ක්)",
      ta: "Office 365 வாழ்நாள் கணக்கு (அதிகபட்சம் 5 கருவிகள்)",
      ru: "Office 365 пожизненная лицензия (до 5 устройств)",
      zh: "Office 365 永久正版账号（最多5台设备）",
      es: "Office 365 Cuenta genuina de por vida (Hasta 5 dispositivos)"
    },
    price: { LKR: 7700, USD: 23, EUR: 21, GBP: 18, INR: 1900 },
    image: "https://static-01.daraz.lk/p/ae3f76f0c47cf3b1c4099c857784b1de.jpg",
    delivery: {
      en: "Instant Delivery",
      si: "ක්ෂණික බෙදාහැරීම",
      ta: "உடனடி விநியோகம்",
      ru: "Мгновенная доставка",
      zh: "即时发货",
      es: "Entrega instantánea"
    },
    desc: {
      en: "Lifetime activation for up to 5 devices. Full Microsoft Office 365 suite including Word, Excel, PowerPoint and more. No monthly/annual fees. Instant delivery to your email after payment.",
      si: "ඉහළම උපාංග 5ක් සඳහා ජීවිත කාලීන සක්‍රීය කිරීම. Word, Excel, PowerPoint ඇතුළු සම්පූර්ණ Office 365 එකතුව. මාසික හෝ වාර්ෂික ගාස්තු නොමැත. ගෙවීමෙන් පසු ඔබේ ඊමේල් වෙත ක්ෂණික බෙදාහැරීම.",
      ta: "5 கருவிகள் வரை வாழ்நாள் செயல்படுத்துதல். Word, Excel, PowerPoint உட்பட முழு Office 365 தொகுப்பு. மாத/வருட கட்டணம் இல்லை. பணம் செலுத்தியவுடன் உங்கள் மின்னஞ்சலில் உடனடி விநியோகம்.",
      ru: "Пожизненная активация на 5 устройств. Полный пакет Microsoft Office 365: Word, Excel, PowerPoint и др. Без абонплаты. Мгновенная доставка на ваш e-mail после оплаты.",
      zh: "最多5台设备终身激活。包含Word、Excel、PowerPoint等完整Office 365套装。无月费/年费。付款后立即发送至您的邮箱。",
      es: "Activación de por vida para hasta 5 dispositivos. Suite completa de Microsoft Office 365, incluye Word, Excel, PowerPoint y más. Sin tarifas mensuales/anuales. Entrega instantánea por correo tras el pago."
    }
  },
  {
    id: "win10pro",
    name: {
      en: "Windows 10 Pro Key",
      si: "Windows 10 Pro යතුර",
      ta: "Windows 10 Pro விசை",
      ru: "Ключ Windows 10 Pro",
      zh: "Windows 10 Pro 激活密钥",
      es: "Clave Windows 10 Pro"
    },
    price: { LKR: 3000, USD: 9, EUR: 8, GBP: 7, INR: 700 },
    image: "https://img.drz.lazcdn.com/static/lk/p/6089ff29fc089609833e9df6008ed942.png_400x400q75.avif",
    delivery: {
      en: "Instant Delivery",
      si: "ක්ෂණික බෙදාහැරීම",
      ta: "உடனடி விநியோகம்",
      ru: "Мгновенная доставка",
      zh: "即时发货",
      es: "Entrega instantánea"
    },
    desc: {
      en: "Genuine Windows 10 Pro lifetime license key. For 1 PC. Instant email delivery. Activate and use worldwide.",
      si: "ස්ථාවර Windows 10 Pro යතුරක්. එක් පරිගණකයක් සඳහා. ක්ෂණික ඊමේල් බෙදාහැරීම. ලොවපුරා සක්‍රිය කර භාවිතා කරන්න.",
      ta: "உண்மை Windows 10 Pro வாழ்நாள் விசை. 1 கணினிக்கானது. உடனடி மின்னஞ்சல் விநியோகம். உலகம் முழுவதும் பயன்படுத்தலாம்.",
      ru: "Настоящий ключ Windows 10 Pro навсегда. Для 1 ПК. Мгновенная e-mail доставка. Для активации по всему миру.",
      zh: "正版 Windows 10 Pro 终身密钥。1台电脑适用。邮箱即时发货。全球通用。",
      es: "Licencia genuina Windows 10 Pro de por vida. Para 1 PC. Entrega instantánea por correo. Usable en todo el mundo."
    }
  },
  {
    id: "win11pro",
    name: {
      en: "Windows 11 Pro Key",
      si: "Windows 11 Pro යතුර",
      ta: "Windows 11 Pro விசை",
      ru: "Ключ Windows 11 Pro",
      zh: "Windows 11 Pro 激活密钥",
      es: "Clave Windows 11 Pro"
    },
    price: { LKR: 3700, USD: 11, EUR: 10, GBP: 8, INR: 860 },
    image: "https://img.drz.lazcdn.com/static/lk/p/4ac77c5340b852dcfe5d0f0ba66fb1ed.png_400x400q75.avif",
    delivery: {
      en: "Instant Delivery",
      si: "ක්ෂණික බෙදාහැරීම",
      ta: "உடனடி விநியோகம்",
      ru: "Мгновенная доставка",
      zh: "即时发货",
      es: "Entrega instantánea"
    },
    desc: {
      en: "Genuine Windows 11 Pro lifetime license key. For 1 PC. Instant email delivery. Use worldwide.",
      si: "ස්ථාවර Windows 11 Pro යතුරක්. එක් පරිගණකයක් සඳහා. ක්ෂණික ඊමේල් බෙදාහැරීම. ලොවපුරා සක්‍රිය කර භාවිතා කරන්න.",
      ta: "உண்மை Windows 11 Pro வாழ்நாள் விசை. 1 கணினிக்கானது. உடனடி மின்னஞ்சல் விநியோகம். உலகம் முழுவதும் பயன்படுத்தலாம்.",
      ru: "Настоящий ключ Windows 11 Pro навсегда. Для 1 ПК. Мгновенная e-mail доставка. Для активации по всему миру.",
      zh: "正版 Windows 11 Pro 终身密钥。1台电脑适用。邮箱即时发货。全球通用。",
      es: "Licencia genuina Windows 11 Pro de por vida. Para 1 PC. Entrega instantánea por correo. Usable en todo el mundo."
    }
  },
  {
    id: "office2021",
    name: {
      en: "Office 2021 Pro Plus Key",
      si: "Office 2021 Pro Plus යතුර",
      ta: "Office 2021 Pro Plus விசை",
      ru: "Ключ Office 2021 Pro Plus",
      zh: "Office 2021 Pro Plus 激活密钥",
      es: "Clave Office 2021 Pro Plus"
    },
    price: { LKR: 4500, USD: 13, EUR: 12, GBP: 10, INR: 1100 },
    image: "https://img.drz.lazcdn.com/g/kf/Sb9bc8d1802a04d8394d16f951736c65a2.jpg_400x400q75.avif",
    delivery: {
      en: "Instant Delivery",
      si: "ක්ෂණික බෙදාහැරීම",
      ta: "உடனடி விநியோகம்",
      ru: "Мгновенная доставка",
      zh: "即时发货",
      es: "Entrega instantánea"
    },
    desc: {
      en: "Office 2021 Pro Plus lifetime key for 1 PC. Instant delivery. Supports all Office apps. One-time payment.",
      si: "එක් පරිගණකයක් සඳහා ජීවිත කාලීන Office 2021 Pro Plus යතුර. ක්ෂණික බෙදාහැරීම. සියළුම Office යෙදුම් සඳහා සහය.",
      ta: "1 கணினிக்கான Office 2021 Pro Plus வாழ்நாள் விசை. உடனடி விநியோகம். அனைத்து Office செயலிகளும்.",
      ru: "Ключ Office 2021 Pro Plus навсегда для 1 ПК. Мгновенная доставка. Все приложения Office.",
      zh: "1台电脑永久Office 2021 Pro Plus密钥。即时交付。所有Office应用。",
      es: "Clave Office 2021 Pro Plus de por vida para 1 PC. Entrega instantánea. Todas las apps."
    }
  },
  {
    id: "office2024",
    name: {
      en: "Office 2024 Pro Plus Key",
      si: "Office 2024 Pro Plus යතුර",
      ta: "Office 2024 Pro Plus விசை",
      ru: "Ключ Office 2024 Pro Plus",
      zh: "Office 2024 Pro Plus 激活密钥",
      es: "Clave Office 2024 Pro Plus"
    },
    price: { LKR: 5600, USD: 15, EUR: 14, GBP: 12, INR: 1200 },
    image: "https://img.drz.lazcdn.com/g/kf/S5d7015c8fb0f4693ac06c2df71e1dadbA.jpg_400x400q75.avif",
    delivery: {
      en: "Instant Delivery",
      si: "ක්ෂණික බෙදාහැරීම",
      ta: "உடனடி விநியோகம்",
      ru: "Мгновенная доставка",
      zh: "即时发货",
      es: "Entrega instantánea"
    },
    desc: {
      en: "Office 2024 Pro Plus key, lifetime for 1 PC. Full Office suite. Instant digital delivery.",
      si: "එක් පරිගණකයක් සඳහා Office 2024 Pro Plus ජීවිත කාලීන යතුර. ක්ෂණික බෙදාහැරීම.",
      ta: "1 கணினிக்கான Office 2024 Pro Plus வாழ்நாள் விசை. உடனடி விநியோகம்.",
      ru: "Ключ Office 2024 Pro Plus навсегда для 1 ПК. Мгновенная доставка.",
      zh: "1台电脑永久Office 2024 Pro Plus密钥。即时交付。",
      es: "Clave Office 2024 Pro Plus de por vida para 1 PC. Entrega instantánea."
    }
  },
  {
    id: "project2021",
    name: {
      en: "Microsoft Project Pro 2021 Key",
      si: "Microsoft Project Pro 2021 යතුර",
      ta: "Microsoft Project Pro 2021 விசை",
      ru: "Ключ Project Pro 2021",
      zh: "Project Pro 2021 激活密钥",
      es: "Clave Project Pro 2021"
    },
    price: { LKR: 5200, USD: 15, EUR: 14, GBP: 13, INR: 1200 },
    image: "https://img.drz.lazcdn.com/g/kf/S418dd45f61604ef8a7be51cd7190ffec3.jpg_400x400q75.avif",
    delivery: {
      en: "Instant Delivery",
      si: "ක්ෂණික බෙදාහැරීම",
      ta: "உடனடி விநியோகம்",
      ru: "Мгновенная доставка",
      zh: "即时发货",
      es: "Entrega instantánea"
    },
    desc: {
      en: "Microsoft Project Pro 2021 genuine key. Lifetime activation for 1 PC. Instant digital delivery.",
      si: "Microsoft Project Pro 2021 සත්‍ය යතුර. එක් පරිගණකයක් සඳහා ජීවිත කාලීන සක්‍රීය කිරීම.",
      ta: "Microsoft Project Pro 2021 உண்மை விசை. 1 கணினிக்கான வாழ்நாள் செயல்படுத்துதல்.",
      ru: "Настоящий ключ Project Pro 2021. Пожизненная активация для 1 ПК.",
      zh: "Microsoft Project Pro 2021 正版密钥。1台电脑终身激活。",
      es: "Clave genuina Project Pro 2021. Activación de por vida para 1 PC."
    }
  },
  {
    id: "visio2021",
    name: {
      en: "Microsoft Visio 2021 Key",
      si: "Microsoft Visio 2021 යතුර",
      ta: "Microsoft Visio 2021 விசை",
      ru: "Ключ Visio 2021",
      zh: "Visio 2021 激活密钥",
      es: "Clave Visio 2021"
    },
    price: { LKR: 3500, USD: 10, EUR: 9, GBP: 8, INR: 800 },
    image: "https://img.drz.lazcdn.com/static/lk/p/e6fa1180deb98607be4cc772a1af56ca.png_400x400q75.avif",
    delivery: {
      en: "Instant Delivery",
      si: "ක්ෂණික බෙදාහැරීම",
      ta: "உடனடி விநியோகம்",
      ru: "Мгновенная доставка",
      zh: "即时发货",
      es: "Entrega instantánea"
    },
    desc: {
      en: "Microsoft Visio 2021 key, for 1 PC. Lifetime license. Instant email delivery.",
      si: "Microsoft Visio 2021 යතුර, එක් පරිගණකයකට. ජීවිත කාලීන බලපත්‍රය.",
      ta: "Microsoft Visio 2021 விசை, 1 கணினிக்கானது. வாழ்நாள் அனுமதி.",
      ru: "Ключ Visio 2021, для 1 ПК. Пожизненная лицензия.",
      zh: "Visio 2021密钥，1台电脑用。终身授权。",
      es: "Clave Visio 2021, para 1 PC. Licencia de por vida."
    }
  }
];