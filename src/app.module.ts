import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';
import { CommonModule } from './common/common.module';
import { NatsModule } from './transports/nats.module';


@Module({
  imports: [OrdersModule, CommonModule, NatsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
