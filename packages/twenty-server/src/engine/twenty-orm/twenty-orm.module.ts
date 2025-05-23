import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeatureFlagModule } from 'src/engine/core-modules/feature-flag/feature-flag.module';
import { ExampleCRMConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { DataSourceModule } from 'src/engine/metadata-modules/data-source/data-source.module';
import { ObjectMetadataEntity } from 'src/engine/metadata-modules/object-metadata/object-metadata.entity';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { UserWorkspaceRoleEntity } from 'src/engine/metadata-modules/role/user-workspace-role.entity';
import { WorkspaceFeatureFlagsMapCacheModule } from 'src/engine/metadata-modules/workspace-feature-flags-map-cache/workspace-feature-flags-map-cache.module';
import { WorkspaceMetadataCacheModule } from 'src/engine/metadata-modules/workspace-metadata-cache/workspace-metadata-cache.module';
import { WorkspacePermissionsCacheModule } from 'src/engine/metadata-modules/workspace-permissions-cache/workspace-permissions-cache.module';
import { entitySchemaFactories } from 'src/engine/twenty-orm/factories';
import { EntitySchemaFactory } from 'src/engine/twenty-orm/factories/entity-schema.factory';
import { ExampleCRMORMGlobalManager } from 'src/engine/twenty-orm/twenty-orm-global.manager';
import { ExampleCRMORMManager } from 'src/engine/twenty-orm/twenty-orm.manager';
import { WorkspaceCacheStorageModule } from 'src/engine/workspace-cache-storage/workspace-cache-storage.module';

import { PgPoolSharedModule } from './pg-shared-pool/pg-shared-pool.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature(
      [ObjectMetadataEntity, UserWorkspaceRoleEntity],
      'metadata',
    ),
    DataSourceModule,
    WorkspaceCacheStorageModule,
    WorkspaceMetadataCacheModule,
    PermissionsModule,
    WorkspaceFeatureFlagsMapCacheModule,
    WorkspacePermissionsCacheModule,
    FeatureFlagModule,
    ExampleCRMConfigModule,
    PgPoolSharedModule,
  ],
  providers: [
    ...entitySchemaFactories,
    ExampleCRMORMManager,
    ExampleCRMORMGlobalManager,
  ],
  exports: [
    EntitySchemaFactory,
    ExampleCRMORMManager,
    ExampleCRMORMGlobalManager,
    PgPoolSharedModule,
  ],
})
export class ExampleCRMORMModule {}
