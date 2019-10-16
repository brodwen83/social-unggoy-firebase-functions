const functions = require('firebase-functions');
const app = require('express')();

const { db, admin } = require('./util/admin');

const Authenticate = require('./middlewares/authenticate');
const {
  getAllScreams,
  createScream,
  getScream,
  likeScream,
  unlikeScream,
  deleteScream,
} = require('./handlers/screams');
const {
  signUp,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
} = require('./handlers/users');

const { addCommentOnScream } = require('./handlers/comments');

// Screams routes
app.get('/screams', getAllScreams);
app.post('/scream', Authenticate, createScream);
app.get('/scream/:screamId', getScream);
app.post('/scream/:screamId/comment', Authenticate, addCommentOnScream);
app.get('/scream/:screamId/like', Authenticate, likeScream);
app.get('/scream/:screamId/unlike', Authenticate, unlikeScream);
app.delete('/scream/:screamId', Authenticate, deleteScream);

// Users routes
app.post('/signup', signUp);
app.post('/login', login);
app.post('/user/image', Authenticate, uploadImage);
app.post('/user', Authenticate, addUserDetails);
app.get('/user', Authenticate, getAuthenticatedUser);
app.get('/user/:userHandle', getUserDetails);
app.post('/notifications', Authenticate, markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore
  .document('likes/{id}')
  .onCreate(async snapshot => {
    try {
      console.log('triggers createNotificationOnLike');
      const screamDoc = await db
        .doc(`/screams/${snapshot.data().screamId}`)
        .get();

      if (
        screamDoc.exists &&
        screamDoc.data().userHandle !== snapshot.data().userHandle
      ) {
        await db.doc(`/notifications/${snapshot.id}`).set({
          recipient: screamDoc.data().userHandle,
          sender: snapshot.data().userHandle,
          read: false,
          screamId: screamDoc.id,
          type: 'like',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return;
    } catch (error) {
      console.error(error);
      return;
    }
  });

exports.deleteNotificationOnUnlike = functions.firestore
  .document('likes/{id}')
  .onDelete(async snapshot => {
    try {
      await db.doc(`/notifications/${snapshot.id}`).delete();
      return;
    } catch (error) {
      console.error(error);
      return;
    }
  });

exports.createNotificationOnComment = functions.firestore
  .document('comments/{id}')
  .onCreate(async snapshot => {
    try {
      const screamDoc = await db
        .doc(`/screams/${snapshot.data().screamId}`)
        .get();

      if (
        screamDoc.exists &&
        screamDoc.data().userHandle !== snapshot.data().userHandle
      ) {
        await db.doc(`/notifications/${snapshot.id}`).set({
          recipient: screamDoc.data().userHandle,
          sender: snapshot.data().userHandle,
          read: false,
          screamId: screamDoc.id,
          type: 'comment',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return;
    } catch (error) {
      console.error(error);
      return;
    }
  });
