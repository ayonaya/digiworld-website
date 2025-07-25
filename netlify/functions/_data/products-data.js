// /netlify/functions/_data/products-data.js
// FINAL VERSION: Prices are now only defined in USD. The backend will handle all conversions.

const products = [
  {
    id: "office365lifetime",
    category: "Office",
    isHot: false,
    name: { en: "Office 365 Account - 1 Year Subscription (5 Devices)" },
    priceUSD: 23.00,
    image: "https://static-01.daraz.lk/p/ae3f76f0c47cf3b1c4099c857784b1de.jpg",
    delivery: { en: "Instant Delivery" },
    desc: { en: "1 Year subscription for up to 5 devices. Full Microsoft Office 365 suite including Word, Excel, PowerPoint and more. Instant delivery to your email after payment." },
    features: { en: [ "1-Year subscription for full access with 100GB cloud.", "Install on up to 5 devices (PC, Mac, tablets, and phones).", "Includes the latest versions of Word, Excel, PowerPoint, Outlook, and OneNote.", "Comes with 100GB of secure OneDrive cloud storage.", "Guaranteed genuine account with instant email delivery." ] },
    requirements: { en: [ "Operating System: Windows 10/11, or the three most recent versions of macOS.", "Processor: 1.6 GHz or faster, 2-core.", "RAM: 4 GB (64-bit), 2 GB (32-bit).", "Hard Disk Space: 4 GB of available disk space.", "Internet connection is required for activation and updates." ] },
    activation: { en: [ "After purchase, you will receive an email with your new Office 365 account details.", "Go to the official site: portal.office.com", "Sign in with the provided username and password.", "You will be prompted to change the password on first login.", "Download and install the Office suite directly from your account dashboard." ] }
  },
  {
    id: "win10pro",
    category: "Windows",
    isHot: false,
    name: { en: "Windows 10 Pro Key" },
    priceUSD: 9.00,
    image: "https://img.drz.lazcdn.com/static/lk/p/6089ff29fc089609833e9df6008ed942.png_400x400q75.avif",
    delivery: { en: "Instant Delivery" },
    desc: { en: "Genuine Windows 10 Pro lifetime license key. For 1 PC. Instant email delivery. Activate and use worldwide." },
    features: { en: [ "Genuine Microsoft Windows 10 Pro activation key.", "Lifetime license for one PC.", "Supports both 32-bit and 64-bit versions.", "Unlocks all professional features including BitLocker and Remote Desktop.", "Global key - can be used and activated anywhere in the world." ] },
    requirements: { en: [ "Processor: 1 gigahertz (GHz) or faster compatible processor.", "RAM: 1 gigabyte (GB) for 32-bit or 2 GB for 64-bit.", "Hard drive size: 32GB or larger hard disk.", "Graphics card: Compatible with DirectX 9 or later with WDDM 1.0 driver.", "Display: 800x600 resolution." ] },
    activation: { en: [ "Ensure your version of Windows is Windows 10 Pro.", "Go to 'Settings' > 'Update & Security' > 'Activation'.", "Click on 'Change product key'.", "Enter the 25-digit key you received via email.", "Click 'Next' to activate your genuine copy of Windows." ] }
  },
  {
    id: "win11pro",
    category: "Windows",
    isHot: true,
    name: { en: "Windows 11 Pro Key" },
    priceUSD: 11.00,
    image: "https://img.drz.lazcdn.com/static/lk/p/4ac77c5340b852dcfe5d0f0ba66fb1ed.png_400x400q75.avif",
    delivery: { en: "Instant Delivery" },
    desc: { en: "Genuine Windows 11 Pro lifetime license key. For 1 PC. Instant email delivery. Use worldwide." },
    features: { en: [ "Genuine Microsoft Windows 11 Pro activation key.", "Lifetime license for one PC.", "Experience the new modern interface and features.", "Includes advanced security features like hardware-based isolation.", "Global key - can be used and activated anywhere in the world." ] },
    requirements: { en: [ "Processor: 1 gigahertz (GHz) or faster with 2 or more cores on a compatible 64-bit processor.", "RAM: 4 GB or more.", "Storage: 64 GB or larger storage device.", "System firmware: UEFI, Secure Boot capable.", "TPM: Trusted Platform Module (TPM) version 2.0." ] },
    activation: { en: [ "Ensure your version of Windows is Windows 11 Pro.", "Go to 'Settings' > 'System' > 'Activation'.", "Click on 'Change product key'.", "Enter the 25-digit key you received via email.", "Click 'Next' to activate your genuine copy of Windows." ] }
  },
  {
    id: "office2021",
    category: "Office",
    isHot: false,
    name: { en: "Office 2021 Pro Plus Key" },
    priceUSD: 13.00,
    image: "https://img.drz.lazcdn.com/g/kf/Sb9bc8d1802a04d8394d16f951736c65a2.jpg_400x400q75.avif",
    delivery: { en: "Instant Delivery" },
    desc: { en: "Office 2021 Pro Plus lifetime key for 1 PC. Instant delivery. Supports all Office apps. One-time payment." },
    features: { en: [ "One-time purchase for a lifetime license.", "Classic 2021 versions of Word, Excel, PowerPoint, and Outlook.", "Licensed for home and commercial use on one PC.", "Includes Publisher and Access (PC only).", "Instant digital delivery." ] },
    requirements: { en: [ "Operating System: Windows 10 or Windows 11.", "Processor: 1.6 GHz, 2-core processor.", "RAM: 4 GB RAM.", "Hard Disk Space: 4 GB of available disk space.", "Does not run on macOS." ] },
    activation: { en: [ "Uninstall any previous version of Office.", "Download and install Office 2021 Pro Plus from the official link provided in your email.", "Open any Office application (e.g., Word).", "Enter the 25-digit product key when prompted.", "Follow the on-screen instructions to complete activation." ] }
  },
  {
    id: "office2024",
    category: "Office",
    isHot: true,
    name: { en: "Office 2024 Pro Plus Key" },
    priceUSD: 15.00,
    image: "https://img.drz.lazcdn.com/g/kf/S5d7015c8fb0f4693ac06c2df71e1dadbA.jpg_400x400q75.avif",
    delivery: { en: "Instant Delivery" },
    desc: { en: "Office 2024 Pro Plus key, lifetime for 1 PC. Full Office suite. Instant digital delivery." },
    features: { en: [ "Get the very latest Office applications with this one-time purchase.", "Includes the 2024 versions of all classic Office apps.", "Licensed for home and commercial use on one Windows PC.", "Enhanced features and performance improvements over previous versions.", "Instant digital delivery." ] },
    requirements: { en: [ "Operating System: Windows 10 or Windows 11.", "Processor: 1.6 GHz, 2-core processor.", "RAM: 4 GB RAM.", "Hard Disk Space: 4 GB of available disk space.", "Microsoft Account required." ] },
    activation: { en: [ "Ensure no other version of Office is installed.", "Use the official download link provided in your delivery email.", "Run the installer and wait for it to complete.", "Open an Office app like Word and enter your product key to activate.", "Enjoy the latest version of Office!" ] }
  },
  {
    id: "project2021",
    category: "Development",
    isHot: false,
    name: { en: "Microsoft Project Pro 2021 Key" },
    priceUSD: 15.00,
    image: "https://img.drz.lazcdn.com/g/kf/S418dd45f61604ef8a7be51cd7190ffec3.jpg_400x400q75.avif",
    delivery: { en: "Instant Delivery" },
    desc: { en: "Microsoft Project Pro 2021 genuine key. Lifetime activation for 1 PC. Instant digital delivery." },
    features: { en: [ "Genuine license for Microsoft Project Professional 2021.", "Powerful project management tools and templates.", "Manage schedules, resources, and finances.", "One-time purchase for one PC.", "Instant digital delivery." ] },
    requirements: { en: [ "Operating System: Windows 10 or Windows 11.", "Processor: 1.6 GHz or faster, 2-core.", "RAM: 4 GB RAM.", "Hard Disk Space: 4 GB of available disk space.", "Display: 1280 x 768 screen resolution." ] },
    activation: { en: [ "Download and install Project Professional 2021 from the official link.", "Open Microsoft Project.", "Enter the 25-digit product key you received via email.", "Follow the on-screen prompts to complete activation." ] }
  },
  {
    id: "visio2021",
    category: "Development",
    isHot: false,
    name: { en: "Microsoft Visio 2021 Key" },
    priceUSD: 0.10,
    image: "https://img.drz.lazcdn.com/static/lk/p/e6fa1180deb98607be4cc772a1af56ca.png_400x400q75.avif",
    delivery: { en: "Instant Delivery" },
    desc: { en: "Microsoft Visio 2021 key, for 1 PC. Lifetime license. Instant email delivery." },
    features: { en: [ "Genuine license for Microsoft Visio Professional 2021.", "Create professional diagrams, flowcharts, and floor plans.", "Comes with a rich library of modern shapes and templates.", "One-time purchase for one PC.", "Instant digital delivery." ] },
    requirements: { en: [ "Operating System: Windows 10 or Windows 11.", "Processor: 1.6 GHz or faster, 2-core.", "RAM: 4 GB RAM.", "Hard Disk Space: 4 GB of available disk space.", "Graphics: DirectX 10 graphics card for graphics hardware acceleration." ] },
    activation: { en: [ "Download and install Visio Professional 2021 from the official link.", "Open Microsoft Visio.", "Enter the 25-digit product key you received via email.", "Follow the on-screen prompts to complete activation." ] }
  }
];

module.exports = { products };