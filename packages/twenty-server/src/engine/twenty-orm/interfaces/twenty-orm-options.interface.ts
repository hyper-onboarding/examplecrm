import { FactoryProvider, ModuleMetadata } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExampleCRMORMOptions {}

export type ExampleCRMORMModuleAsyncOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory: (...args: any[]) => ExampleCRMORMOptions | Promise<ExampleCRMORMOptions>;
} & Pick<ModuleMetadata, 'imports'> &
  Pick<FactoryProvider, 'inject'>;
