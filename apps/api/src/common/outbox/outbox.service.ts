import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { EntityManager, Repository } from 'typeorm'
import { OutboxEvent } from './outbox-event.entity'

export interface EnqueueEventInput {
  aggregateType: string
  aggregateId: string
  eventType: string
  eventVersion?: number
  payload: Record<string, unknown>
  metadata?: Record<string, unknown>
}

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepository: Repository<OutboxEvent>,
  ) {}

  enqueue(input: EnqueueEventInput, manager?: EntityManager) {
    const repository = manager
      ? manager.getRepository(OutboxEvent)
      : this.outboxRepository

    return repository.save(
      repository.create({
        ...input,
        eventVersion: input.eventVersion ?? 1,
        metadata: input.metadata ?? {},
        publishedAt: null,
        attempts: 0,
        lastError: null,
      }),
    )
  }
}
