const BusBoy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');

const { admin, db, firebaseConfig } = require('../../util/admin');

// Upload Image
const uploadImage = (request, response) => {
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

module.exports = uploadImage;
