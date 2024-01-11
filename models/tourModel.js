const mongoose = require('mongoose')
const slugify = require('slugify')
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tour must have a name'],
    unique: true,
    trim: true
  },
  slug: String,
  duration: {
    type: Number,
    require: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    require: [true, 'A tour must have a groupsize']
  },
  difficulty: {
    type: String,
    require: [true, 'A tour must have a difficulty']
  },
  ratingsAverage: {
    type: Number,
    default: 4.5
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true,
    required: [true, 'A tour must have a description']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    require: [true, 'A tour must have acover image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Don't use virtual properties as queries, they basically don't exist
// to use (this) we must use the function keyword not a callback
// Knowing the duration in weeks is a business model , so it is done in the model not controller
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})

// DOCUMENT MIDDLEWARE runs before .save() and .create() but not .insertMany
// pre middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true })
  next()
})

// tourSchema.pre('save', function (next) {
//   console.log('Will save document...')
//   next()
// })
// // Document Post middleware
// tourSchema.post('save', function (doc, next) {
//   console.log(doc)
//   next()
// })

const Tour = mongoose.model('Tour', tourSchema)
module.exports = Tour
