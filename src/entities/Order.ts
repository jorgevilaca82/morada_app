import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class Order {

    @PrimaryGeneratedColumn()
    id: number

    @Column({type: "varchar", length: 100, unique: true})
    idempotencyKey: string

    @Column({type: "varchar", length: 100})
    orderNumber: string

    @Column({type: "varchar", length: 100})
    customerName: string

    @Column({type: "decimal", precision: 10, scale: 2})
    totalAmount: number

    @Column({type: "int"})
    userId: number

    @Column({type: "varchar", length: 20})
    status: "RECEIVED" | "PROCESSING" | "COMPLETED" | "FAILED_RETRYABLE" | "FAILED_PERMANENT" | "UNKNOWN" = "RECEIVED"

    @Column({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    createdAt: Date = new Date()

    @Column({type: "timestamp", default: () => "CURRENT_TIMESTAMP"})
    updatedAt: Date = new Date()

    @Column({type: "timestamp", nullable: true})
    syncedAt: Date | null = null

}