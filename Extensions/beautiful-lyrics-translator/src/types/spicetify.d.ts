// Tipado completo para Spicetify API
declare namespace Spicetify {
  interface Track {
    uri: string;
    metadata?: any;
    uid?: string;
    name?: string;
    artists?: Array<{ name: string; uri: string }>;
  }
  
  interface PlayerData {
    track?: Track;
    item?: Track;
    uri?: string;
    context?: any;
  }
  
  interface Player {
    data?: PlayerData;
    addEventListener(event: string, callback: () => void): void;
    removeEventListener(event: string, callback: () => void): void;
    getState?: () => any;
  }

  interface AuthorizationAPI {
    _tokenProvider?(options: { preferCached: boolean }): Promise<{
      accessToken: string;
    }>;
  }
  
  interface Session {
    accessToken?: string;
    isAnonymous?: boolean;
  }
  
  interface PlayerAPI {
    _state?: {
      item?: Track;
      track?: Track;
    };
  }

  interface Platform {
    History?: any;
    AuthorizationAPI?: AuthorizationAPI;
    PlayerAPI?: PlayerAPI;
    Session?: Session;
  }
  
  interface QueueAPI {
    track?: Track;
  }
  
  interface CosmosAsync {
    get(url: string): Promise<any>;
    post(url: string, body?: any): Promise<any>;
  }
  
  interface GraphQL {
    Request(definition: any, query: any): Promise<any>;
    Definitions: {
      lyrics: any;
      [key: string]: any;
    };
  }

  const Player: Player;
  const Platform: Platform;
  const Queue: QueueAPI | undefined;
  const CosmosAsync: CosmosAsync | undefined;
  const GraphQL: GraphQL | undefined;  // ← NUEVO
}

declare const Spicetify: typeof Spicetify;
