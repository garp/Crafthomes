import type { Middleware } from '@reduxjs/toolkit';

/**
 * Redux middleware for socket events
 * Currently minimal - can be extended for cache invalidation as needed
 */
export const socketMiddleware: Middleware = () => {
  return (next) => (action) => {
    return next(action);
  };
};
