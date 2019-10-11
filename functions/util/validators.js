const { isEmail, isEmpty } = require('./helpers');

exports.validateLoginCredentials = ({ email, password }) => {
  let errors = {};

  if (isEmpty(email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(email)) {
    errors.email = 'Must be a valid email address';
  }
  if (isEmpty(password)) errors.password = 'Must not be empty';

  return errors;
};

exports.validateSignupCredentials = ({
  email,
  password,
  confirmPassword,
  handle,
}) => {
  let errors = {};

  if (isEmpty(email)) {
    errors.email = 'Must not be empty';
  } else if (!isEmail(email)) {
    errors.email = 'Must be a valid email';
  }
  if (isEmpty(password)) errors.password = 'Must not be empty';
  if (password !== confirmPassword) errors.password = 'Password must match';
  if (isEmpty(handle)) errors.handle = 'Must not be empty';

  return errors;
};
