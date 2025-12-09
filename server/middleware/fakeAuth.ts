import express from 'express'
import type { Request, Response, NextFunction } from 'express'


// Mở rộng Request để có user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      roles: string[];
    };
  }
}

export function fakeAuth(req: Request, res: Response, next: NextFunction) {
  req.user = {
    id: 'local-admin',
    email: 'admin@example.com',
    roles: ['Admin'], // đổi role theo ý muốn: ['QA'], ['QC'], ['User']
  };
  next();
}

