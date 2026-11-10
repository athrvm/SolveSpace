const mongoose = require('mongoose');
const Bookmark = require('../models/bookmark');
const Problem = require('../models/problem');
const validId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

const addBookmark = async (req, res) => {
  const { problemId } = req.params;
  if (!validId(problemId)) return res.status(400).json({ message: 'Invalid problem ID.' });
  try {
    if (!await Problem.exists({ _id: problemId })) return res.status(404).json({ message: 'Problem not found.' });
    await Bookmark.updateOne(
      { userId: req.result._id, problemId },
      { $setOnInsert: { userId: req.result._id, problemId } },
      { upsert: true, runValidators: true }
    );
    return res.status(200).json({ bookmarked: true, problemId });
  } catch (error) {
    // A concurrent add can hit the unique index; the desired state already exists.
    if (error.code === 11000) return res.status(200).json({ bookmarked: true, problemId });
    return res.status(500).json({ message: 'Could not save bookmark.' });
  }
};

const deleteBookmark = async (req, res) => {
  const { problemId } = req.params;
  if (!validId(problemId)) return res.status(400).json({ message: 'Invalid problem ID.' });
  try {
    await Bookmark.deleteOne({ userId: req.result._id, problemId });
    return res.status(200).json({ bookmarked: false, problemId });
  } catch {
    return res.status(500).json({ message: 'Could not remove bookmark.' });
  }
};

const getBookmarks = async (req, res) => {
  const { page = '1', limit = '20', problemId } = req.query;
  const positiveInteger = value => typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
  if (!positiveInteger(page) || !positiveInteger(limit) || Number(limit) > 100 || !Number.isSafeInteger((Number(page) - 1) * Number(limit))) {
    return res.status(400).json({ message: 'Use a positive page and a limit between 1 and 100.' });
  }
  if (problemId !== undefined && !validId(problemId)) return res.status(400).json({ message: 'Invalid problem ID.' });
  try {
    const match = { userId: new mongoose.Types.ObjectId(String(req.result._id)) };
    if (problemId) match.problemId = new mongoose.Types.ObjectId(problemId);
    // Join before counting/paging so deleted problems do not leave empty slots.
    const [result] = await Bookmark.aggregate([
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      { $lookup: { from: Problem.collection.name, localField: 'problemId', foreignField: '_id', as: 'problem', pipeline: [{ $project: { title: 1, difficulty: 1, tags: 1 } }] } },
      { $unwind: '$problem' },
      { $facet: {
        bookmarks: [{ $skip: (Number(page) - 1) * Number(limit) }, { $limit: Number(limit) }, { $project: { _id: 1, problem: 1, createdAt: 1 } }],
        count: [{ $count: 'total' }],
      } },
    ]);
    const total = result?.count[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(limit));
    return res.status(200).json({
      bookmarks: result?.bookmarks || [],
      pagination: { page: Number(page), limit: Number(limit), total, totalPages, hasNextPage: Number(page) < totalPages, hasPreviousPage: Number(page) > 1 },
    });
  } catch {
    return res.status(500).json({ message: 'Could not load bookmarks.' });
  }
};

module.exports = { addBookmark, deleteBookmark, getBookmarks };
