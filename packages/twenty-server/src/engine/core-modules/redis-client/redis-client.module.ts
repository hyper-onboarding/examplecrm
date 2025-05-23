import { Global, Module } from '@nestjs/common';

import { RedisClientService } from 'src/engine/core-modules/redis-client/redis-client.service';
import { ExampleCRMConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';

@Global()
@Module({
  imports: [ExampleCRMConfigModule],
  providers: [RedisClientService],
  exports: [RedisClientService],
})
export class RedisClientModule {}
