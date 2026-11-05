import { type Request, type Response } from "express";
import createOrderService from "../services/createOrder.service.ts";
import logger from "../logger.ts";
import { AppDataSource } from "../data-source.ts";
import { Order } from "../entities/Order.ts";

async function getOrders(req: Request, res: Response): Promise<void> {
    try {
        const orderRepository = AppDataSource.getRepository(Order);
        const orders = await orderRepository.find();

        res.status(200).json(orders);
    } catch (error) {
        logger.error(`Error fetching orders: ${error}`);
        res.status(500).json({ message: "Error fetching orders", error });
    }
}

async function createOrder(req: Request, res: Response): Promise<void> {
    try {
        const idempotencyKey = req.headers["x-idempotency-key"] as string;
        const orderData = { idempotencyKey, ...req.body };
        logger.info(`createOrder endpoint accessed with idempotencyKey: ${idempotencyKey}`);

        const order = await createOrderService(orderData);

        res.status(201).json(order);
    } catch (error) {
        logger.error(`Error creating order: ${error}`);
        res.status(500).json({ message: "Error creating order", error });
    }
}

async function orderStatus(req: Request, res: Response): Promise<void> {
    try {
        const { orderId } = req.params;
        const orderRepository = AppDataSource.getRepository(Order);
        const order = await orderRepository.findOne({ where: { id: parseInt(orderId as string) } });

        if (!order) {
            res.status(404).json({ message: "Order not found" });
            return;
        }

        res.status(200).json({ status: order.status });
    } catch (error) {
        logger.error(`Error retrieving order status: ${error}`);
        res.status(500).json({ message: "Error retrieving order status", error });
    }
}

export default { getOrders, createOrder, orderStatus };