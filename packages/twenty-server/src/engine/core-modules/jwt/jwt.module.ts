/* eslint-disable no-restricted-imports */
import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

import { JwtWrapperService } from 'src/engine/core-modules/jwt/services/jwt-wrapper.service';
import { ExampleCRMConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';
import { ExampleCRMConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const InternalJwtModule = NestJwtModule.registerAsync({
  useFactory: async (twentyConfigService: ExampleCRMConfigService) => {
    return {
      secret: twentyConfigService.get('APP_SECRET'),
      signOptions: {
        expiresIn: twentyConfigService.get('ACCESS_TOKEN_EXPIRES_IN'),
      },
    };
  },
  inject: [ExampleCRMConfigService],
});

@Module({
  imports: [InternalJwtModule, ExampleCRMConfigModule],
  controllers: [],
  providers: [JwtWrapperService],
  exports: [JwtWrapperService],
})
export class JwtModule {}
