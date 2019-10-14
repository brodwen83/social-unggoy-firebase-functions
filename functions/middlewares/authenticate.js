const { admin, db } = require('../util/admin');

const Authenticate = async (req, res, next) => {
  const { authorization } = req.headers;
  let idToken;

  if (authorization && authorization.startsWith('Bearer ')) {
    idToken = authorization.split('Bearer ')[1];
  } else {
    console.error('No token found');
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    req.user = decodedToken;
    const userData = await db
      .collection('users')
      .where('userId', '==', req.user.uid)
      .limit(1)
      .get();

    req.user = { ...userData.docs[0].data() };
    return next();
  } catch (error) {
    console.error('Error while verifying token');
    if (error.code === 'auth/argument-error') {
      return res
        .status(403)
        .json({ authenticationError: 'Unauthorized / Forbidden token' });
    } else return res.status(500).json(error);
  }
};

module.exports = Authenticate;
