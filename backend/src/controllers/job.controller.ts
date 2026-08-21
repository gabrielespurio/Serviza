import { Request, Response } from 'express';
import { JobService } from '../services/job.service';

const jobService = new JobService();

export class JobController {
  async createJob(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }

      const job = await jobService.createJob(userId, req.body);
      return res.status(201).json(job);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listJobs(req: Request, res: Response) {
    try {
      const jobs = await jobService.listJobs();
      return res.status(200).json(jobs);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listMyJobs(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado.' });
      }
      const jobs = await jobService.listMyJobs(userId);
      return res.status(200).json(jobs);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
