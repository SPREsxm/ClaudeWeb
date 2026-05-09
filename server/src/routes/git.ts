import { Router, Request, Response, NextFunction } from 'express';
import { executeCommand } from '../services/commandService.js';
import { resolveWorkspacePath, isValidPath } from '../utils/pathUtils.js';

export const gitRouter = Router();

gitRouter.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dirPath = (req.query.path as string) || '.';
    const cwd = resolveWorkspacePath(dirPath);

    if (!isValidPath(cwd)) {
      return res.status(400).json({ error: { message: 'Invalid workspace path' } });
    }

    // Get current branch
    const branchResult = await executeCommand('git branch --show-current', cwd);
    const branch = branchResult.stdout.trim();

    // Get status
    const statusResult = await executeCommand('git status --porcelain', cwd);
    const changes = statusResult.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => ({
        status: line.substring(0, 2).trim(),
        file: line.substring(3).trim(),
      }));

    // Count ahead/behind
    let ahead = 0;
    let behind = 0;
    if (branch) {
      try {
        const aheadResult = await executeCommand(
          `git rev-list --count HEAD...@{upstream} --left-right 2>/dev/null || echo "0\t0"`,
          cwd,
        );
        const parts = aheadResult.stdout.trim().split('\t');
        ahead = parseInt(parts[0], 10) || 0;
        behind = parseInt(parts[1], 10) || 0;
      } catch {
        // No upstream configured
      }
    }

    res.json({
      branch: branch || 'unknown',
      changes,
      ahead,
      behind,
      isRepo: branchResult.exitCode === 0,
    });
  } catch (error) {
    next(error);
  }
});
