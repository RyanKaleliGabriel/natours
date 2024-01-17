const { promisify } = require('util');
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/appError");


const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    });

    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'Success',
        token,
        data: {
            user: newUser
        }
    });
});


exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and passsword exist
    if (!email || !password) {
        return next(new AppError("Please provide email and password!", 400));
    }
    // 2)Check if user exist && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401)); //401 means unauthorized
    }
    //3) if everything is ok, send token to client
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError("You are not logged in! Please log in to get access", 401));
    }

    //2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //3) Check if users still exists 
    //The user may be deleted
    const freshUser = await User.findById(decoded.id);
    if(!freshUser){
        return next(new AppError('The user belonging to this token does no longer exists', 401))
    }

    //4)CHECK IF USER changed password after the token was issued

    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('Recently changed password! Please login again', 401))
    }

    //Grant access to protected route
    req.user = freshUser
    next();
});