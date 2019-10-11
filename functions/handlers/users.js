const firebase = require('firebase');
const firebaseConfig = require('../config/firebase');
firebase.initializeApp(firebaseConfig);

const { db } = require('../util/admin');
const { isEmpty } = require('../util/helpers');
const {
  validateLoginCredentials,
  validateSignupCredentials,
} = require('../util/validators');

exports.signup = async (request, response) => {
  const { email, password, confirmPassword, handle } = request.body;

  const errors = validateSignupCredentials({
    email,
    password,
    confirmPassword,
    handle,
  });

  if (!isEmpty(errors)) return response.status(400).json(errors);

  let token, userId;

  try {
    const doc = db.doc(`/users/${handle}`).get();

    if (doc.exists) {
      return response
        .status(400)
        .json({ handle: 'this handle is already taken' });
    }

    const data = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);

    userId = data.user.uid;

    const idToken = await data.user.getIdToken();

    token = `Bearer ${idToken}`;

    const userCredentials = {
      handle,
      email,
      createdAt: new Date().toISOString(),
      userId,
    };

    await db.doc(`/users/${handle}`).set(userCredentials);
    return response.status(201).json({ token });
  } catch (error) {
    console.error(error);
    if (error.code === 'auth/email-already-in-use') {
      return response.status(400).json({ email: 'Email already in use' });
    } else return response.status(500).json({ error: error.code });
  }
};

exports.login = async (request, response) => {
  const { email, password } = request.body;
  const errors = validateLoginCredentials({ ...request.body });

  if (!isEmpty(errors)) return response.status(400).json(errors);

  try {
    const data = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const idToken = await data.user.getIdToken();

    return response.json({ token: `Bearer ${idToken}` });
  } catch (error) {
    console.error(error);
    if (error.code === 'auth/wrong-password') {
      return response
        .status(403)
        .json({ general: 'Wrong credentials, please try again' });
    } else return response.status(500).json({ error: error.code });
  }
};
