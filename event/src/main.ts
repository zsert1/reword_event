import { NestFactory } from '@nestjs/core';
import { EventModule } from './event/event.module';

async function bootstrap() {
  const app = await NestFactory.create(EventModule);
  await app.listen(3002);
}
bootstrap();
