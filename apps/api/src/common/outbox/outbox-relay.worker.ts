import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { OutboxRelayService } from './outbox-relay.service'

@Injectable()
export class OutboxRelayWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayWorker.name)
  private timer?: NodeJS.Timeout
  private running = false

  constructor(private readonly relay: OutboxRelayService) {}

  onModuleInit(): void {
    if (process.env.OUTBOX_RELAY_ENABLED === 'false') return

    const interval = this.pollInterval()
    this.timer = setInterval(() => void this.runOnce(), interval)
    void this.runOnce()
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer)
  }

  private async runOnce(): Promise<void> {
    if (this.running) return
    this.running = true

    try {
      const published = await this.relay.publishBatch()
      if (published > 0) {
        this.logger.debug(`Published ${published} outbox event(s)`)
      }
    } catch (error) {
      this.logger.error(`Outbox relay batch failed: ${String(error)}`)
    } finally {
      this.running = false
    }
  }

  private pollInterval(): number {
    const configured = Number.parseInt(
      process.env.OUTBOX_RELAY_POLL_MS ?? '5000',
      10,
    )
    return Number.isInteger(configured) && configured >= 250 ? configured : 5000
  }
}
