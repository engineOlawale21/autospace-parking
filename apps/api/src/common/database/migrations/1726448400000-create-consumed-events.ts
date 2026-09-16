import { MigrationInterface, QueryRunner, Table } from 'typeorm'

export class CreateConsumedEvents1726448400000 implements MigrationInterface {
  name = 'CreateConsumedEvents1726448400000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'platform_consumed_events',
        columns: [
          {
            name: 'event_id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          { name: 'event_type', type: 'varchar', length: '200' },
          {
            name: 'consumer_group',
            type: 'varchar',
            length: '200',
            isPrimary: true,
          },
          {
            name: 'processed_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('platform_consumed_events')
  }
}
