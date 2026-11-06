import { AppDataSource } from "../data-source.ts";
import { Order } from "../entities/Order.ts";
import { ErpAdapter } from "../external/erp.adapter.ts";
import logger from "../logger.ts";

export async function syncOrder(order: Order): Promise<void> {
    try {
        const erpExperience = "timeout"; // You can change this to "error" or "timeout" to simulate different scenarios
        const erpAdapter = new ErpAdapter(erpExperience, 1500);
        await erpAdapter.syncOrder({
            orderId: order.orderNumber,
            amount: order.totalAmount,
        });
        AppDataSource.getRepository(Order).merge(order, { status: "PROCESSING", syncedAt: new Date() });
        await AppDataSource.getRepository(Order).save(order);

        logger.info(`Order ${order.orderNumber} synchronized successfully with ERP.`);
    } catch (error) {

        handleError(error, order);

        logger.error(
            { err: error, orderId: order.orderNumber },
            `Failed to synchronize order ${order.orderNumber} with ERP.`,
        );
    }
}

function handleError(error: unknown, order: Order): void {
    const orderRepository = AppDataSource.getRepository(Order);
    if (error instanceof Error) {
        if (error.name === "NetworkError" || error.name === "TimeoutError") {
            orderRepository.merge(order, { status: "FAILED_RETRYABLE" });
            logger.warn(
                { err: error, orderId: order.orderNumber },
                `Retryable error occurred while synchronizing order ${order.orderNumber} with ERP.`,
            );
        } else {
            orderRepository.merge(order, { status: "FAILED_PERMANENT" });
            logger.error(
                { err: error, orderId: order.orderNumber },
                `Permanent error occurred while synchronizing order ${order.orderNumber} with ERP.`,
            );
        }
    } else {
        orderRepository.merge(order, { status: "FAILED_PERMANENT" });
        logger.error(
            { err: error, orderId: order.orderNumber },
            `Unknown error occurred while synchronizing order ${order.orderNumber} with ERP.`,
        );
    }
}