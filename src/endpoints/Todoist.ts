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
            });
          });
        })
        .catch((error: any) => { throw new Error(error); });

      newTasks.forEach(async (task) => {
        const trelloListId: string = _trello.lists[_todoist.sections.indexOf(task.sectionId)];

        const data = JSON.stringify({
          name: task.content,
          desc: task.description,
          idList: trelloListId,
          pos: 'bottom',
          idLabels: task.labelIds.map((label: any) => {
            if (label === _todoist.bug_label) return _trello.bug_label;
            if (label === _todoist.style_label) return _trello.style_label;
            return _trello.feature_label;
          }).join(','),
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
            process.stdout.write(`${JSON.stringify(response.data)}\n\n`);
          })
          .catch((error: any) => {
            process.stderr.write(`${error}\n`);
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
