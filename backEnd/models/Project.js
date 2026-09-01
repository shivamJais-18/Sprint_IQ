import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    projectKey: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    status: {
      type: String,
      enum: ['Planning', 'Active', 'Completed', 'Archived'],
      default: 'Planning'
    },

    startDate: {
      type: Date
    },

    endDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;