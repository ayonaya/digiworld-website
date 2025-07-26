const { db, admin } = require('./firebase-admin');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = event.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, message: 'Authentication required.' })
    };
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.isAdmin !== true) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: 'Forbidden. User is not an admin.' })
      };
    }

    const { postId } = JSON.parse(event.body);
    if (!postId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Post ID is required.' })
      };
    }

    await db.collection('blog_posts').doc(postId).delete();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Blog post deleted successfully.' })
    };
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Failed to delete blog post.' })
    };
  }
};