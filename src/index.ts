/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import { integrations } from './integrations';
import { tdgh } from './modules/TodoistGithub';

try {
  integrations.forEach((integration) => {
    const endpointsTypes: string[] = integration.endpoints.map((end) => end.type).sort();

    if (endpointsTypes[0] === 'github') {
      if (endpointsTypes[1] === 'todoist') {
        tdgh.Manager(integration);
      }
    }
  });
} catch (err: any) {
  process.stderr.write(`Index.js: ${err.toString()}`);
}
