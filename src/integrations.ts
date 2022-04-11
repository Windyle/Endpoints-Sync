/* eslint-disable import/prefer-default-export */
export const integrations = [
  {
    endpoints: [
      {
        type: 'todoist',
        project: '2286274195',
        sections: [
          '81747951', // To Do
          '81747956', // Doing
          '81747966', // Done
        ],
        bug_label: '2160000617',
      },
      {
        type: 'github',
        project: '14348404',
        columns: [
          '18417565', // To Do
          '18417566', // In Progress
          '18417567', // Done
        ],
        repo: 'windyle/integratio',
        bug_label: 'bug',
        enhancement_label: 'enhancement',
      },
    ],
  },
];
