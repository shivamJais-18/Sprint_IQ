import mongoose from 'mongoose';

const bugSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },

    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },

    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Reopened'],
      default: 'Open'
    },

    environment: {
      type: String,
      trim: true,
      maxlength: 500
    },

    stepsToReproduce: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    dueDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Bug = mongoose.model('Bug', bugSchema);

export default Bug;