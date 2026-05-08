// server/controllers/tasksController.js
const prisma = require('../utils/prisma');
const asyncHandler = require('../middleware/asyncHandler');

exports.getAll = asyncHandler(async (req, res) => {
  const filter = { assignedTo: req.user.id };
  if (req.query.status) filter.status = req.query.status;
  const tasks = await prisma.task.findMany({ 
    where: filter, 
    orderBy: { dueDate: 'asc' } 
  });
  res.json({ data: tasks });
});

exports.create = asyncHandler(async (req, res) => {
  const task = await prisma.task.create({ 
    data: { ...req.body, assignedTo: req.user.id, createdById: req.user.id } 
  });
  res.status(201).json({ data: task, message: 'Task created' });
});

exports.update = asyncHandler(async (req, res) => {
  const task = await prisma.task.update({ 
    where: { id: req.params.id }, 
    data: req.body 
  });
  res.json({ data: task, message: 'Task updated' });
});

exports.remove = asyncHandler(async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ message: 'Task deleted' });
});
