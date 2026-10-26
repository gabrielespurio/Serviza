import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { jobRouter } from './routes/job.routes';
import { userRouter } from './routes/user.routes';


const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/jobs', jobRouter);
app.use('/users', userRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
