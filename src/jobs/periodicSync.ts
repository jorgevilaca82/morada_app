import 'reflect-metadata';
import { AppDataSource } from '../data-source.ts';
import { Order } from '../entities/Order.ts';
import logger from '../logger.ts';
import { syncOrder } from '../services/orderSync.service.ts';
import { In, IsNull } from 'typeorm';

async function main(): Promise<void> {
    await AppDataSource.initialize();
    const orders = await AppDataSource.getRepository(Order).find({
        where: { status: In(["RECEIVED", "FAILED_RETRYABLE"]), syncedAt: IsNull() }
    });
    logger.info({ ordersCount: orders.length }, 'starting periodic sync');

    for (const order of orders) {
        const syncResult = await syncOrder(order);
        logger.info(
            {
                order: order.id,
                status: order.status,
            },
            'order sync finished',
        );
    }

    await AppDataSource.destroy();
}

main().catch((err) => {
    logger.error({ err }, 'periodic sync failed');
    process.exit(1);
});
