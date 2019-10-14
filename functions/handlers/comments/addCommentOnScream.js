const { db } = require('../../util/admin');
const { validateUserComment } = require('../../util/validators');

const addCommentOnScream = async (req, res) => {
  const { screamId, body } = req.body;

  console.log('req.user.handle', req.user.handle);

  const { errors, isInvalid } = validateUserComment({
    userHandle: req.user.handle,
    screamId,
    body,
  });

  if (isInvalid) return res.status(400).json(errors);

  try {
    const newComment = {
      body,
      screamId,
      userHandle: req.user.handle,
      createdAt: new Date().toISOString(),
    };

    const comment = await db.collection('comments').add(newComment);

    return res
      .status(201)
      .json({ message: `comment ${comment.id} added successfully.` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.code });
  }
};

module.exports = addCommentOnScream;
