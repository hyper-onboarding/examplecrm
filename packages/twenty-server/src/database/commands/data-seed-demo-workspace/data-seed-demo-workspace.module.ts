import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSeedDemoWorkspaceService } from 'src/database/commands/data-seed-demo-workspace/services/data-seed-demo-workspace.service';
import { ExampleCRMConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { Workspace } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceManagerModule } from 'src/engine/workspace-manager/workspace-manager.module';

@Module({
  imports: [
    WorkspaceManagerModule,
    ExampleCRMConfigModule,
    TypeOrmModule.forFeature([Workspace], 'core'),
  ],
  providers: [DataSeedDemoWorkspaceService],
  exports: [DataSeedDemoWorkspaceService],
})
export class DataSeedDemoWorkspaceModule {}
