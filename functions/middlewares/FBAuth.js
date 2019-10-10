const admin = require('firebase-admin');
const db = admin.firestore();

const Authenticate = async (request, response, next) => {
  const { authorization } = request.headers;
  let idToken;

  if (authorization && authorization.startsWith('Bearer ')) {
    idToken = authorization.split('Bearer ')[1];
  } else {
    console.error('No token found');
    return response.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    console.log('decodedToken', decodedToken);
    request.user = decodedToken;
    const data = await db
      .collection('users')
      .where('userId', '==', request.user.uid)
      .limit(1)
      .get();

    request.user.handle = await data.docs[0].data().handle;
    return next();
  } catch (error) {
    console.error('Error while verifying token');
    if (error.code === 'auth/argument-error') {
      return response
        .status(403)
        .json({ authenticationError: 'Unauthorized / Forbidden token' });
    } else return response.status(403).json({ error: error.code });
  }
};

module.exports = Authenticate;
