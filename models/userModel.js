const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// name, email, photo, password, passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      validator: function (el) {
        // THIS only points to current doc and New document creation and not update
        return el === this.password;
      },
      message: 'Passwords are not the same.'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// Mongoose DOCUMENT MIDDLEWARE runs before .save() and .create() but not .insertMany
// pre middleware
userSchema.pre('save', async function (next) {
  // Only run this function if the password was modified
  if (!this.isModified('password')) return next();

  // Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // DELETE passwordConfirm field
  // Passwordconfirm is a required input not required to be persisted in the database
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // check if a new password was created which is modification of the password field or if the password was modified
  if (!this.isModified('password') || this.isNew) return next();

  // To ensure the token is created after the password has been changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// query document runs before the find query is called
// Firstly, Mongoose middleware functions should be applied to the schema,
// not directly to a query. Also, it's a good practice to use pre middleware
// on the find hook directly without the need for a regular expression.
userSchema.pre('find', function (next) {
  // this points to the current query
  this.where({ active: { $ne: false } });
  next();
});

// This is an insance method it it available in th document created
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }

  // False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
