const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndDelete(req.params.id);

  if (!doc) {
    return next(new AppError('No doc found with that id', 404));
  }

  // 204 means no content
  res.status(204).json({
    status: 'Success',
    data: null
  });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!doc) {
    return next(new AppError('No doc found with that id', 404));
  }

  res.status(200).json({
    status: 'Success',
    data: {
      data: doc
    }
  });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.create(req.body);
  // 201 stands for created
  res.status(201).json({
    status: 'Success',
    data: {
      data: doc
    }
  });
});
