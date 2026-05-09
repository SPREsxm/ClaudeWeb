import { Router, Request, Response, NextFunction } from 'express';
import { listSessions, loadSession, deleteSession } from '../services/sessionStore.js';

export const sessionsRouter = Router();

// List all saved sessions (summary only)
sessionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = req.query.workspace as string | undefined;
    const sessions = await listSessions(workspace);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// Get full session with messages
sessionsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = req.query.workspace as string | undefined;
    const session = await loadSession(req.params.id, workspace);
    if (!session) {
      return res.status(404).json({ error: { message: 'Session not found' } });
    }
    res.json(session);
  } catch (error) {
    next(error);
  }
});

// Delete a session
sessionsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspace = req.query.workspace as string | undefined;
    const deleted = await deleteSession(req.params.id, workspace);
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Session not found' } });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
