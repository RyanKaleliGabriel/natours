const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcryptjs");

//name, email, photo, password, passwordConfirm

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
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (el) {
                // THIS only points to current doc and New document creation and not update
                return el === this.password;
            },
            message: "Passwords are not the same."
        }
    },
    passwordChangedAt: {
        type: Date
    }
});

// Mongoose DOCUMENT MIDDLEWARE runs before .save() and .create() but not .insertMany
// pre middleware
userSchema.pre('save', async function (next) {
    //Only run this function if the password was modified
    if (!this.isModified('password')) return next();

    //Hash the password with the cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    //DELETE passwordConfirm field
    //Passwordconfirm is a required input not required to be persisted in the database
    this.passwordConfirm = undefined;
    next();
});

// This is an insance method it it available in th document created 
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        console.log(changedTimestamp, JWTTimestamp);
        return JWTTimestamp < changedTimestamp 
    }

    //False means not changed
    return false;
};

const User = mongoose.model('User', userSchema);
module.exports = User;