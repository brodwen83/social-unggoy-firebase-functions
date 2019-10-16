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

exports.onUserImageProfileChange = functions.firestore
  .document('/users/{userId}')
  .onUpdate(async change => {
    console.log('change.before.data()', change.before.data());
    console.log('change.after.data()', change.after.data());
    const imageUrlBefore = change.before.data().imageUrl;
    const imageUrlAfter = change.after.data().imageUrl;

    try {
      if (imageUrlAfter !== imageUrlBefore) {
        console.log('image has changed');
        let batch = db.batch();

        const userScreams = await db
          .collection('screams')
          .where('userHandle', '==', change.before.data().handle)
          .get();

        userScreams.forEach(scream => {
          batch.update(scream.ref, { userImage: change.after.data().imageUrl });
        });

        await batch.commit();
      }
      return;
    } catch (error) {
      console.error(error);
      return;
    }
  });

exports.onScreamDelete = functions.firestore
  .document('/screams/{screamId}')
  .onDelete(async (snapshot, context) => {
    const { screamId } = context.params;
    let cbatch = db.batch();
    let lbatch = db.batch();
    let nbatch = db.batch();

    try {
      const comments = await db
        .collection('comments')
        .where('screamId', '==', screamId)
        .get();

      comments.forEach(comment => {
        cbatch.delete(comment.ref);
      });
      await cbatch.commit();

      const likes = await db
        .collection('likes')
        .where('screamId', '==', screamId)
        .get();

      likes.forEach(like => {
        lbatch.delete(like.ref);
      });
      await lbatch.commit();

      const notifications = await db
        .collection('notifications')
        .where('screamId', '==', screamId)
        .get();

      notifications.forEach(notification => {
        nbatch.delete(notification.ref);
      });
      await nbatch.commit();

      return;
    } catch (error) {
      console.log(error);
      return;
    }
  });
