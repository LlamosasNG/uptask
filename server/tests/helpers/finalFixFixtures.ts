import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import Project from '../../src/models/Project'
import Task from '../../src/models/Task'
import User from '../../src/models/User'

export const auth = (id: Types.ObjectId) => ({
  Authorization: `Bearer ${jwt.sign({ _id: id }, 'test-secret')}`,
  Origin: 'http://test.local',
})

export async function projectFixture() {
  const [manager, member, outsider] = await User.create([
    { name: 'Manager', email: 'manager@example.com', password: 'secret' },
    { name: 'Member', email: 'member@example.com', password: 'secret' },
    { name: 'Outsider', email: 'outsider@example.com', password: 'secret' },
  ])
  const project = await Project.create({
    projectName: 'Atlas', clientName: 'Client', description: 'Project description',
    manager: manager._id, team: [member._id],
  })
  const task = await Task.create({ name: 'Task', description: 'Task description', project: project._id })
  await Project.updateOne({ _id: project._id }, { $addToSet: { tasks: task._id } })
  return { manager, member, outsider, project, task }
}
