
import logger from "../logger.ts";
import { type Request, type Response, type NextFunction, type RequestHandler } from "express";

export function checkIdempotencyKey(req: Request, res: Response, next: NextFunction): void {
    const idempotencyKey = req.headers['x-idempotency-key'];

    if (!idempotencyKey) {
        res.status(400).json({ message: "Missing Idempotency-Key header" });
        logger.warn("Missing Idempotency-Key header in request");
        return;
    }

    // Here you would typically check if the idempotency key has already been used.
    // For demonstration purposes, we'll just log it and proceed.
    logger.info(`Received Idempotency-Key: ${idempotencyKey}`);

    next();
}