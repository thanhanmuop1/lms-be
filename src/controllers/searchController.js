const search = require('../models/search');

const searchCourses = async (req, res) => {
  try {
    const searchParams = {
      keyword: req.query.keyword,
      teacherId: req.query.teacher,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: req.query.page,
      limit: req.query.limit
    };

    const result = await search.searchCourses(searchParams);
    res.json(result);
  } catch (error) {
    console.error('Error searching courses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  searchCourses,
}; 