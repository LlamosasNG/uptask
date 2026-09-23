import mongoose, { Document, Schema, Types } from 'mongoose'
import Note from './Note'

const taskStatus = {
  PENDING: 'pending',
  ON_HOLD: 'onHold',
  IN_PROGRESS: 'inProgress',
  UNDER_REVIEW: 'underReview',
  COMPLETED: 'completed',
} as const

export type TaskStatus = (typeof taskStatus)[keyof typeof taskStatus]

const taskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export type TaskPriority = (typeof taskPriority)[keyof typeof taskPriority]

export interface ITask extends Document {
  name: string
  description: string
  project: Types.ObjectId
  status: TaskStatus
  assignee: Types.ObjectId | null
  dueDate: Date | null
  priority: TaskPriority
  completedBy: {
    user: Types.ObjectId
    status: TaskStatus
    createdAt?: Date
  }[]
  notes: Types.ObjectId[]
}

const TaskSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: Types.ObjectId,
      ref: 'Project',
    },
    assignee: {
      type: Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: Object.values(taskPriority),
      default: taskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(taskStatus),
      default: taskStatus.PENDING,
    },
    completedBy: [
      {
        user: {
          type: Types.ObjectId,
          ref: 'User',
          default: null,
        },
        status: {
          type: String,
          enum: Object.values(taskStatus),
          default: taskStatus.PENDING,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: [
      {
        type: Types.ObjectId,
        ref: 'Note',
      },
    ],
  },
  { timestamps: true }
)

//Middleware
TaskSchema.pre('deleteOne', { document: true }, async function () {
  const taskId = this._id
  if (!taskId) return
  await Note.deleteMany({ task: taskId })
})

const Task = mongoose.model<ITask>('Task', TaskSchema)
export default Task
