const User = require('../models/user');
const Post = require('../models/post');
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
  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated!');
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(
        postInput.title || !validator.isLength(postInput.title, { min: 5 })
      )
    ) {
      errors.push('Invalid input.');
    }
    if (
      validator.isEmpty(
        postInput.content || !validator.isLength(postInput.content, { min: 5 })
      )
    ) {
      errors.push('Invalid conent.');
    }
    if (errors.length > 0) {
      const error = new Error('Invalid Input');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found!');
      error.code = 401;
      throw error;
    }
    const post = await new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });
    const createdPost = await post.save();
    console.log('CREATED POST', createdPost);
    user.posts.push(createdPost);
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  getPosts: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error('Not Authenticated!');
      error.code = 401;
      throw error;
    }
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find().sort({ createdAt: -1 }).populate('creator');
    console.log('FETCHED totalPosts', totalPosts);
    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPosts,
    };
  },
};
