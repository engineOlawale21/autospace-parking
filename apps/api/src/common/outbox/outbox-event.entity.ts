import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity({ name: 'platform_outbox_events' })
@Index('IDX_platform_outbox_aggregate', [
  'aggregateType',
  'aggregateId',
  'occurredAt',
])
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'aggregate_type', type: 'varchar', length: 100 })
  aggregateType: string

  @Column({ name: 'aggregate_id', type: 'varchar', length: 255 })
  aggregateId: string

  @Column({ name: 'event_type', type: 'varchar', length: 200 })
  eventType: string

  @Column({ name: 'event_version', type: 'integer', default: 1 })
  eventVersion: number

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>

  @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null

  @Column({ type: 'integer', default: 0 })
  attempts: number

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null
}
