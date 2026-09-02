import { Router } from 'express'
import { body, param } from 'express-validator'
import { NoteController } from '../controllers/NoteController'
import { ProjectController } from '../controllers/ProjectController'
import { TaskController } from '../controllers/TaskController'
import { TeamController } from '../controllers/TeamController'
import { authenticate } from '../middleware/auth'
import { requireProjectManager, requireProjectMember } from '../middleware/projectAccess'
import { projectExists } from '../middleware/project'
import {
  taskBelongsToProject,
  taskExists,
} from '../middleware/task'
import { handleInputErrors } from '../middleware/validation'

const router: Router = Router()

const taskPlanningValidators = [
  body('assignee')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('ID de usuario no válido')
    .bail()
    .custom((assignee, { req }) => {
      const isManager = req.project?.manager.toString() === assignee
      const isMember = req.project?.team.some((member) => member.toString() === assignee)
      if (isManager || isMember) return true
      throw new Error('El usuario asignado debe pertenecer al proyecto')
    }),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('La fecha de vencimiento no es válida'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('La prioridad no es válida'),
]

/** Projects */
router.use(authenticate)
router.post(
  '/',
  body('projectName')
    .notEmpty()
    .withMessage('El nombre del proyecto es obligatorio'),
  body('clientName')
    .notEmpty()
    .withMessage('El nombre del cliente es obligatorio'),
  body('description').notEmpty().withMessage('La descripción es obligatoria'),
  handleInputErrors,
  ProjectController.createProjects
)

router.get('/', ProjectController.getAllProjects)
router.get(
  '/:id',
  param('id').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  projectExists,
  requireProjectMember,
  ProjectController.getProjectById
)

router.param('projectId', projectExists)
router.put(
  '/:projectId',
  param('projectId').isMongoId().withMessage('ID no válido'),
  body('projectName')
    .notEmpty()
    .withMessage('El nombre del proyecto es obligatorio'),
  body('clientName')
    .notEmpty()
    .withMessage('El nombre del cliente es obligatorio'),
  body('description').notEmpty().withMessage('La descripción es obligatoria'),
  handleInputErrors,
  requireProjectManager,
  ProjectController.updateProject
)

router.delete(
  '/:projectId',
  param('projectId').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  requireProjectManager,
  ProjectController.deleteProject
)

/** Tasks */
router.param('taskId', taskExists)
router.param('taskId', taskBelongsToProject)

router.post(
  '/:projectId/tasks',
  requireProjectManager,
  body('name').notEmpty().withMessage('El nombre de la tarea es obligatorio'),
  body('description').notEmpty().withMessage('La descripción es obligatoria'),
  taskPlanningValidators,
  handleInputErrors,
  TaskController.createTask
)

router.get(
  '/:projectId/tasks',
  requireProjectMember,
  handleInputErrors,
  TaskController.getProjectTasks
)

router.get(
  '/:projectId/tasks/:taskId',
  requireProjectMember,
  param('taskId').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  TaskController.getTaksById
)

router.put(
  '/:projectId/tasks/:taskId',
  requireProjectManager,
  param('taskId').isMongoId().withMessage('ID no válido'),
  body('name').notEmpty().withMessage('El nombre de la tarea es obligatorio'),
  body('description').notEmpty().withMessage('La descripción es obligatoria'),
  taskPlanningValidators,
  handleInputErrors,
  TaskController.updateTask
)

router.delete(
  '/:projectId/tasks/:taskId',
  requireProjectManager,
  param('taskId').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  TaskController.deleteTask
)

router.post(
  '/:projectId/tasks/:taskId/status',
  requireProjectMember,
  param('taskId').isMongoId().withMessage('ID no válido'),
  body('status')
    .isIn(['pending', 'onHold', 'inProgress', 'underReview', 'completed'])
    .withMessage('Estado no válido'),
  handleInputErrors,
  TaskController.updateStatus
)

/** Teams */
router.post(
  '/:projectId/team/find',
  requireProjectManager,
  body('email').isEmail().toLowerCase().withMessage('El email no es válido'),
  handleInputErrors,
  TeamController.findMemberByEmail
)

router.get('/:projectId/team', requireProjectMember, TeamController.getProjectTeam)

router.post(
  '/:projectId/team',
  requireProjectManager,
  body('id').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  TeamController.addMemberById
)

router.delete(
  '/:projectId/team/:userId',
  requireProjectManager,
  param('userId').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  TeamController.removeMemberById
)

// Routes for notes
router.post(
  '/:projectId/tasks/:taskId/notes',
  requireProjectMember,
  body('content')
    .notEmpty()
    .withMessage('El contenido de la nota es obligatorio'),
  handleInputErrors,
  NoteController.createNote
)

router.get(
  '/:projectId/tasks/:taskId/notes',
  requireProjectMember,
  handleInputErrors,
  NoteController.getTaskNotes
)

router.delete(
  '/:projectId/tasks/:taskId/notes/:noteId',
  requireProjectMember,
  param('noteId').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  NoteController.deleteNote
)

export default router
