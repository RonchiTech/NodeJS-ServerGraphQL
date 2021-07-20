const User = require('../models/user');
const bcrypt = require('bcryptjs');
module.exports = {
  createUser: async function (args, req) {
    const { email, password, name } = args.userInput;
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
};
