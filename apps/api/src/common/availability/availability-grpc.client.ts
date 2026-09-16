import { Injectable, OnModuleDestroy } from '@nestjs/common'
import {
  Client,
  Metadata,
  credentials,
  loadPackageDefinition,
} from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import { join } from 'path'

type AvailabilityClient = Client & {
  getAvailability(
    request: Record<string, unknown>,
    metadata: Metadata,
    options: { deadline: Date },
    callback: (error: Error | null, response?: unknown) => void,
  ): void
}

@Injectable()
export class AvailabilityGrpcClient implements OnModuleDestroy {
  private readonly client: AvailabilityClient
  private readonly deadlineMs = 2000

  constructor() {
    const definition = loadSync(
      join(
        process.cwd(),
        '../../libs/contracts/proto/autospace/availability/v1/availability.proto',
      ),
      {
        includeDirs: [join(process.cwd(), '../../libs/contracts/proto')],
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    )
    const loaded = loadPackageDefinition(definition) as Record<string, unknown>
    const packageDefinition = loaded.autospace as Record<string, unknown>
    const availability = packageDefinition.availability as Record<
      string,
      unknown
    >
    const version = availability.v1 as Record<string, unknown>
    const Service = version.AvailabilityService as new (
      address: string,
      channelCredentials: ReturnType<typeof credentials.createInsecure>,
    ) => AvailabilityClient

    this.client = new Service(
      process.env.AVAILABILITY_GRPC_ADDRESS ?? 'localhost:9091',
      credentials.createInsecure(),
    )
  }

  getAvailability(
    parkingSpaceIds: string[],
    correlationId?: string,
  ): Promise<unknown> {
    const metadata = new Metadata()
    if (correlationId) metadata.set('x-correlation-id', correlationId)

    return new Promise((resolve, reject) => {
      this.client.getAvailability(
        { parkingSpaceIds },
        metadata,
        { deadline: new Date(Date.now() + this.deadlineMs) },
        (error, response) => (error ? reject(error) : resolve(response)),
      )
    })
  }

  onModuleDestroy(): void {
    this.client.close()
  }
}
