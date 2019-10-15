const { db } = require('../../util/admin');

const unlikeScream = async (req, res) => {
  const { handle } = req.user;
  const { screamId } = req.params;

  const likeDoc = db
    .collection('likes')
    .where('userHandle', '==', handle)
    .where('screamId', '==', screamId)
    .limit(1);

  const screamDoc = db.doc(`/screams/${screamId}`);
  let scream;

  try {
    const screamData = await screamDoc.get();

    if (screamData.exists) {
      scream = screamData.data();
      scream.screamId = screamData.id;
    } else return res.status(404).json({ error: 'Scream not found' });

    const likeData = await likeDoc.get();

    if (likeData.empty) {
      return res.status(400).json({ error: 'screams not liked' });
    } else {
      await db.doc(`/likes/${likeData.docs[0].id}`).delete();

      scream.likeCount -= 1;

      await screamDoc.update({ likeCount: scream.likeCount });

      return res.json(scream);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.code });
  }
};

module.exports = unlikeScream;
