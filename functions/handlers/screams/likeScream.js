const { db } = require('../../util/admin');

const likeScream = async (req, res) => {
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
      await db.collection('likes').add({
        screamId,
        userHandle: handle,
      });

      scream.likeCount++;
      await screamDoc.update({ likeCount: scream.likeCount });

      return res.json(scream);
    } else return res.status(400).json({ error: 'scream already liked' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.code });
  }
};

module.exports = likeScream;
