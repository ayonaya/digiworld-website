// public/products.js

const products = [
  {
    id: "office365lifetime",
    category: "Office",
    isHot: true,
    name: { en: "Office 365 Account - 1 Year Subscription (5 Devices)" },
    price: { LKR: 7700, USD: 23, EUR: 21, GBP: 18, INR: 1900 },
    image: "https://static-01.daraz.lk/p/ae3f76f0c47cf3b1c4099c857784b1de.jpg",
    delivery: { en: "Instant Digital Delivery" },
    shortDesc: "1-Year subscription for 5 devices with 100GB cloud storage.",
    desc: { en: "1 Year subscription for up to 5 devices. Full Microsoft Office 365 suite including Word, Excel, PowerPoint and more. Instant delivery to your email after payment." },
    features: { en: [ "1-Year subscription for full access with 100GB cloud.", "Install on up to 5 devices (PC, Mac, tablets, and phones).", "Includes the latest versions of Word, Excel, PowerPoint, Outlook, and OneNote.", "Comes with 100GB of secure OneDrive cloud storage.", "Guaranteed genuine account with instant email delivery." ] },
    requirements: { en: [ "Operating System: Windows 10/11, or the three most recent versions of macOS.", "Processor: 1.6 GHz or faster, 2-core.", "RAM: 4 GB RAM.", "Hard Disk Space: 4 GB of available disk space." ] },
    activation: { en: [ "After payment, you will receive an email with your new Office 365 account details (username and password).", "Go to www.office.com and sign in with the provided credentials.", "You will be prompted to change the password on your first login.", "Once logged in, you can download and install the Office apps on your devices." ] }
  },
  {
    id: "win10pro",
    category: "Windows",
    isHot: false,
    name: { en: "Windows 10 Pro Key" },
    price: { LKR: 3000, USD: 9, EUR: 8, GBP: 7, INR: 700 },
    image: "https://img.drz.lazcdn.com/static/lk/p/6089ff29fc089609833e9df6008ed942.png_400x400q75.avif",
    delivery: { en: "Instant Digital Delivery" },
    shortDesc: "Genuine lifetime license key for one PC. Instant delivery.",
    desc: { en: "Genuine Windows 10 Pro lifetime license key. For 1 PC. Instant email delivery. Activate and use worldwide." },
    features: { en: [ "Genuine lifetime license for one PC.", "Supports both 32-bit and 64-bit systems.", "Global key, can be used in any country.", "Upgrade from Windows 10 Home to Pro.", "Instant digital delivery." ] },
    requirements: { en: [ "Processor: 1 gigahertz (GHz) or faster.", "RAM: 1 gigabyte (GB) for 32-bit or 2 GB for 64-bit.", "Hard disk space: 16 GB for 32-bit OS or 20 GB for 64-bit OS.", "Graphics card: DirectX 9 or later with WDDM 1.0 driver." ] },
    activation: { en: [ "Go to Settings > Update & Security > Activation.", "Click 'Change product key'.", "Enter the 25-digit product key you received via email.", "Follow the on-screen prompts to complete activation." ] }
  },
  {
    id: "win11pro",
    category: "Windows",
    isHot: true,
    name: { en: "Windows 11 Pro Key" },
    price: { LKR: 3700, USD: 11, EUR: 10, GBP: 8, INR: 860 },
    image: "https://img.drz.lazcdn.com/static/lk/p/4ac77c5340b852dcfe5d0f0ba66fb1ed.png_400x400q75.avif",
    delivery: { en: "Instant Digital Delivery" },
    shortDesc: "Genuine lifetime license key for one PC. Instant delivery.",
    desc: { en: "Genuine Windows 11 Pro lifetime license key. For 1 PC. Instant email delivery. Use worldwide." },
    features: { en: [ "Genuine lifetime license for one PC.", "Unlock all professional features of Windows 11.", "Global key for worldwide activation.", "Supports all languages.", "Instant digital delivery." ] },
    requirements: { en: [ "Processor: 1 GHz or faster with 2 or more cores.", "RAM: 4 GB or more.", "Storage: 64 GB or larger storage device.", "System firmware: UEFI, Secure Boot capable.", "TPM: Trusted Platform Module (TPM) version 2.0." ] },
    activation: { en: [ "Go to Settings > System > Activation.", "Click 'Change product key'.", "Enter the 25-digit product key you received via email.", "Follow the on-screen prompts to complete activation." ] }
  },
  {
    id: "office2021",
    category: "Office",
    isHot: false,
    name: { en: "Office 2021 Pro Plus Key" },
    price: { LKR: 4500, USD: 13, EUR: 12, GBP: 10, INR: 1080 },
    image: "https://img.drz.lazcdn.com/g/kf/Sb9bc8d1802a04d8394d16f951736c65a2.jpg_400x400q75.avif",
    delivery: { en: "Instant Digital Delivery" },
    shortDesc: "One-time purchase for 1 PC. Lifetime license.",
    desc: { en: "Office 2021 Professional Plus key for 1 PC. Lifetime license. Instant email delivery." },
    features: { en: [ "One-time purchase for 1 PC.", "Classic 2021 versions of Word, Excel, PowerPoint, and Outlook, plus Publisher and Access.", "Lifetime license, no subscription fees.", "Compatible with Windows 10 and Windows 11.", "Instant digital delivery." ] },
    requirements: { en: [ "Operating System: Windows 10 or Windows 11.", "Processor: 1.6 GHz or faster, 2-core.", "RAM: 4 GB RAM.", "Hard Disk Space: 4 GB of available disk space." ] },
    activation: { en: [ "Uninstall any previous Office versions.", "Download and install Office 2021 Pro Plus from the official link.", "Open any Office application (e.g., Word).", "Enter the 25-digit product key you received via email to activate." ] }
  },
  {
    id: "office2024",
    category: "Office",
    isHot: true,
    name: { en: "Office 2024 Pro Plus Key" },
    price: { LKR: 5200, USD: 15, EUR: 14, GBP: 12, INR: 1250 },
    image: "https://img.drz.lazcdn.com/g/kf/S5d7015c8fb0f4693ac06c2df71e1dadbA.jpg_400x400q75.avif",
    delivery: { en: "Instant Digital Delivery" },
    shortDesc: "The newest Office suite for 1 PC. Lifetime license.",
    desc: { en: "The newest Office 2024 Professional Plus key for 1 PC. Lifetime license. Instant email delivery." },
    features: { en: [ "The very latest versions of all Office apps.", "One-time purchase for 1 PC.", "Includes new AI-powered features and enhancements.", "Lifetime license with no recurring fees.", "Instant digital delivery." ] },
    requirements: { en: [ "Operating System: Windows 11.", "Processor: 1.6 GHz or faster, 2-core.", "RAM: 4 GB RAM.", "Hard Disk Space: 4 GB of available disk space." ] },
    activation: { en: [ "Uninstall any previous Office versions.", "Download and install Office 2024 Pro Plus from the official link.", "Open any Office application (e.g., Word).", "Enter the 25-digit product key you received via email to activate." ] }
  },
  {
    id: "project2021",
    category: "Development",
    isHot: false,
    name: { en: "Microsoft Project Pro 2021 Key" },
    price: { LKR: 5200, USD: 15, EUR: 14, GBP: 12, INR: 1250 },
    image: "https://img.drz.lazcdn.com/g/kf/S418dd45f61604ef8a7be51cd7190ffec3.jpg_400x400q75.avif",
    delivery: { en: "Instant Digital Delivery" },
    shortDesc: "Professional project management tool for 1 PC.",
    desc: { en: "Microsoft Project Professional 2021 key for 1 PC. Lifetime license. Instant email delivery." },
    features: { en: [ "Genuine license for Microsoft Project Professional 2021.", "Plan, manage, and deliver projects effectively.", "Includes pre-built templates and scheduling tools.", "One-time purchase for one PC.", "Instant digital delivery." ] },
    requirements: { en: [ "Operating System: Windows 10 or Windows 11.", "Processor: 1.6 GHz or faster, 2-core.", "RAM: 4 GB RAM.", "Hard Disk Space: 4 GB of available disk space." ] },
    activation: { en: [ "Download and install Project Professional 2021 from the official link.", "Open Microsoft Project.", "Enter the 25-digit product key you received via email.", "Follow the on-screen prompts to complete activation." ] }
  },
  {
    id: "visio2021",
    category: "Development",
    isHot: false,
    name: { en: "Microsoft Visio 2021 Key" },
    price: { LKR: 30, USD: 0.10, EUR: 0.10, GBP: 0.10, INR: 8 },
    image: "https://img.drz.lazcdn.com/static/lk/p/e6fa1180deb98607be4cc772a1af56ca.png_400x400q75.avif",
    delivery: { en: "Instant Digital Delivery" },
    shortDesc: "Create professional diagrams and flowcharts.",
    desc: { en: "Microsoft Visio 2021 key, for 1 PC. Lifetime license. Instant email delivery." },
    features: { en: [ "Genuine license for Microsoft Visio Professional 2021.", "Create professional diagrams, flowcharts, and floor plans.", "Comes with a rich library of modern shapes and templates.", "One-time purchase for one PC.", "Instant digital delivery." ] },
    requirements: { en: [ "Operating System: Windows 10 or Windows 11.", "Processor: 1.6 GHz or faster, 2-core.", "RAM: 4 GB RAM.", "Hard Disk Space: 4 GB of available disk space.", "Graphics: DirectX 10 graphics card for graphics hardware acceleration." ] },
    activation: { en: [ "Download and install Visio Professional 2021 from the official link.", "Open Microsoft Visio.", "Enter the 25-digit product key you received via email.", "Follow the on-screen prompts to complete activation." ] }
  }
];

module.exports = { products }; // <--- ADD THIS LINE