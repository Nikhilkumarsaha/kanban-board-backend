const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  assignee: {
    id: String,
    name: String,
    avatar: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
});

const boardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sections: [sectionSchema],
  tasks: [taskSchema]
});

module.exports = mongoose.model('Board', boardSchema);