const functions = require('firebase-functions');
const app = require('express')();

const Authenticate = require('./middlewares/authenticate');
const { getAllScreams, createScream } = require('./handlers/screams');
const {
  signUp,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
} = require('./handlers/users');

// Screams routes
app.get('/screams', getAllScreams);
app.post('/scream', Authenticate, createScream);

// Users routes
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', Authenticate, uploadImage);
app.post('/user', Authenticate, addUserDetails);
app.get('/user', Authenticate, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
