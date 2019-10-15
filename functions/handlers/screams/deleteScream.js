const { db } = require('../../util/admin');

// const deleteComments = async screamId => {
//   console.log('deleteComments->screamID', screamId);

//   const snapshot = await db
//     .collection('comments')
//     .where('screamId', '==', `${screamId}34`)
//     .get();

//   if (snapshot.length) {
//     snapshot.forEach(async doc => {
//       await db.doc(`/comments/${doc.id}`).delete();
//     });
//   } else {
//     throw new Error('comments not found');
//   }
// };

const deleteScream = async (req, res) => {
  const { screamId } = req.params;
  const { handle } = req.user;
  const screamDoc = db.doc(`/screams/${screamId}`);

  try {
    const scream = await screamDoc.get();

    if (!scream.exists)
      return res.status(404).json({ error: 'scream not found' });

    if (scream.data().userHandle !== handle) {
      console.log('doc.data().userHandle', scream.data().userHandle);
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await screamDoc.delete();

    const { commentCount, likeCount } = scream.data();

    if (commentCount > 0) {
      const commentsSnapshot = await db
        .collection('comments')
        .where('screamId', '==', screamId)
        .get();

      if (commentsSnapshot) {
        commentsSnapshot.forEach(async comment => {
          await db.doc(`/comments/${comment.id}`).delete();
        });
      }
    }

    if (likeCount > 0) {
      const likeSnapshot = await db
        .collection('likes')
        .where('screamId', '==', screamId)
        .get();

      if (likeSnapshot) {
        likeSnapshot.forEach(async like => {
          await db.doc(`/likes/${like.id}`).delete();
        });
      }
    }

    return res.status(200).json({ message: 'Scream deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};

module.exports = deleteScream;
