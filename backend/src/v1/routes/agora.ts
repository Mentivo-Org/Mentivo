import { Router } from 'express'
import { generateAgoraToken } from '../controllers/agoraTokenGenerator.ts'

const app = Router();

app.post('/token/:user_id/:mentor_id', generateAgoraToken);

export default app;