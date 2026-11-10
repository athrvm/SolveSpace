const Problem = require('../models/problem');

module.exports = async function getAllProblem(req, res) {
  const { page = '1', limit = '20', search = '', difficulty = 'all', tag = 'all', status = 'all' } = req.query;
  const integer = value => typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
  if (!integer(page) || !integer(limit) || Number(limit) > 100 || !Number.isSafeInteger((Number(page) - 1) * Number(limit))) {
    return res.status(400).json({ message: 'Use a positive page and a limit between 1 and 100.' });
  }
  if (typeof search !== 'string' || search.length > 200 || !['all', 'easy', 'medium', 'hard'].includes(difficulty) || !['all', 'array', 'linkedList', 'graph', 'dp'].includes(tag) || !['all', 'solved', 'unsolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid problem filters.' });
  }
  const filter = {};
  if (search.trim()) filter.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (difficulty !== 'all') filter.difficulty = difficulty;
  if (tag !== 'all') filter.tags = tag;
  const solved = req.result.problemSolved || [];
  if (status !== 'all') filter._id = { [status === 'solved' ? '$in' : '$nin']: solved };
  try {
    const [problems, total, counts, topics] = await Promise.all([
      Problem.find(filter).select('_id title difficulty tags').sort({ _id: 1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).lean(),
      Problem.countDocuments(filter),
      Problem.aggregate([{ $group: { _id: '$difficulty', total: { $sum: 1 } } }]),
      Problem.distinct('tags'),
    ]);
    const difficulties = { easy: 0, medium: 0, hard: 0 };
    for (const count of counts) difficulties[count._id] = count.total;
    const totalPages = Math.ceil(total / Number(limit));
    return res.status(200).json({
      problems,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages, hasNextPage: Number(page) < totalPages, hasPreviousPage: Number(page) > 1 },
      summary: { total: counts.reduce((sum, count) => sum + count.total, 0), difficulties, topics: topics.sort() },
    });
  } catch {
    return res.status(500).json({ message: 'Could not load problems.' });
  }
};
