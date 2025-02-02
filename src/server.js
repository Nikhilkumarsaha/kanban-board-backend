const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Board = require('./models/Board');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://nikhilsaha:KanbanBoard@cluster0.7dpfl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/api/tasks', async (req, res) => {
  try {
    let board = await Board.findOne();
    if (!board) {
      board = await Board.create({ tasks: [] });
    }
    res.json(board.tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    let board = await Board.findOne();
    if (!board) {
      board = await Board.create({ tasks: [] });
    }
    
    // Get the maximum order in the current status
    const maxOrder = board.tasks
      .filter(task => task.status === req.body.status)
      .reduce((max, task) => Math.max(max, task.order || 0), -1);
    
    const newTask = {
      ...req.body,
      order: maxOrder + 1000 // Use large intervals for easier reordering
    };
    
    board.tasks.push(newTask);
    await board.save();
    res.status(201).json(board.tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/tasks/:taskId', async (req, res) => {
  try {
    const board = await Board.findOne();
    const task = board.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If status is changing, handle reordering
    if (req.body.status && req.body.status !== task.status) {
      // Reorder tasks in the new status
      const tasksInNewStatus = board.tasks.filter(t => t.status === req.body.status);
      tasksInNewStatus.forEach((t, index) => {
        t.order = index * 1000;
      });
    }

    Object.assign(task, req.body);
    await board.save();
    res.json(board.tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/tasks/:taskId', async (req, res) => {
  try {
    const board = await Board.findOne();
    const taskToDelete = board.tasks.id(req.params.taskId);
    if (!taskToDelete) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Get all tasks in the same status and reorder them
    const tasksInSameStatus = board.tasks.filter(task => 
      task.status === taskToDelete.status && task._id.toString() !== req.params.taskId
    );
    
    tasksInSameStatus.sort((a, b) => a.order - b.order);
    tasksInSameStatus.forEach((task, index) => {
      task.order = index * 1000;
    });

    board.tasks.pull(req.params.taskId);
    await board.save();
    res.json(board.tasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});