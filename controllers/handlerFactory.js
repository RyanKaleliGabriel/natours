const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIfeatures = require('../utils/apiFeatures');

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

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
  let query = Model.findById(req.params.id);
  if (popOptions) query = query.populate(popOptions);
  // Populate is only used in the query
  const doc = await query;

  if (!doc) {
    return next(new AppError('No document found with that id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
  // To allow for nested getReview on tour(hack)
  let filter = {}
  if (req.params.tourId) filter = { tour: req.params.tourId }

  // EXECUTE QUERY
  const features = new APIfeatures(Model.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // const doc = await features.query.explain();
  const doc = await features.query;

  // SEND RESPONSE
  res.status(200).json({

    // success 200 code
    // fail if there was an error at the client
    // error if there was an error in the client

    status: 'success',
    results: doc.length,
    data: {
      data: doc
    }
  });
});
