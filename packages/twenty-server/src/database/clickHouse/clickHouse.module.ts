import { Module } from '@nestjs/common';

import { ExampleCRMConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';

import { ClickHouseService } from './clickHouse.service';

@Module({
  imports: [ExampleCRMConfigModule],
  providers: [ClickHouseService],
  exports: [ClickHouseService],
})
export class ClickHouseModule {}
