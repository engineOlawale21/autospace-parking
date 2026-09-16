import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OutboxEvent } from './outbox-event.entity'
import { ConsumedEvent } from './consumed-event.entity'
import { KafkaEventConsumer } from './kafka-event.consumer'
import { KafkaOutboxPublisher } from './kafka-outbox.publisher'
import { OUTBOX_PUBLISHER, OutboxRelayService } from './outbox-relay.service'
import { OutboxRelayWorker } from './outbox-relay.worker'
import { OutboxService } from './outbox.service'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent, ConsumedEvent])],
  providers: [
    OutboxService,
    OutboxRelayService,
    OutboxRelayWorker,
    KafkaEventConsumer,
    KafkaOutboxPublisher,
    {
      provide: OUTBOX_PUBLISHER,
      useExisting: KafkaOutboxPublisher,
    },
  ],
  exports: [OutboxService, OutboxRelayService],
})
export class OutboxModule {}
