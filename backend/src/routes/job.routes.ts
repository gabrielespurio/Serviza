import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const jobRouter = Router();
const jobController = new JobController();

// Apenas usuários logados podem interagir com as vagas
jobRouter.use(authMiddleware);

jobRouter.post('/', jobController.createJob);
jobRouter.get('/my', jobController.listMyJobs);
jobRouter.get('/', jobController.listJobs);

export { jobRouter };
