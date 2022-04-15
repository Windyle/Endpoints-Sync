/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
import Todoist from '../endpoints/Todoist';

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

const sync = async (_todoist: TodoistInfo, _trello: TrelloInfo) : Promise<void> => {
  try {
    const updateTasksErrors: boolean = await Todoist.updateTasks_Trello(_todoist, _trello);

    if (updateTasksErrors === true) { throw new Error('An error has occurred while updating tasks on Trello!'); }

    const newTasksErrors: boolean = await Todoist.addNewTasks_Trello(_todoist, _trello);

    if (newTasksErrors === true) { throw new Error('An error has occurred while creating new tasks on Trello!'); }
  } catch (error : any) {
    process.stderr.write(`${error}\n`);
  }
};

export default sync;
