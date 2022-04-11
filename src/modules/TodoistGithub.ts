import axios, { AxiosRequestConfig } from 'axios';

require('dotenv').config();

// INTERFACES

interface Todoist {
  type: string;
  project: string;
  sections: string[];
  bug_label: string;
}

interface TodoistTask {
  id: number;
  content: string;
  description: string;
  completed: boolean;
  labels: string[];
}

interface TodoistTaskPost {
  completed: boolean;
  content: string;
  description: string;
  project_id: number;
  section_id: number;
}

interface GitHub {
  type: string;
  project: string;
  columns: string[];
  repo: string;
  bug_label: string;
  enhancement_label: string;
}

interface GitHubCard {
  id: number;
  content_url: string;
}

interface GitHubIssuePost {
  title: string;
  body: string;
  labels: string[];
}

// FUNCTIONS

/**
 * Retrieve Tasks list from todoist with the provided filters
 * @param projectId
 * @param sectionId
 */

function TodoistTasks(projectId : string, sectionId : string) : any {
  return new Promise((resolve, reject) => {
    const url = `https://api.todoist.com/rest/v1/tasks?project_id=${projectId}&section_id=${sectionId}`;
    const config: AxiosRequestConfig = {
      method: 'get',
      headers: {
        Authorization: `Bearer ${process.env.TODOIST_KEY}`,
      },
    };

    axios(url, config)
      .then((response) => {
        resolve(response.data.filter((task: any) => task.parent === undefined).map((task: any) => ({
          id: task.id,
          content: task.content,
          description: task.description,
          completed: task.completed,
          labels: task.label_ids,
        })));
      })
      .catch((error: any) => {
        process.stdout.write(`${error.toString()}\n`);
        reject(error);
      });
  });
}

/**
 * Retrieve card issue from github
 * @param url
 * @returns
 */
function getGitHubIssue(url : string) : any {
  return new Promise((resolve, reject) => {
    const config: AxiosRequestConfig = {
      method: 'get',
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    };

    axios(url, config)
      .then((response) => {
        resolve({
          id: response.data.id,
          title: response.data.title,
          body: response.data.body,
          state: response.data.state,
        });
      })
      .catch((error: any) => {
        process.stdout.write(`${error.toString()}\n`);
        reject(error);
      });
  });
}

/**
 * Check if a string is a number
 * @param str
 * @returns
 */
function isNumeric(str: string) : boolean {
  if (typeof str !== 'string') return false;
  return !Number.isNaN(str)
         && !Number.isNaN(parseFloat(str));
}

/* eslint-disable import/prefer-default-export */
export const tdgh = {
  Manager: async (integration: any) => {
    try {
      // Retrieve Todoist information
      const td : Todoist = integration.endpoints.find((ep : any) => ep.type === 'todoist');

      const tdProjectId: string = td.project;
      const tdTodoSectionId: string = td.sections[0];
      const tdDoingSectionId: string = td.sections[1];
      const tdDoneSectionId: string = td.sections[2];
      const tdBugLabel: string = td.bug_label;

      // Retrieve GitHub information
      const gh : GitHub = integration.endpoints.find((ep : any) => ep.type === 'github');

      const ghProjectId: string = gh.project;
      const ghTodoColumnId: string = gh.columns[0];
      const ghInProgressColumnId: string = gh.columns[1];
      const ghDoneColumnId: string = gh.columns[2];
      const ghRepo: string = gh.repo;
      const ghBugLabel: string = gh.bug_label;
      const ghEnhancementLabel: string = gh.enhancement_label;

      // Request Todoist Tasks
      const tdTodoTasks : TodoistTask[] = await TodoistTasks(tdProjectId, tdTodoSectionId);
      const tdDoingTasks : TodoistTask[] = await TodoistTasks(tdProjectId, tdDoingSectionId);
      const tdDoneTasks : TodoistTask[] = await TodoistTasks(tdProjectId, tdDoneSectionId);

      // Find Todoist Tasks that are not in GitHub
      const tdTodoNotInGh : TodoistTask[] = tdTodoTasks.filter((tdTodoTask : TodoistTask) => !isNumeric(tdTodoTask.content.substring(1, tdTodoTask.content.indexOf(']'))));

      // Add Card to GitHub Project
      tdTodoNotInGh.forEach((tdTodoTask : TodoistTask) => {
        // Create GitHub Issue
        const ghIssuePost : GitHubIssuePost = {
          title: tdTodoTask.content,
          body: tdTodoTask.description,
          // eslint-disable-next-line max-len
          labels: tdTodoTask.labels.map((label : string) => (label === tdBugLabel ? ghBugLabel : ghEnhancementLabel)),
        };

        // Post GitHub Issue
        const config: AxiosRequestConfig = {
          method: 'post',
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          },
          data: ghIssuePost,
        };
        axios(`https://api.github.com/repos/${ghRepo}/issues`, config)
          .then((response) => {
            // Add GitHub Issue to GitHub Project
            const gcConfig: AxiosRequestConfig = {
              method: 'post',
              headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
              },
              data: {
                note: null,
                content_id: response.data.id,
                content_type: 'Issue',
              },
            };

            axios(`https://api.github.com/projects/columns/${ghTodoColumnId}/cards`, gcConfig)
              .then((gcResponse) => {
                // Update Todoist Task
                const tdTaskPost : TodoistTaskPost = {
                  completed: false,
                  content: `[${response.data.number}] ${tdTodoTask.content}`,
                  description: `CARD=${gcResponse.data.id}\\n${tdTodoTask.description}`,
                  project_id: Number(tdProjectId),
                  section_id: Number(tdTodoSectionId),
                };

                const tdConfig: AxiosRequestConfig = {
                  method: 'post',
                  headers: {
                    Authorization: `Bearer ${process.env.TODOIST_KEY}`,
                  },
                  data: tdTaskPost,
                };
                axios(`https://api.todoist.com/rest/v1/tasks/${tdTodoTask.id}`, tdConfig)
                  .then(() => {
                    process.stdout.write(`${tdTodoTask.content} added to GitHub\n`);
                  })
                  .catch((error: any) => {
                    process.stdout.write(`${error.toString()}\n`);
                  });
              });
          });
      });
    } catch (err: any) {
      process.stderr.write(`TodoistGithub.js -> Manager: ${err.toString()}`);
    }
  },
};
