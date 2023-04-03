import { Session } from "next-auth";

export type UserSession = {
  workerId: string;
  name: string;
};

export enum Permission {
  ADMIN = "ADMIN",
  PLANS = "PLANS",
  JOBS = "JOBS",
  WORKERS = "WORKERS",
  CARS = "CARS",
}

export type ExtendedSession = Session & {
  userID: string;
  username: string;
  permissions: Permission[];
};
