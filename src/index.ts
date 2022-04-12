/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import { integrations } from './integrations_list';

import tdtrSync from './integrations/Trello_Todoist';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config();

try {
  setInterval(() => {
    process.stdout.write(`-- POLLING: ${new Date().toString()}\n`);

    integrations.forEach((integration) => {
      const endpointsTypes: string[] = integration.endpoints.map((end) => end.type).sort();

      if (endpointsTypes[0] === 'todoist') {
        if (endpointsTypes[1] === 'trello') {
          const todoist : any = integration.endpoints.find((end) => end.type === 'todoist');
          const trello : any = integration.endpoints.find((end) => end.type === 'trello');

          tdtrSync(todoist, trello);
        }
      }
    });
  }, 10000);
} catch (err: any) {
  process.stderr.write(`Index.js: ${err.toString()}`);
}
