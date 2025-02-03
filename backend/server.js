const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Board = require('./models/Board');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://nikhilsaha:KanbanBoard@cluster0.7dpfl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const defaultSections = [
  { id: '1', title: 'Todo', order: 0 },
  { id: '2', title: 'In Progress', order: 1 },
  { id: '3', title: 'Done', order: 2 }
];

app.get('/api/board', async (req, res) => {
  try {
    let board = await Board.findOne();
    if (!board) {
      board = await Board.create({ 
        sections: defaultSections,
        tasks: []
      });
    }
    res.json({ sections: board.sections, tasks: board.tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/sections', async (req, res) => {
  try {
    const board = await Board.findOne();
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const maxOrder = Math.max(...board.sections.map(s => s.order), -1);
    const newSection = {
      id: req.body.id,
      title: req.body.title,
      order: maxOrder + 1
    };

    board.sections.push(newSection);
    await board.save();
    res.status(201).json({ sections: board.sections, tasks: board.tasks });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.patch('/api/sections/:sectionId', async (req, res) => {
  try {
    const board = await Board.findOne();
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const section = board.sections.find(s => s.id === req.params.sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    Object.assign(section, req.body);
    await board.save();
    res.json({ sections: board.sections, tasks: board.tasks });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/sections/:sectionId', async (req, res) => {
  try {
    const board = await Board.findOne();
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

  
    board.sections = board.sections.filter(s => s.id !== req.params.sectionId);
    
    const sectionTitle = board.sections.find(s => s.id === req.params.sectionId)?.title;
    if (sectionTitle) {
      board.tasks = board.tasks.filter(task => 
        task.status !== sectionTitle.toLowerCase().replace(' ', '')
      );
    }

    await board.save();
    res.json({ sections: board.sections, tasks: board.tasks });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const board = await Board.findOne();
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    const maxOrder = board.tasks
      .filter(task => task.status === req.body.status)
      .reduce((max, task) => Math.max(max, task.order || 0), -1);
    
    const newTask = {
      ...req.body,
      order: maxOrder + 1000
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

    if (req.body.status && req.body.status !== task.status) {
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