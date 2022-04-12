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
}

const sync = (_todoist: TodoistInfo, _trello: TrelloInfo) : void => {
  Todoist.addNewTasks_Trello(_todoist, _trello);
};

export default sync;
