import { Inject, Injectable, Logger } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { OutboxEvent } from './outbox-event.entity'

export interface OutboxPublisher {
  publish(event: OutboxEvent): Promise<void>
}

export const OUTBOX_PUBLISHER = Symbol('OUTBOX_PUBLISHER')

@Injectable()
export class OutboxRelayService {
  private readonly logger = new Logger(OutboxRelayService.name)
  private readonly batchSize = 50

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
    @Inject(OUTBOX_PUBLISHER)
    private readonly publisher: OutboxPublisher,
  ) {}

  async publishBatch(): Promise<number> {
    const events = await this.dataSource.transaction(async (manager) => {
      return manager
        .getRepository(OutboxEvent)
        .createQueryBuilder('event')
        .setLock('pessimistic_write')
        .setOnLocked('skip_locked')
        .where('event.published_at IS NULL')
        .orderBy('event.occurred_at', 'ASC')
        .take(this.batchSize)
        .getMany()
    })

    let published = 0
    for (const event of events) {
      try {
        await this.publisher.publish(event)
        await this.outboxRepository.update(event.id, {
          publishedAt: new Date(),
          attempts: event.attempts + 1,
          lastError: null,
        })
        published += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await this.outboxRepository.increment({ id: event.id }, 'attempts', 1)
        await this.outboxRepository.update(event.id, { lastError: message })
        this.logger.error(
          `Failed to publish outbox event ${event.id}: ${message}`,
        )
      }
    }

    return published
  }
}
