import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))

  const port = Number.parseInt(process.env.PORT ?? '4000', 10)
  await app.listen(port, '0.0.0.0')
}

void bootstrap()
