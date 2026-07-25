import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { FootballDataSeedService } from './football-data-seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    await app.get(FootballDataSeedService).run();
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
