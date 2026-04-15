export type SportmonksTeam = {
  id?: number;
  name?: string;
  code?: string;
  image_path?: string;
};

export type SportmonksCountry = {
  id?: number;
  name?: string;
};

export type SportmonksPlayer = {
  id?: number;
  fullname?: string;
  firstname?: string;
  lastname?: string;
  image_path?: string;
  dateofbirth?: string;
  gender?: string;
  battingstyle?: string;
  bowlingstyle?: string;
  position?: {
    id?: number;
    name?: string;
  };
  country?: SportmonksCountry;
  currentteams?: SportmonksTeam[];
  career?: Array<Record<string, unknown>>;
  lineup?: {
    team_id?: number;
    captain?: boolean;
    wicketkeeper?: boolean;
    substitution?: boolean;
  };
};

export type SportmonksRun = {
  id?: number;
  fixture_id?: number;
  team_id?: number;
  inning?: number;
  score?: number;
  wickets?: number;
  overs?: number;
};

export type SportmonksBallScore = {
  id?: number;
  name?: string;
  runs?: number;
  four?: boolean;
  six?: boolean;
  is_wicket?: boolean;
};

export type SportmonksBall = {
  id?: number;
  fixture_id?: number;
  team_id?: number;
  ball?: number;
  batsman?: SportmonksPlayer;
  bowler?: SportmonksPlayer;
  score?: SportmonksBallScore;
};

export type SportmonksBattingCard = {
  id?: number;
  fixture_id?: number;
  team_id?: number;
  player_id?: number;
  score?: number;
  ball?: number;
  four_x?: number;
  six_x?: number;
  rate?: number;
  player?: SportmonksPlayer;
  batsman?: SportmonksPlayer;
};

export type SportmonksBowlingCard = {
  id?: number;
  fixture_id?: number;
  team_id?: number;
  player_id?: number;
  overs?: number;
  medians?: number;
  runs?: number;
  wickets?: number;
  rate?: number;
  player?: SportmonksPlayer;
  bowler?: SportmonksPlayer;
};

export type SportmonksLineupItem = {
  resource?: string;
  id?: number;
  fixture_id?: number;
  team_id?: number;
  player_id?: number;
  captain?: boolean;
  wicketkeeper?: boolean;
  position?: number;
  player?: SportmonksPlayer;
  fullname?: string;
  image_path?: string;
  lineup?: {
    team_id?: number;
    captain?: boolean;
    wicketkeeper?: boolean;
    substitution?: boolean;
  };
};

export type SportmonksVenue = {
  id?: number;
  name?: string;
  city?: string;
};

export type SportmonksFixtureType =
  | 'T20'
  | 'T10'
  | 'ODI'
  | 'T20I'
  | '4day'
  | 'Test'
  | 'Test/5day'
  | 'List A'
  | string;

export type SportmonksFixtureStatus =
  | 'NS'
  | 'Finished'
  | '1st Innings'
  | '2nd Innings'
  | '3rd Innings'
  | '4th Innings'
  | 'Stump Day 1'
  | 'Stump Day 2'
  | 'Stump Day 3'
  | 'Stump Day 4'
  | 'Innings Break'
  | 'Tea Break'
  | 'Lunch'
  | 'Dinner'
  | 'Postp.'
  | 'Int.'
  | 'Aban.'
  | 'Delayed'
  | 'Cancl.'
  | string;

export type SportmonksFixture = {
  id: number;
  round?: string;
  status?: SportmonksFixtureStatus;
  type?: SportmonksFixtureType;
  starting_at?: string;
  localteam?: SportmonksTeam;
  visitorteam?: SportmonksTeam;
  venue?: SportmonksVenue;
  note?: string;
  tosswon?: SportmonksTeam;
  runs?: SportmonksRun[];
  balls?: SportmonksBall[];
  batting?: SportmonksBattingCard[];
  bowling?: SportmonksBowlingCard[];
  lineup?: SportmonksLineupItem[];
};

export type SportmonksResponse<T> = {
  data: T;
  meta?: unknown;
};
