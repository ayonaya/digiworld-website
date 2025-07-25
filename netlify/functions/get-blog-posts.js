// /netlify/functions/get-blog-posts.js
const { db } = require('./firebase-admin');

exports.handler = async (event) => {
  try {
    const postsRef = db.collection('blog_posts').orderBy('createdAt', 'desc');
    const snapshot = await postsRef.get();
    
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, posts })
    };

  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Internal server error.' })
    };
  }
};