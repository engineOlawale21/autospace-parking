import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'platform_consumed_events' })
export class ConsumedEvent {
  @PrimaryColumn({ name: 'event_id', type: 'varchar', length: 255 })
  eventId: string

  @Column({ name: 'event_type', type: 'varchar', length: 200 })
  eventType: string

  @PrimaryColumn({ name: 'consumer_group', type: 'varchar', length: 200 })
  consumerGroup: string

  @CreateDateColumn({ name: 'processed_at', type: 'timestamptz' })
  processedAt: Date
}
