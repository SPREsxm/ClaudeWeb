import { Router, Request, Response, NextFunction } from 'express';
import { setWorkspaceRoot, getWorkspaceRoot } from '../utils/pathUtils.js';
import { listDirectory } from '../services/fileService.js';
import fs from 'fs/promises';

export const workspaceRouter = Router();

// Set workspace root
workspaceRouter.post('/set', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { path: workspacePath } = req.body;
    if (!workspacePath || typeof workspacePath !== 'string') {
      return res.status(400).json({ error: { message: 'path string is required' } });
    }

    // Verify the path exists
    try {
      const stat = await fs.stat(workspacePath);
      if (!stat.isDirectory()) {
        return res.status(400).json({ error: { message: 'Path is not a directory' } });
      }
    } catch {
      return res.status(400).json({ error: { message: 'Directory does not exist or is not accessible' } });
    }

    setWorkspaceRoot(workspacePath);
    const files = await listDirectory('.');

    res.json({
      success: true,
      workspacePath,
      files,
    });
  } catch (error) {
    next(error);
  }
});

// Get current workspace info
workspaceRouter.get('/info', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const root = getWorkspaceRoot();
    let fileCount = 0;
    try {
      const files = await listDirectory('.');
      fileCount = files.length;
    } catch {
      // Directory might not be accessible
    }

    res.json({
      root,
      fileCount,
      platform: process.platform,
      nodeVersion: process.version,
    });
  } catch (error) {
    next(error);
  }
});
