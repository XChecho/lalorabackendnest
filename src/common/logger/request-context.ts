import { AsyncLocalStorage } from 'async_hooks';

// Data stored per request
export interface RequestContextData {
  requestId: string;
  startTime: number;
  method: string;
  url: string;
  ip?: string; // Made optional since req.ip can be undefined
  userAgent?: string;
  userId?: string;
  [key: string]: any;
}

// AsyncLocalStorage to hold context across async calls
export const requestContext = new AsyncLocalStorage<RequestContextData>();

// Helper to get current request context
export const getRequestContext = (): RequestContextData | undefined => {
  return requestContext.getStore();
};

// Helper to set/update a value in current context
export const setRequestContextValue = (key: string, value: any) => {
  const store = requestContext.getStore();
  if (store) {
    store[key] = value;
  }
};
