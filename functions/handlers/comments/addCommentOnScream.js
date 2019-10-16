const { db } = require('../../util/admin');
const { isEmpty } = require('../../util/helpers');

const addCommentOnScream = async (req, res) => {
  const { body } = req.body;
  const { screamId } = req.params;
  const { handle, imageUrl } = req.user;

  if (isEmpty(body))
    return res.status(400).json({ comment: 'should not be empty.' });

  const screamRef = db.doc(`/screams/${screamId}`);

  try {
    const newComment = {
      body,
      screamId,
      userHandle: handle,
      userImage: imageUrl,
      createdAt: new Date().toISOString(),
    };

    const doc = await screamRef.get();

    if (!doc.exists)
      return res.status(404).json({ comment: 'scream not found.' });

    const comment = await db.collection('comments').add(newComment);
    await doc.ref.update({
      commentCount: doc.data().commentCount + 1,
    });

    return res.status(201).json({
      message: `comment ${comment.id} added successfully.`,
      newComment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.code });
  }
};

module.exports = addCommentOnScream;
