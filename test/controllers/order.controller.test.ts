jest.mock("../../src/logger.ts", () => {
    return {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    };
});

jest.mock("../../src/data-source.ts", () => {
    const actualDataSource = jest.requireActual("../../src/data-source.ts");
    return {
        ...actualDataSource,
        AppDataSource: {
            ...actualDataSource.AppDataSource,
            initialize: jest.fn().mockResolvedValue(undefined),
            destroy: jest.fn().mockResolvedValue(undefined),
            isInitialized: true,
            getRepository: jest.fn().mockReturnValue({
                clear: jest.fn().mockResolvedValue(undefined),
                count: jest.fn().mockResolvedValue(0),
            }),
            transaction: jest.fn().mockImplementation(async (callback) => {
                return await callback({
                    save: jest.fn().mockResolvedValue(undefined),
                    merge: jest.fn().mockReturnValue(undefined),
                });
            }),
        },
    };
});

import { AppDataSource } from "../../src/data-source.ts";
import { Order } from "../../src/entities/Order.ts";

// const orderRepo = {
//   create: jest.fn((values: object) => values),
//   save: jest.fn(async (values: object) => values),
//   findOne: jest.fn(),
// };

// beforeEach(() => {
//   jest.clearAllMocks();
//   (AppDataSource.getRepository as jest.Mock).mockImplementation((entity) => {
//     if (entity === Order) return orderRepo;
//     throw new Error('unexpected entity');
//   });
//   (AppDataSource.transaction as jest.Mock).mockImplementation(async (cb: Function) =>
//     cb({ getRepository: AppDataSource.getRepository }),
//   );
// });

// describe("OrderController", () => {
//   beforeAll(async () => {
//     await AppDataSource.initialize();
//   });

//   afterAll(async () => {
//     if (AppDataSource.isInitialized) {
//       await AppDataSource.destroy();
//     }
//   });

//   describe("POST /orders", () => {
//     it("creates an order when the idempotency key is new", async () => {
//       const response = await request(app)
//         .post("/orders")
//         .set("x-idempotency-key", "create:unique-key-1")
//         .send(orderPayload);

//       expect(response.status).toBe(201);
//       expect(response.body).toMatchObject({
//         idempotencyKey: "create:unique-key-1",
//         orderNumber: orderPayload.orderNumber,
//         customerName: orderPayload.customerName,
//         userId: orderPayload.userId,
//         status: "pending",
//       });
//       expect(response.body.id).toEqual(expect.any(Number));
//       expect(Number(response.body.totalAmount)).toBe(orderPayload.totalAmount);

//       const count = await AppDataSource.getRepository(Order).count();
//       expect(count).toBe(1);
//     });

//     it("rejects requests missing the idempotency key", async () => {
//       const response = await request(app).post("/orders").send(orderPayload);

//       expect(response.status).toBe(400);
//       expect(response.body).toEqual({ message: "Missing Idempotency-Key header" });
//     });

//     it("rejects invalid order payloads", async () => {
//       const response = await request(app)
//         .post("/orders")
//         .set("x-idempotency-key", "create:invalid-body")
//         .send({
//           orderNumber: "x",
//           customerName: "y",
//           totalAmount: -1,
//           userId: 0,
//         });

//       expect(response.status).toBe(400);
//     });
//   });
// });