declare module 'passport-discord' {
  import { Strategy as PassportStrategy } from 'passport';
  
  export interface Profile {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
    email?: string;
    [key: string]: any;
  }

  export interface StrategyOption {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  }

  export type VerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: StrategyOption, verify: VerifyFunction);
  }
}
