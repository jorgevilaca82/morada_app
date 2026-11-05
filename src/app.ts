import express, { type Express, type Request, type Response } from "express";
import { pinoHttp } from "pino-http";
import logger from "./logger.ts";


async function createServer(): Promise<Express> {
  const app: Express = express();

  // enable for logging HTTP requests and responses
  // app.use(pinoHttp({ logger }));

  app.use(express.json());
  app.use("/orders", (await import("./routes/order.routes.ts")).default);

  app.get("/", (req: Request, res: Response) => {
    logger.info("Root endpoint accessed");
    res.send("Hello World!");
    logger.info("Response sent for root endpoint");
  });

  return app;
}

export default createServer;
