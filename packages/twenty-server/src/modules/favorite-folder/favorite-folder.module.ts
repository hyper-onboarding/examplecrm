import { Module } from '@nestjs/common';

import { ExampleCRMORMModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { FavoriteFolderDeletionListener } from 'src/modules/favorite-folder/listeners/favorite-folder.listener';

@Module({
  imports: [ExampleCRMORMModule],
  providers: [FavoriteFolderDeletionListener],
})
export class FavoriteFolderModule {}
