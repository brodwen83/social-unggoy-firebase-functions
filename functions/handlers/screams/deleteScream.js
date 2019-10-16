const { db } = require('../../util/admin');

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
      let batch = db.batch();
      const commentsSnapshot = await db
        .collection('comments')
        .where('screamId', '==', screamId)
        .get();

      commentsSnapshot.forEach(comment => {
        batch.delete(comment.ref);
      });

      batch.commit();
    }

    if (likeCount > 0) {
      let batch = db.batch();
      const likeSnapshot = await db
        .collection('likes')
        .where('screamId', '==', screamId)
        .get();

      if (likeSnapshot) {
        likeSnapshot.forEach(like => {
          // await db.doc(`/likes/${like.id}`).delete();
          batch.delete(like.ref);
        });

        batch.commit();
      }
    }

    return res.status(200).json({ message: 'Scream deleted successfully.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};

module.exports = deleteScream;
