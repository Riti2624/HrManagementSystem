const { login, signup, validateEmail, validatePasswordStrength } = require('../services/authService');

async function loginController(req, res, next) {
  const { email, password } = req.body || {};
  try {
    const result = await login(email, password);

    if (!result) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

function meController(req, res) {
  return res.json({ user: req.user });
}

async function signupController(req, res, next) {
  try {
    const { name, email, password, role } = req.body || {};

    if (!name || !validateEmail(email) || !validatePasswordStrength(password)) {
      return res.status(400).json({ message: 'Please provide a valid name, email, and strong password.' });
    }

    const result = await signup({ name, email, password, role });
    return res.status(201).json(result);
  } catch (error) {
    if (error.code === 'DUPLICATE_EMAIL') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    return next(error);
  }
}

module.exports = { loginController, meController, signupController };
