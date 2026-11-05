import { Router } from "express";
import z from "zod";
import { createOrderSchema } from "../schemas/order.schema.ts";
import { checkIdempotencyKey } from "../middlewares/checkIdempotencyKey.ts";
import { validate } from "../middlewares/validate.middleware.ts";
import controller from "../controllers/order.controller.ts";

const router: Router = Router();

const createOrderValidationSchema = z.object({
    body: createOrderSchema
});

router.post("/", checkIdempotencyKey,
    validate(createOrderValidationSchema),
    controller.createOrder);

router.get("/", controller.getOrders);
router.get("/:orderId/status", controller.orderStatus);

export default router;

