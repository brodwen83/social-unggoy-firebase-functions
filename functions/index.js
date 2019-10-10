const functions = require('firebase-functions');
const app = require('express')();
const admin = require('firebase-admin');
admin.initializeApp();

const firebaseConfig = require('./config/firebase');

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

const { isEmail, isEmpty } = require('./util/helpers');
const Authenticate = require('./middlewares/Authenticate');

app.get('/screams', async (request, response) => {
  try {
    const data = await db
      .collection('screams')
      .orderBy('createdAt', 'desc')
      .get();

    if (data) {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          ...doc.data(),
        });
      });

      return response.json(screams);
    }
    return response.status(404).json({ data: [] });
  } catch (error) {
    console.error(error);
    return response.status(500).json(error);
  }
});

app.post('/scream', Authenticate, async (request, response) => {
  const { body } = request.body;
  const newScream = {
    body,
    userHandle: request.user.handle,
    createdAt: new Date().toISOString(),
  };

  try {
    const document = await db.collection('screams').add(newScream);

    return response
      .status(200)
      .json({ message: `document ${document.id} created successfully` });
  } catch (error) {
    console.error(err);
    return response.status(500).json({ error: 'something went wrong' });
  }
});

// signup route
app.post('/signup', async (request, response) => {
  const { email, password, confirmPassword, handle } = request.body;

  let errors = {};

  if (isEmpty(email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(email)) {
    errors.email = 'Must be a valid email';
  }
  if (isEmpty(password)) errors.password = 'Must not be empty';
  if (password !== confirmPassword) errors.password = 'Password must match';
  if (isEmpty(handle)) errors.handle = 'Must not be empty';

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

    token = idToken;

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
});

app.post('/login', async (request, response) => {
  const { email, password } = request.body;

  let errors = {};

  if (isEmpty(email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(email)) {
    errors.email = 'Must be a valid email address';
  }
  if (isEmpty(password)) errors.password = 'Must not be empty';

  if (!isEmpty(errors)) return response.status(400).json(errors);

  try {
    const data = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const idToken = await data.user.getIdToken();

    return response.json({ token: idToken });
  } catch (error) {
    console.error(error);
    if (error.code === 'auth/wrong-password') {
      return response
        .status(403)
        .json({ general: 'Wrong credentials, please try again' });
    } else return response.status(500).json({ error: error.code });
  }
});

exports.api = functions.https.onRequest(app);
