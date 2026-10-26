import { Router } from 'express';
import multer from 'multer';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const userRouter = Router();
const userController = new UserController();

// Configuração do multer em memória (já que vamos mandar direto pro Supabase)
const upload = multer({ storage: multer.memoryStorage() });

userRouter.use(authMiddleware);

userRouter.get('/profile', userController.getProfile);
userRouter.put('/profile', userController.updateProfile);
userRouter.put('/avatar', upload.single('avatar'), userController.uploadAvatar);

export { userRouter };
