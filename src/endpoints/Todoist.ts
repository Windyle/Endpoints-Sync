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
          url: 'https://api.trello.com/1/cards?key=bb007d1f4a2cd334a5389dda563de402&token=06782038f9e6a514328f2f7c7e28669e4f1ebd0df4e0824f038858452766f869',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Cookie: 'dsc=adce22b70cf269d3693ac58961e7687962bfbeb5ed63acc3783ce4b6ed69688f; preAuthProps=s%3A564dc978b8f0a93b9ad21c36%3AisEnterpriseAdmin%3Dfalse.xZZHnVQi7hp5Ac32z2eggi9i0r29YsoAuIjV3xrbxaY',
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
