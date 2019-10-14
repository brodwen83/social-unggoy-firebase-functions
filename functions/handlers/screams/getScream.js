const { db } = require('../../util/admin');

const getScream = async (req, res) => {
  let scream = {};

  try {
    const screamDoc = await db.doc(`/screams/${req.params.screamId}`).get();

    if (!screamDoc.exists)
      return res.status(404).json({ error: 'Scream not found.' });

    scream = screamDoc.data();
    scream.screamId = screamDoc.id;

    const commentsDoc = await db
      .collection('comments')
      .where('screamId', '==', req.params.screamId)
      .orderBy('createdAt', 'desc')
      .get();

    scream.comments = [];
    commentsDoc.forEach(comment => {
      scream.comments.push(comment.data());
    });

    return res.status(200).json(scream);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.code });
  }
};

module.exports = getScream;
