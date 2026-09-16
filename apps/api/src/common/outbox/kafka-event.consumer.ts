import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Consumer, Kafka, EachMessagePayload } from 'kafkajs'
import { Repository } from 'typeorm'
import { ConsumedEvent } from './consumed-event.entity'

export type KafkaEventHandler = (
  event: Record<string, unknown>,
) => Promise<void>

@Injectable()
export class KafkaEventConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaEventConsumer.name)
  private readonly consumer: Consumer
  private readonly groupId =
    process.env.KAFKA_CONSUMER_GROUP ?? 'autospace-api-consumer'
  private readonly handler: KafkaEventHandler = async () => undefined

  constructor(
    @InjectRepository(ConsumedEvent)
    private readonly consumedEvents: Repository<ConsumedEvent>,
  ) {
    const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean)

    this.consumer = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? 'autospace-api-consumer',
      brokers,
    }).consumer({ groupId: this.groupId })
  }

  async onModuleInit(): Promise<void> {
    if (process.env.KAFKA_CONSUMER_ENABLED !== 'true') return

    const topics = (process.env.KAFKA_CONSUMER_TOPICS ?? '')
      .split(',')
      .map((topic) => topic.trim())
      .filter(Boolean)

    if (topics.length === 0) {
      this.logger.warn('Kafka consumer enabled without topics')
      return
    }

    await this.consumer.connect()
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false })
    }
    await this.consumer.run({ eachMessage: (payload) => this.process(payload) })
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumer.disconnect()
  }

  private async process({ message }: EachMessagePayload): Promise<void> {
    if (!message.value) return

    const event = JSON.parse(message.value.toString()) as Record<
      string,
      unknown
    >
    const eventId = typeof event.id === 'string' ? event.id : undefined
    const eventType = typeof event.type === 'string' ? event.type : undefined
    if (!eventId || !eventType) {
      throw new Error('Kafka event requires id and type')
    }

    const existing = await this.consumedEvents.findOneBy({
      eventId,
      consumerGroup: this.groupId,
    })
    if (existing) return

    await this.handler(event)
    await this.consumedEvents.insert({
      eventId,
      eventType,
      consumerGroup: this.groupId,
    })
  }
}
