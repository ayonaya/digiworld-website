+39
-0

// /netlify/functions/get-blog-post.js
const { db } = require('./firebase-admin');

exports.handler = async (event) => {
  const postId = event.queryStringParameters && event.queryStringParameters.id;

  if (!postId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Post ID is required.' })
    };
  }

  try {
    const doc = await db.collection('blog_posts').doc(postId).get();

    if (!doc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: 'Post not found.' })
      };
    }

    const post = { id: doc.id, ...doc.data() };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, post })
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: false, message: 'Internal server error.' })
    };
  }
};