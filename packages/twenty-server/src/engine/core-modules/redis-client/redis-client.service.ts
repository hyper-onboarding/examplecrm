import { Injectable, OnModuleDestroy } from '@nestjs/common';

import IORedis from 'ioredis';

import { ExampleCRMConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

@Injectable()
export class RedisClientService implements OnModuleDestroy {
  private redisClient: IORedis | null = null;

  constructor(private readonly twentyConfigService: ExampleCRMConfigService) {}

  getClient() {
    if (!this.redisClient) {
      const redisUrl = this.twentyConfigService.get('REDIS_URL');

      if (!redisUrl) {
        throw new Error('REDIS_URL must be defined');
      }

      this.redisClient = new IORedis(redisUrl, {
        maxRetriesPerRequest: null,
      });
    }

    return this.redisClient;
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}
