import "reflect-metadata"
import { DataSource } from "typeorm"
import { Order } from "./entities/Order.ts"

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
//   url: "postgresql://postgres:postgres@db:5432/morada_db",
  entities: [Order],
  migrations: [],
  synchronize: true,
  logging: false,
});

