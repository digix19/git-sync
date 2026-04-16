import type { User, Session } from "lucia";

declare module "hono" {
  interface ContextVariableMap {
    user: User;
    session: Session;
    traceId: string;
  }
}
