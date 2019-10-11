const admin = require('firebase-admin');
admin.initializeApp();

const firebase = require('firebase');
const firebaseConfig = require('../config/firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

module.exports = {
  admin,
  db,
  firebase,
  firebaseConfig,
};
