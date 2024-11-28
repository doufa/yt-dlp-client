declare module 'global-agent' {
  export function bootstrap(): void;
  
  global {
    var GLOBAL_AGENT: {
      HTTP_PROXY?: string;
      HTTPS_PROXY?: string;
      NO_PROXY?: string;
    };
  }
} 