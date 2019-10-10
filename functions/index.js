const functions = require('firebase-functions');
const app = require('express')();
const admin = require('firebase-admin');
admin.initializeApp();

const firebaseConfig = require('./config/firebase');

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

const { isEmail, isEmpty } = require('./util/helpers');

app.get('/screams', async (request, response) => {
  db.collection('screams')
    .orderBy('createdAt', desc)
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          ...doc.data(),
        });
      });
      return response.json(screams);
    })
    .catch(err => {
      console.error(err);
      return response.status(500).json(err);
    });
});

app.post('/scream', (request, response) => {
  const { body, userHandle } = request.body;

  const newScream = {
    body,
    userHandle,
    createdAt: new Date().toISOString(),
  };

  db.collection('screams')
    .add(newScream)
    .then(doc => {
      response
        .status(200)
        .json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      response.status(500).json({ error: 'something went wrong' });
      console.error(err);
    });
});

// signup route
app.post('/signup', (request, response) => {
  const { email, password, confirmPassword, handle } = request.body;
  const newUser = {
    email,
    password,
    confirmPassword,
    handle,
  };

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(newUser.email)) {
    errors.email = 'Must be a valid email';
  }
  if (isEmpty(newUser.password)) errors.password = 'Must not be empty';
  if (newUser.password !== newUser.confirmPassword)
    errors.password = 'Password must match';
  if (isEmpty(newUser.handle)) errors.handle = 'Must not be empty';

  if (!isEmpty(errors)) return response.status(400).json(errors);

  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return response
          .status(400)
          .json({ handle: 'this handle is already taken' });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return response.status(201).json({ token });
    })
    .catch(error => {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        return response.status(400).json({ email: 'Email already in use' });
      } else return response.status(500).json({ error: error.code });
    });
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
