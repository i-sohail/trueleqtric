// server/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: { type: String, unique: true },
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  priority: {
    type: String,
    enum: ['Critical','High','Medium','Low'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Pending','In Progress','Done','Cancelled'],
    default: 'Pending',
  },
  linkedModule: String,
  linkedId: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

taskSchema.pre('save', async function (next) {
  if (!this.taskId) {
    const count = await mongoose.model('Task').countDocuments();
    this.taskId = `TASK-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
