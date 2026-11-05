import type { Request, Response, NextFunction, RequestHandler } from 'express';
import z, { ZodError, type ZodObject } from 'zod';

export function validate(schema: ZodObject): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        console.log("validate middleware called with schema:", schema);
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });
            next();
        } catch (error) {
            console.error("Validation error:", error);
            if (error instanceof ZodError) {
                res.status(400).json(z.treeifyError(error));
            } else {
                res.status(400).json({ message: "Validation failed", errors: "Unknown validation error" });
            }
            return;
        }
    };
}