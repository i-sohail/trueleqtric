// server/controllers/tasksController.js
const Task = require('../models/Task');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const filter = { assignedTo: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const tasks = await Task.find(filter).sort({ dueDate: 1 });
  res.json({ data: tasks });
});

exports.create = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...req.body, assignedTo: req.user._id, createdBy: req.user._id });
  res.status(201).json({ data: task, message: 'Task created' });
});

exports.update = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ data: task, message: 'Task updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Task deleted' });
});
