/* const { getAuth } = require('firebase-admin/auth');
const { initializeApp, cert } = require('firebase-admin/app');

// Initialize Firebase Admin
let adminApp;

try {
  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { token, uid } = event.queryStringParameters;

    if (!token || !uid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing token or user ID' })
      };
    }

    // Verify Firebase Admin is initialized
    if (!adminApp) {
      throw new Error('Firebase Admin not initialized');
    }

    const auth = getAuth(adminApp);
    
    // Verify the token and update user email verification status
    await auth.updateUser(uid, {
      emailVerified: true
    });

    console.log('Email verified successfully for user:', uid);

    // Redirect to success page
    return {
      statusCode: 302,
      headers: {
        'Location': '/email-verified.html'
      },
      body: ''
    };

  } catch (error) {
    console.error('Verification error:', error);
    
    // Redirect to error page
    return {
      statusCode: 302,
      headers: {
        'Location': '/verification-failed.html'
      },
      body: ''
    };
  }
};
*/
