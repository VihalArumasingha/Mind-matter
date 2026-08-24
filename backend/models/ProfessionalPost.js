import mongoose from 'mongoose';

const professionalPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    categories: [{
      type: String,
      trim: true,
    }],
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorType: {
      type: String,
      enum: ['user', 'professional', 'volunteer'],
      default: 'professional',
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      userName: String,
      content: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    status: {
      type: String,
      enum: ['published', 'archived'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

// Explicitly set collection name to ensure it uses 'professionalposts'
const ProfessionalPost = mongoose.model('ProfessionalPost', professionalPostSchema, 'professionalposts');

export default ProfessionalPost;