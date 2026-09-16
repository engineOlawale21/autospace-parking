import { Global, Module } from '@nestjs/common'
import { AvailabilityGrpcClient } from './availability-grpc.client'

@Global()
@Module({
  providers: [AvailabilityGrpcClient],
  exports: [AvailabilityGrpcClient],
})
export class AvailabilityModule {}
