import { Router, Request, Response, NextFunction } from 'express';
import { generateResponse, getPromptTemplates, ChatMessage } from '../services/chatService.js';

export const chatRouter = Router();

// Send message and get response
chatRouter.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: { message: 'message string is required' } });
    }

    const chatHistory: ChatMessage[] = Array.isArray(history) ? history : [];
    const response = await generateResponse(message, chatHistory);

    res.json({ response, timestamp: Date.now() });
  } catch (error) {
    next(error);
  }
});

// Get prompt templates
chatRouter.get('/templates', (_req: Request, res: Response) => {
  const templates = getPromptTemplates();
  res.json(templates);
});
