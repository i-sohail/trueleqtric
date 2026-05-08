// server/models/PaymentSchedule.js
const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  name: String,
  dueDate: Date,
  amount: Number,
  percentage: Number,
  status: {
    type: String,
    enum: ['Pending','Received','Overdue','Waived'],
    default: 'Pending',
  },
  receivedDate: Date,
  notes: String,
}, { _id: true });

const paymentScheduleSchema = new mongoose.Schema({
  scheduleId: { type: String, unique: true },
  spoId: String,
  spoRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesPO' },
  customer: String,
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  totalOrderValue: Number,
  milestones: [milestoneSchema],
  notes: String,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

paymentScheduleSchema.virtual('totalDue').get(function () {
  return this.milestones.reduce((s, m) => s + (m.amount || 0), 0);
});
paymentScheduleSchema.virtual('totalReceived').get(function () {
  return this.milestones.filter(m => m.status === 'Received').reduce((s, m) => s + (m.amount || 0), 0);
});
paymentScheduleSchema.virtual('totalPending').get(function () {
  return this.milestones.filter(m => m.status === 'Pending').reduce((s, m) => s + (m.amount || 0), 0);
});

paymentScheduleSchema.set('toJSON', { virtuals: true });

paymentScheduleSchema.pre('save', async function (next) {
  if (!this.scheduleId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('PaymentSchedule').countDocuments({ scheduleId: new RegExp(`^PS-${year}-`) });
    this.scheduleId = `PS-${year}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PaymentSchedule', paymentScheduleSchema);
