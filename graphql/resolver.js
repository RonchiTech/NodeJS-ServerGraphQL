const User = require('../models/user');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
module.exports = {
  createUser: async function (args, req) {
    const { email, password, name } = args.userInput;
    const error = [];
    if (!validator.isEmail(email)) {
      error.push({ message: 'Invalid Email' });
    }
    if (
      validator.isEmpty(password) ||
      !validator.isLength(password, { min: 5 })
    ) {
      error.push({ message: 'Password should be at least 5 characters' });
    }
    if (error.length > 0) {
      const err = new Error('Invalid Input ');
      err.data = error;
      err.code = 422;
      throw err;
    }
    // const email = _email;
    // const password = _password;
    // const name = _name;
    // console.log(args.userInput);
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      const error = new Error('User already exists!');
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPassword,
      name: name,
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  login: async function ({ email, password }, req) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('User does not exists!');
      error.code = 401;
      throw error;
    }
    const isPasswordEqual = await bcrypt.compare(password, user.password);
    if (!isPasswordEqual) {
      const error = new Error('Password is incorrect');
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      'mysupersecretkey',
      { expiresIn: '1h' }
    );
    return { token, userId: user._id.toString() };
  },
};
