import * as fs from 'fs';
import * as path from 'path';

import { config } from 'dotenv';
config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  override: true,
});

export function generateFrontConfig(): void {
  const configObject = {
    window: {
      _env_: {
        REACT_APP_SERVER_BASE_URL: process.env.SERVER_URL,
      },
    },
  };

  const configString = `<!-- BEGIN: ExampleCRM Config -->
    <script id="twenty-env-config">
      window._env_ = ${JSON.stringify(configObject.window._env_, null, 2)};
    </script>
    <!-- END: ExampleCRM Config -->`;

  const distPath = path.join(__dirname, '../..', 'front');
  const indexPath = path.join(distPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    // eslint-disable-next-line no-console
    console.log(
      'Frontend build not found, assuming it is served independently',
    );

    return;
  }

  let indexContent = fs.readFileSync(indexPath, 'utf8');

  indexContent = indexContent.replace(
    /<!-- BEGIN: ExampleCRM Config -->[\s\S]*?<!-- END: ExampleCRM Config -->/,
    configString,
  );

  fs.writeFileSync(indexPath, indexContent, 'utf8');
}
