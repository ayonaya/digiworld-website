// netlify/functions/generate-sitemap.js
const { db } = require('./firebase-admin');

exports.handler = async (event, context) => {
    const baseUrl = 'https://digiworldnew.com';
    // Define your site's static pages and their SEO priority/frequency
    const staticPages = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/products.html', priority: '0.9', changefreq: 'weekly' },
        { loc: '/contact.html', priority: '0.8', changefreq: 'monthly' },
        { loc: '/about.html', priority: '0.7', changefreq: 'monthly' },
        { loc: '/faq.html', priority: '0.7', changefreq: 'monthly' },
        { loc: '/terms.html', priority: '0.5', changefreq: 'yearly' },
        { loc: '/privacy.html', priority: '0.5', changefreq: 'yearly' },
        { loc: '/refund-policy.html', priority: '0.5', changefreq: 'yearly' }
    ];

    try {
        // Fetch all documents from the 'products' collection in Firestore
        const productsSnapshot = await db.collection('products').get();
        
        // Map each product to the sitemap URL format
        const productUrls = productsSnapshot.docs.map(doc => {
            // Using today's date for lastmod. For more accuracy, you could add an 'updatedAt' field to your products.
            const lastmod = new Date().toISOString().split('T')[0];
            return `<url>
                        <loc>${baseUrl}/product-details.html?id=${doc.id}</loc>
                        <lastmod>${lastmod}</lastmod>
                        <changefreq>weekly</changefreq>
                        <priority>0.9</priority>
                    </url>`;
        }).join('');

        // Map all static pages to the sitemap URL format
        const staticUrls = staticPages.map(page =>
            `<url>
                <loc>${baseUrl}${page.loc}</loc>
                <priority>${page.priority}</priority>
                <changefreq>${page.changefreq}</changefreq>
            </url>`
        ).join('');

        // Combine static and dynamic URLs into a complete sitemap
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${staticUrls}
    ${productUrls}
</urlset>`;

        // Return the sitemap as an XML file
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/xml' },
            body: sitemap
        };

    } catch (error) {
        console.error('Error generating sitemap:', error);
        return { 
            statusCode: 500, 
            body: 'Error generating sitemap.' 
        };
    }
};