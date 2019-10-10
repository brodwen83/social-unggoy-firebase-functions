const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

app.get('/screams', (request, response) => {
  admin
    .firestore()
    .collection('screams')
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
    .catch(err => console.error(err));
});

app.post('/scream', (request, response) => {
  const { body, userHandle } = request.body;

  const newScream = {
    body,
    userHandle,
    createdAt: new Date().toISOString(),
  };

  admin
    .firestore()
    .collection('screams')
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

exports.api = functions.https.onRequest(app);
