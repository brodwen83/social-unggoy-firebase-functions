const { db, firebase, firebaseConfig } = require('../../util/admin');
const { validateSignupCredentials } = require('../../util/validators');

// User Signup
const signUp = async (request, response) => {
  const { email, password, confirmPassword, handle } = request.body;

  const { errors, isInvalid } = validateSignupCredentials({
    email,
    password,
    confirmPassword,
    handle,
  });

  if (isInvalid) return response.status(400).json(errors);

  const noImg = 'no-img.png';

  let token, userId;

  try {
    const doc = await db.doc(`/users/${handle}`).get();

    if (doc.exists) {
      return response
        .status(400)
        .json({ handle: 'this handle is already taken' });
    }

    const data = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);

    userId = data.user.uid;

    const idToken = await data.user.getIdToken();

    token = `Bearer ${idToken}`;

    const userCredentials = {
      handle,
      email,
      createdAt: new Date().toISOString(),
      userId,
      imageUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${noImg}?alt=media`,
    };

    await db.doc(`/users/${handle}`).set(userCredentials);
    return response.status(201).json({ token });
  } catch (error) {
    console.error(error);
    if (error.code === 'auth/email-already-in-use') {
      return response.status(400).json({ email: 'Email already in use' });
    } else
      return response
        .status(500)
        .json({ general: 'Something went wrong. Please try again' });
  }
};

module.exports = signUp;
