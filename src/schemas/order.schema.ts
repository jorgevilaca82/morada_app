import z from "zod";

export const createOrderSchema = z.object({
    orderNumber: z.string().min(5).max(100),
    customerName: z.string().min(5).max(100),
    totalAmount: z.number().positive(),
    userId: z.number().int().positive(),
});


