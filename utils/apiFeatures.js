class APIfeatures {
  constructor (query, queryString) {
    this.query = query
    this.queryString = queryString
  }

  filter () {
    const queryObj = { ...this.queryString }
    const excludedFields = ['page', 'sort', 'limit', 'fields']
    excludedFields.forEach(el => delete queryObj[el])

    // 2B)Advanced Filtering
    let queryStr = JSON.stringify(queryObj)

    // For each match found in the string, the callback function is invoked.
    // In the callback function, the matched operator is wrapped with a dollar sign ($).
    // This is a syntax commonly used in MongoDB to denote certain comparison operators.
    // So, for example, if the original queryStr was something like {"age": {"gte": 25}},
    // after the replace method, it would become {"age": {"$gte": 25}}.

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
    // The reason why we use .find again is commented below
    this.query = this.query.find(JSON.parse(queryStr))
    return this
  }

  sort () {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ')
      // sort(price, ratingsAverage) if the priceis the same it sorts by ratingsAverage
      // It should not be necessarily the price but other fields specified in the client url
      this.query = this.query.sort(sortBy)
    }
    // This default sort brings problems when paginating beacuse all tours we're created at the same time
    // } else {
    //   this.query = this.query.sort('-createdAt')
    // }

    return this
  }

  limitFields () {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ')
      this.query = this.query.select(fields)
    } else {
      // excluding the v field
      this.query = this.query.select('-__v')
    }
    return this
  }

  paginate () {
    const page = this.queryString.page * 1 || 1
    const limit = this.queryString.limit * 1 || 15
    const skip = (page - 1) * limit
    // page=2&limit=10, 1-10 page 1, 11-20 page-2, 21-30 page3, 31-40 page 4,
    // explanation of getting the skip
    // for page 3 we want to skip 20 parts so its 3 which is the page minus 1 times the limit(10)

    this.query = this.query.skip(skip).limit(limit)

    return this
  }
}

module.exports = APIfeatures
