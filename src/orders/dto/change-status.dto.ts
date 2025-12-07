import { IsEnum, IsOptional, IsUUID } from "class-validator";
import { OrderStatusList } from "../enum/order.enum";
import { OrderStatus } from "@prisma/client";


export class ChangeStatusDto {

    @IsUUID()
    id: string;

    @IsEnum(OrderStatusList, {
        message: `Possible values ${Object.values(OrderStatusList).join(', ')}`,
    })
    status: OrderStatus;
}