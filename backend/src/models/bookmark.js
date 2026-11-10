const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'problem', required: true },
}, { timestamps: true });

bookmarkSchema.index({ userId: 1, problemId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model('bookmark', bookmarkSchema);
