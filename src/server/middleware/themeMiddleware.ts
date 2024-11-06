import { Response, NextFunction } from 'express';
import { RequestWithTheme } from '../types/Requests';

const themeMiddleware = (req: RequestWithTheme, res: Response, next: NextFunction) => {
    req.theme = req.cookies['theme'] || 'dark';
    next();
};

export default themeMiddleware;
