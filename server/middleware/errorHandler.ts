import type { Request, Response, NextFunction } from 'express'

export class ResponseError extends Error {
    status?: number;
    
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ResponseError';
        this.status = status;
    }
}

const errorHandler = (error: ResponseError, req: Request, res: Response, next: NextFunction) => {
    const status = error.status ||  500
    const message = error.message || "Internal server error"
    res.status(status).send(message)
}

export default errorHandler