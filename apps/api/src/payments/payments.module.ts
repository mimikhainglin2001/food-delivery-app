import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [AuthModule, GatewayModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
