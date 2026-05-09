import { Router, Request, Response, NextFunction } from 'express';
import { executeCommand, getCommandHistory } from '../services/commandService.js';

export const commandRouter = Router();

// Execute a command
commandRouter.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { command, cwd } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: { message: 'command string is required' } });
    }

    const result = await executeCommand(command, cwd);
    res.json({ ...result, timestamp: Date.now() });
  } catch (error) {
    next(error);
  }
});

// Get command history
commandRouter.get('/history', (_req: Request, res: Response) => {
  const history = getCommandHistory();
  res.json(history);
});
