import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllClaudeSessions,
  getActiveClaudeSessions,
  getSessionMessages,
} from '../services/claudeSessionService.js';
import { getWorkspaceRoot } from '../utils/pathUtils.js';

export const claudeSessionsRouter = Router();

// List all Claude Code sessions
claudeSessionsRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await getAllClaudeSessions();
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// Get active (running) Claude Code sessions
claudeSessionsRouter.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await getActiveClaudeSessions();
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// Get full messages for a session
claudeSessionsRouter.get('/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectPath = (req.query.project as string) || getWorkspaceRoot();
    const messages = await getSessionMessages(req.params.id, projectPath);
    res.json({
      sessionId: req.params.id,
      messages,
    });
  } catch (error) {
    next(error);
  }
});
