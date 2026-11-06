import { QueryFailedError } from "typeorm";
import { AppDataSource } from "../data-source.ts";
import { Order } from "../entities/Order.ts";
import logger from "../logger.ts";

type CreateOrderData = {
    idempotencyKey: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    userId: number;
};

function isUniqueViolation(error: unknown): boolean {
    return (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code === "23505"
    );
}

export default async function createOrderService(orderData: CreateOrderData): Promise<Order> {
    logger.info("createOrderService called with orderData:");
    logger.info(orderData);

    try {
        return await AppDataSource.transaction(async (transactionalEntityManager) => {
            const orderRepository = transactionalEntityManager.getRepository(Order);

            const previousOrder = await orderRepository.findOne({
                where: { idempotencyKey: orderData.idempotencyKey },
            });
            if (previousOrder) {
                logger.info(
                    `Order with idempotencyKey: ${orderData.idempotencyKey} already exists. Returning existing order.`,
                );
                return previousOrder;
            }

            const order = new Order();
            order.idempotencyKey = orderData.idempotencyKey;
            order.orderNumber = orderData.orderNumber;
            order.customerName = orderData.customerName;
            order.totalAmount = orderData.totalAmount;
            order.userId = orderData.userId;
            // order.status = "pending";

            const result = await orderRepository.save(order);

            logger.info(`Order created successfully with idempotencyKey: ${order.idempotencyKey}`);

            return result;
        });
    } catch (error) {
        // Concurrent creates with the same key can both miss the pre-check;
        // the unique constraint then rejects the loser — return the winner's row.
        if (isUniqueViolation(error)) {
            const existingOrder = await AppDataSource.getRepository(Order).findOne({
                where: { idempotencyKey: orderData.idempotencyKey },
            });
            if (existingOrder) {
                logger.info(
                    `Order with idempotencyKey: ${orderData.idempotencyKey} won the race. Returning existing order.`,
                );
                return existingOrder;
            }
        }
        throw error;
    }
}
