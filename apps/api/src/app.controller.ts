import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Query,
} from '@nestjs/common'
import { AppService } from './app.service'
import { AvailabilityGrpcClient } from './common/availability/availability-grpc.client'

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly availability: AvailabilityGrpcClient,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    }
  }

  @Get('availability')
  getAvailability(
    @Query('parkingSpaceIds') parkingSpaceIds: string | string[] | undefined,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const ids = (
      Array.isArray(parkingSpaceIds)
        ? parkingSpaceIds
        : parkingSpaceIds?.split(',') ?? []
    )
      .map((id) => id.trim())
      .filter(Boolean)

    if (ids.length === 0) {
      throw new BadRequestException('parkingSpaceIds is required')
    }
    return this.availability.getAvailability(ids, correlationId)
  }
}
