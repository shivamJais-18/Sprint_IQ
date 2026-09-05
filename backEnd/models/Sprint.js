import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    goal: {
      type: String,
      trim: true,
      maxlength: 500
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'Completed'],
      default: 'Planning'
    }
  },
  { timestamps: true }
);

const Sprint = mongoose.model('Sprint', sprintSchema);

export default Sprint;
