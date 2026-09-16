import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { Kafka, Producer } from 'kafkajs'
import { OutboxEvent } from './outbox-event.entity'
import { OutboxPublisher } from './outbox-relay.service'

@Injectable()
export class KafkaOutboxPublisher implements OutboxPublisher, OnModuleDestroy {
  private readonly logger = new Logger(KafkaOutboxPublisher.name)
  private readonly producer: Producer
  private connection?: Promise<void>

  constructor() {
    const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean)

    this.producer = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? 'autospace-api-outbox-relay',
      brokers,
    }).producer()
  }

  async publish(event: OutboxEvent): Promise<void> {
    await this.connect()

    const topic = this.topicFor(event)
    await this.producer.send({
      topic,
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify({
            id: event.id,
            type: event.eventType,
            version: event.eventVersion,
            occurredAt: event.occurredAt.toISOString(),
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            payload: event.payload,
            metadata: event.metadata,
          }),
        },
      ],
    })
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.connection) return

    try {
      await this.connection
      await this.producer.disconnect()
    } catch (error) {
      this.logger.warn(`Kafka producer disconnect failed: ${String(error)}`)
    }
  }

  private async connect(): Promise<void> {
    this.connection ??= this.producer.connect().catch((error) => {
      this.connection = undefined
      throw error
    })
    await this.connection
  }

  private topicFor(event: OutboxEvent): string {
    const topic = event.metadata?.topic
    return typeof topic === 'string' && topic.length > 0
      ? topic
      : process.env.KAFKA_DEFAULT_TOPIC ?? 'platform.events.v1'
  }
}
