import { OrderStatus } from "@prisma/client";

export interface OrderWithProducts {
    OrderItem: {
        name: any;
        price: number;
        quantity: number;
    }[];
    id: string;
    totalAmout: number;
    totalItems: number;
    status: OrderStatus;
    paid: boolean;
    paidAt: Date | null;
    createdAt: Date;
    updateAt: Date;
}