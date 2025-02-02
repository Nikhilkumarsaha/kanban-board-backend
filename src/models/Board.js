const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['todo', 'inprogress', 'done'],
    default: 'todo'
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

const boardSchema = new mongoose.Schema({
  tasks: [taskSchema]
});

module.exports = mongoose.model('Board', boardSchema);