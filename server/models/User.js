// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId:    { type: String, unique: true },
  name:      { type: String, required: true, trim: true },
  surname:   { type: String, trim: true, default: '' },
  username:  { type: String, required: true, unique: true, trim: true, lowercase: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, minlength: 6, select: false },
  mobile:    { type: String, trim: true, default: '' },
  country:   { type: String, trim: true, default: '' },
  city:      { type: String, trim: true, default: '' },
  region:    { type: String, trim: true, default: '' },
  // Legacy string role kept for backwards compat
  role: {
    type: String,
    enum: ['admin','sales','finance','operations','viewer'],
    default: 'sales',
  },
  // Reference to custom Role document
  roleRef:   { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
  isActive:  { type: Boolean, default: true },
  lastLogin: Date,
  avatar:    String,
  preferences: {
    dashboardKpis:      [String],
    dashboardCharts:    [String],
    analyticsCharts:    [String],
    analyticsChartType: { type: String, default: 'bar' },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.userId) {
    const count = await mongoose.model('User').countDocuments();
    this.userId = `USR-${String(count + 1).padStart(4, '0')}`;
  }
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.index({ name: 'text', username: 'text', email: 'text', mobile: 'text' });

module.exports = mongoose.model('User', userSchema);
