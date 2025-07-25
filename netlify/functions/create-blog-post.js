// /netlify/functions/create-blog-post.js
const { db, admin } = require('./firebase-admin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Authentication required.' }) };
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        if (decodedToken.isAdmin !== true) {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Forbidden. User is not an admin.' }) };
        }

        const { title, content, author } = JSON.parse(event.body);
        if (!title || !content || !author) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Title, content, and author are required.' }) };
        }

        const postRef = db.collection('blog_posts').doc();
        await postRef.set({
            title,
            content,
            author,
            createdAt: new Date().toISOString()
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: `Blog post "${title}" has been published.` }),
        };
    } catch (error) {
        console.error('Error creating blog post:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'An error occurred while creating the post.' }),
        };
    }
};