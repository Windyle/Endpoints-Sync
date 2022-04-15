import { TodoistApi } from '@doist/todoist-api-typescript';
import axios, { AxiosRequestConfig } from 'axios';

interface TodoistInfo {
  type: string;
  project: number;
  sections: number[];
  bug_label: string;
  style_label: string;
  code_label: string;
}

interface TrelloInfo {
  type: string;
  board: string;
  lists: string[];
  bug_label: string;
  style_label: string;
  feature_label: string;
  high_label: string;
  medium_label: string;
  low_label: string;
}

const Todoist = {
  addNewTasks_Trello: async (_todoist: TodoistInfo, _trello: TrelloInfo) : Promise<boolean> => {
    try {
      if (process.env.TODOIST_API_KEY === undefined) { throw new Error('No Todoist API Key has been provided!'); }
      if (process.env.TRELLO_API_KEY === undefined || process.env.TRELLO_API_TOKEN === undefined) { throw new Error('No Trello API Key and/or Secret has been provided!'); }

      const api: any = new TodoistApi(process.env.TODOIST_API_KEY);

      const newTasks: any[] = [];

      await api.getTasks({
        project_id: _todoist.project,
      })
        .then((tasks: any) => {
          tasks.filter((task: any) => !(task.description.indexOf('[') === 0 && task.description.indexOf(']') === 25) && _todoist.sections.includes(task.sectionId)).forEach((task: any) => {
            newTasks.push({
              id: task.id,
              sectionId: task.sectionId,
              content: task.content,
              description: task.description,
              labelIds: task.labelIds,
              priority: task.priority,
            });
          });
        })
        .catch((error: any) => { throw new Error(error); });

      newTasks.forEach(async (task) => {
        const trelloListId: string = _trello.lists[_todoist.sections.indexOf(task.sectionId)];

        let priorityLabel: string = '';
        if (task.priority > 1) {
          switch (task.priority) {
            case 2:
              priorityLabel = `,${_trello.low_label}`;
              break;
            case 3:
              priorityLabel = `,${_trello.medium_label}`;
              break;
            default:
              priorityLabel = `,${_trello.high_label}`;
              break;
          }
        }

        const data = JSON.stringify({
          name: task.content,
          desc: task.description,
          idList: trelloListId,
          pos: task.priority === 4 ? 'top' : 'bottom',
          idLabels: task.labelIds.map((label: any) => {
            if (label === _todoist.bug_label) return _trello.bug_label;
            if (label === _todoist.style_label) return _trello.style_label;
            return _trello.feature_label;
          }).join(',') + priorityLabel,
        });

        const config: AxiosRequestConfig = {
          method: 'post',
          url: `https://api.trello.com/1/cards?key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_API_TOKEN}`,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          data,
        };

        await axios(config)
          .then((response: any) => {
            const updatedDescription: string = `[${response.data.id}](${response.data.url})\n\n${task.description}`;

            api.updateTask(task.id, { description: updatedDescription })
              .then((isSuccess: boolean) => {
                if (isSuccess) { process.stdout.write(`Updated Task: ${task.id}\n`); } else { process.stdout.write(`Couldn't update Task: ${task.id}\n`); }
              })
              .catch((error: any) => process.stderr.write(`${error}\n`));
          })
          .catch((error: any) => {
            process.stderr.write(`${error}\n`);
            throw new Error(error);
          });
      });

      // return false => No Errors
      return false;
    } catch (error: any) {
      process.stderr.write(`${error}\n`);

      // return true => Errors
      return true;
    }
  },
  updateTasks_Trello: async (_todoist: TodoistInfo, _trello: TrelloInfo) : Promise<boolean> => {
    try {
      if (process.env.TODOIST_API_KEY === undefined) { throw new Error('No Todoist API Key has been provided!'); }
      if (process.env.TRELLO_API_KEY === undefined || process.env.TRELLO_API_TOKEN === undefined) { throw new Error('No Trello API Key and/or Secret has been provided!'); }

      const api: any = new TodoistApi(process.env.TODOIST_API_KEY);

      const updateTasks : any[] = [];

      await api.getTasks({
        project_id: _todoist.project,
      })
        .then((tasks: any) => {
          tasks.filter((task: any) => task.description.indexOf('[') === 0 && task.description.indexOf(']') === 25 && _todoist.sections.includes(task.sectionId)).forEach((task: any) => {
            updateTasks.push({
              id: task.id,
              sectionId: task.sectionId,
              content: task.content,
              description: task.description,
              labelIds: task.labelIds,
              priority: task.priority,
            });
          });
        })
        .catch((error: any) => { throw new Error(error); });

      updateTasks.forEach(async (task) => {
        const trelloCardId: string = task.description.substring(task.description.indexOf('[') + 1, task.description.indexOf(']'));
        const description: string = task.description.substring(task.description.indexOf(')') + 3, task.description.length);
        const trelloListId: string = _trello.lists[_todoist.sections.indexOf(task.sectionId)];

        let priorityLabel: string = '';
        if (task.priority > 1 && trelloListId !== _trello.lists[_trello.lists.length - 1]) {
          switch (task.priority) {
            case 2:
              priorityLabel = `,${_trello.low_label}`;
              break;
            case 3:
              priorityLabel = `,${_trello.medium_label}`;
              break;
            default:
              priorityLabel = `,${_trello.high_label}`;
              break;
          }
        }

        const data = JSON.stringify({
          name: task.content,
          desc: description,
          pos: task.priority === 4 ? 'top' : 'bottom',
          idList: trelloListId,
          idLabels: task.labelIds.map((label: any) => {
            if (label === _todoist.bug_label) return _trello.bug_label;
            if (label === _todoist.style_label) return _trello.style_label;
            return _trello.feature_label;
          }).join(',') + priorityLabel,
        });

        const updateConfig: AxiosRequestConfig = {
          method: 'put',
          url: `https://api.trello.com/1/cards/${trelloCardId}?key=${process.env.TRELLO_API_KEY}&token=${process.env.TRELLO_API_TOKEN}`,
          headers: {
            'Content-Type': 'application/json',
          },
          data,
        };

        await axios(updateConfig)
          .then(() => {
            process.stdout.write(`Updated Task ${task.id} on Trello: ${trelloCardId}\n`);

            if (task.sectionId === _todoist.sections[_todoist.sections.length - 1]) {
              api.closeTask(task.id)
                .then((isSuccess: boolean) => {
                  if (isSuccess) { process.stdout.write(`Updated Task: ${task.id}\n`); } else { process.stdout.write(`Couldn't update Task: ${task.id}\n`); }
                })
                .catch((error: any) => {
                  throw new Error(error);
                });
            }
          })
          .catch((error: any) => {
            throw new Error(error);
          });
      });
      // return false => No Errors
      return false;
    } catch (error: any) {
      process.stderr.write(`${error}\n`);

      // return true => Errors
      return true;
    }
  },
};

export default Todoist;
