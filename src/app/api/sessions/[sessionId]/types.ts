export type RouteContext = {
    params: Promise<{
      sessionId: string;
    }>;
  };