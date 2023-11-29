export type TChordData = {
  nodes: TChordNode[];
  links: TChordRadius[];
};

export type TChordNode = {
  id: string;
  name: string;
  fill: string;
};

export type TChordRadius = {
  from: string;
  to: string;
  value: number;
};
