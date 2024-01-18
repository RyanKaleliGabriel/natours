const { promisify } = require('util');
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const crypto = require('crypto');


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
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
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
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exists', 401));
    }

    //4)CHECK IF USER changed password after the token was issued

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Recently changed password! Please login again', 401));
    }

    //Grant access to protected route
    req.user = currentUser;
    next();
});


exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        //Roles is an array ['admin', 'lead-guide']
        if (!roles.includes(req.user.role)) {
            return next(new AppError("You do not have permission to perform this action", 403));
            //403 means forbidden
        }
        next();
    };
};


exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1)Get user based on Posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with email address', 404));
    }

    //2)Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    //3)Send it to user's email
    //req.protocol is http or https
    const resetURL = `${req.protocol}://${req.get('host')}/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and
     new passwordConfirm to : ${resetURL}.\nIf you didn't forget your password, please ignore this`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 min)",
            message
        });

        res.status(200).json({
            status: 'Success',
            message: 'Token sent to email!'
        });

    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError("There was an error sending email.Try again later!"), 500);
    }

});
exports.resetPassword = catchAsync(async (req, res, next) => {
    //1) GET USER BASED ON THE TOKEN
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    //2)SET NEW PASSWORD IF TOKEN HAS NOT EXPIRED
    if (!user) {
        return next(new AppError('Token is invalid or has expired'));
    }

    //3)Update changedPasswordAt property for the user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    //4) Log the user in, send JWT
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
});