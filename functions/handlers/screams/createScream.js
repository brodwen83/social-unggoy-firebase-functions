const { db } = require('../../util/admin');

const createScream = async (req, res) => {
  const { body } = req.body;
  const { handle, imageUrl } = req.user;
  const newScream = {
    body,
    userHandle: handle,
    userImage: imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  try {
    const document = await db.collection('screams').add(newScream);
    const scream = newScream;

    scream.screamId = document.id;

    return res.status(200).json(scream);
  } catch (error) {
    console.error(err);
    return res.status(500).json({ error: 'something went wrong' });
  }
};

module.exports = createScream;
