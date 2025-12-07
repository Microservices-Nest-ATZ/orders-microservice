import { IsEnum, IsOptional } from "class-validator";
import { OrderStatusList } from "../enum/order.enum";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { OrderStatus } from "@prisma/client";

export class OrderPaginationDto extends PaginationDto {

    @IsOptional()
    @IsEnum(OrderStatusList, {
        message: `Possible values ${Object.values(OrderStatusList).join(', ')}`,
    })
    status?: OrderStatus;
}