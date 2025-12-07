import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { NATS_SERVICE } from 'src/config/services';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NATS_SERVICE)
    private readonly client: ClientProxy,
  ) { }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productsIds: number[] = createOrderDto.items.map(
        (item) => item.productId,
      );

      const products: any[] = await firstValueFrom(
        this.client.send({ cmd: 'validate_product' },  productsIds ),
      );

      const totalAmout: number = createOrderDto.items.reduce(
        (acc, orderItem) => {
          const price = products.find(
            (product) => product.id === orderItem.productId,
          ).price;

          return acc + price * orderItem.quantity;
        },
        0,
      );

      const totalItems: number = createOrderDto.items.reduce(
        (acc, orderItem) => {
          return acc + orderItem.quantity;
        },
        0,
      );

      const order = await this.prisma.order.create({
        data: {
          totalAmout: totalAmout,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId,
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          name: products.find((product) => product.id === orderItem.productId)
            .name,
          price: orderItem.price,
          quantity: orderItem.quantity,
        })),
      };
    } catch (error) {
      throw new RpcException({
        message: 'Error',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { limit = 5, page = 1, status } = orderPaginationDto;

    const totalItems = await this.prisma.order.count({ where: { status } });
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: await this.prisma.order.findMany({
        where: { status },
        take: limit,
        skip: (page - 1) * limit,
      }),
      pagination: {
        pageSize: limit,
        page: page,
        totalItems: totalItems,
        totalPages: totalPages,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        message: 'Order not found',
        statusCode: HttpStatus.NOT_FOUND,
      });
    }

    const productsIds: number[] = order.OrderItem.map((item) => item.productId);

    const products: any[] = await firstValueFrom(
      this.client.send({ cmd: 'validate_product' },  productsIds ),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        name: products.find((product) => product.id === orderItem.productId)
          .name,
        price: orderItem.price,
        quantity: orderItem.quantity,
      })),
    };
  }

  async changeOrder(changeStatusDto: ChangeStatusDto) {
    const { id, status } = changeStatusDto;

    const order = await this.findOne(changeStatusDto.id);

    if (order.status === status) {
      return order;
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status,
      },
    });
  }
}
