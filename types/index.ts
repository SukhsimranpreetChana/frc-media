export type Clip = {
  id: string;
  title: string;
  type: string;
  year: number;
  creator: string;
  event: string;
  description: string;
};

export type Team = {
  id: string;
  number: string;
  name: string;
  location: string;
  mediaFocus: string;
  driveUrl: string;
  tags: string[];
  description: string;
};
