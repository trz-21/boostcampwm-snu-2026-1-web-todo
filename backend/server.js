/**
 * server.js
 * Todo REST API 서버 (Express + MongoDB Atlas)
 *
 * GET    /todos       - 전체 목록 조회
 * POST   /todos       - 새 todo 추가
 * PATCH  /todos/:id   - 완료 토글
 * DELETE /todos/:id   - 삭제
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/* ─── Mongoose Todo 스키마 ─── */
const todoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    createdAt: { type: Number, default: Date.now },
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

const Todo = mongoose.model('Todo', todoSchema);

/* ─── GET /todos ─── */
app.get('/todos', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

/* ─── POST /todos ─── */
app.post('/todos', async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    const todo = await Todo.create({ text: text.trim() });
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

/* ─── PATCH /todos/:id (완료 토글) ─── */
app.patch('/todos/:id', async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ error: 'todo not found' });
    }

    todo.done = !todo.done;
    await todo.save();
    res.json(todo);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'todo not found' });
    }
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

/* ─── DELETE /todos/:id ─── */
app.delete('/todos/:id', async (req, res) => {
  try {
    const result = await Todo.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({ error: 'todo not found' });
    }

    res.status(204).send();
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ error: 'todo not found' });
    }
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

/* ─── MongoDB 연결 후 서버 시작 ─── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Todo API server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
