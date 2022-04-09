import axios, { AxiosRequestConfig } from 'axios';

require('dotenv').config();

// INTERFACES

interface Todoist {
  type: string;
  project: string;
  sections: string[];
}

interface GitHub {
  type: string;
  project: string;
  columns: string[];
}

// FUNCTIONS

/**
 * Retrieve Tasks list from todoist with the provided filters
 * @param projectId
 * @param sectionId
 */

function TodoistTasks(projectId : string, sectionId : string) : any {
  const url = `https://api.todoist.com/rest/v1/tasks?project_id=${projectId}&section_id=${sectionId}`;
  const config: AxiosRequestConfig = {
    method: 'get',
    headers: {
      Authorization: `Bearer ${process.env.TODOIST_KEY}`,
    },
  };

  axios(url, config)
    .then((response) => {
      process.stdout.write(`${JSON.stringify(response.data)}\n`);
    })
    .catch((error: any) => {
      process.stdout.write(`${error.toString()}\n`);
    });
}

/* eslint-disable import/prefer-default-export */
export const tdgh = {
  Manager: (integration: any) => {
    try {
      // Retrieve Todoist information
      const td : Todoist = integration.endpoints.find((ep : any) => ep.type === 'todoist');

      const tdProjectId: string = td.project;
      const tdTodoSectionId: string = td.sections[0];
      const tdDoingSectionId: string = td.sections[1];
      const tdDoneSectionId: string = td.sections[2];

      // Retrieve GitHub information
      const gh : GitHub = integration.endpoints.find((ep : any) => ep.type === 'github');

      const ghProjectId: string = gh.project;
      const ghTodoColumnId: string = gh.columns[0];
      const ghInProgressColumnId: string = gh.columns[1];
      const ghDoneColumnId: string = gh.columns[2];

      // Request Todoist Tasks
      TodoistTasks(tdProjectId, tdTodoSectionId);
      TodoistTasks(tdProjectId, tdDoingSectionId);
      TodoistTasks(tdProjectId, tdDoneSectionId);
    } catch (err: any) {
      process.stderr.write(`TodoistGithub.js -> Manager: ${err.toString()}`);
    }
  },
};
