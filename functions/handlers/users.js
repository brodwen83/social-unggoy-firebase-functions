const firebase = require('firebase');
const firebaseConfig = require('../config/firebase');
firebase.initializeApp(firebaseConfig);

const BusBoy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');

const { admin, db } = require('../util/admin');
const {
  validateLoginCredentials,
  validateSignupCredentials,
} = require('../util/validators');
const { reduceUserDetails } = require('../util/helpers');

// User Signup
exports.signup = async (request, response) => {
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
    const doc = db.doc(`/users/${handle}`).get();

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
    } else return response.status(500).json({ error: error.code });
  }
};

exports.login = async (request, response) => {
  const { email, password } = request.body;
  const { errors, isInvalid } = validateLoginCredentials({ ...request.body });

  if (isInvalid) return response.status(400).json(errors);

  try {
    const data = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    const idToken = await data.user.getIdToken();

    return response.json({ token: `Bearer ${idToken}` });
  } catch (error) {
    console.error(error);
    if (error.code === 'auth/wrong-password') {
      return response
        .status(403)
        .json({ general: 'Wrong credentials, please try again' });
    } else return response.status(500).json({ error: error.code });
  }
};

// getAuthenticatedUser
exports.getAuthenticatedUser = async (request, response) => {
  let userData = {};

  try {
    const doc = await db.doc(`users/${request.user.handle}`).get();

    if (doc.exists) userData.credentials = doc.data();

    const likesData = await db
      .collection('likes')
      .where('userHandle', '==', request.user.handle)
      .get();

    userData.likes = [];
    likesData.forEach(like => {
      userData.likes.push(like.data());
    });

    return response.status(200).json(userData);
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.code });
  }
};

// Add User Details
exports.addUserDetails = async (request, response) => {
  let userDetails = reduceUserDetails({ ...request.body });

  try {
    await db.doc(`/users/${request.user.handle}`).update(userDetails);

    return response.status(201).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: error.code });
  }
};

// Upload Image
exports.uploadImage = (request, response) => {
  const acceptedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const busboy = new BusBoy({ headers: request.headers });
  let imageFileName;
  let imageToBeUploaded;

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    if (!acceptedMimeTypes.includes(mimetype))
      return response.status(400).json({ image: 'Invalid file type' });

    let splittedFilename = filename.split('.');
    const imageExtension = splittedFilename.pop();

    imageFileName = `${Date.now()}_${Math.round(
      Math.random() * 999999999,
    )}.${imageExtension}`;

    const filepath = path.join(os.tmpdir(), imageFileName);

    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on('finish', async () => {
    try {
      await admin
        .storage()
        .bucket()
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: { metadata: { contentType: imageToBeUploaded.mimetype } },
        });

      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;

      await db.doc(`/users/${request.user.handle}`).update({ imageUrl });
      return response.json({ message: 'Image uploaded succesfully', imageUrl });
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: error.code });
    }
  });

  busboy.end(request.rawBody);
};
