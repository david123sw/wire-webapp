/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */
const __awaiter =
  (this && this.__awaiter) ||
  function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(resolve => {
            resolve(value);
          });
    }
    return new (P || (P = Promise))((resolve, reject) => {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
const __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
const __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) {
      return mod;
    }
    const result = {};
    if (mod != null) {
      for (const k in mod) {
        if (Object.hasOwnProperty.call(mod, k)) {
          result[k] = mod[k];
        }
      }
    }
    result.default = mod;
    return result;
  };
Object.defineProperty(exports, '__esModule', {value: true});
const store_engine_1 = require('@wireapp/store-engine');
const events_1 = __importDefault(require('events'));
const logdown_1 = __importDefault(require('logdown'));
const AccountAPI_1 = require('./account/AccountAPI');
const asset_1 = require('./asset/');
const auth_1 = require('./auth/');
const broadcast_1 = require('./broadcast/');
const client_1 = require('./client/');
const connection_1 = require('./connection/');
const conversation_1 = require('./conversation/');
const env_1 = require('./env/');
const giphy_1 = require('./giphy/');
const http_1 = require('./http/');
const notification_1 = require('./notification/');
const ObfuscationUtil = __importStar(require('./obfuscation/'));
const self_1 = require('./self/');
const cookie_1 = require('./shims/node/cookie');
const tcp_1 = require('./tcp/');
const team_1 = require('./team/');
const user_1 = require('./user/');
const {version} = require('../../package.json');
let TOPIC;
(function(TOPIC) {
  TOPIC.ON_LOGOUT = 'APIClient.TOPIC.ON_LOGOUT';
})(TOPIC || (TOPIC = {}));
const defaultConfig = {
  store: new store_engine_1.MemoryEngine(),
  urls: env_1.Backend.PRODUCTION,
};
class APIClient extends events_1.default {
  constructor(config) {
    super();
    this.STORE_NAME_PREFIX = 'wire';
    this.config = Object.assign(Object.assign({}, defaultConfig), config);
    this.accessTokenStore = new auth_1.AccessTokenStore();
    this.logger = logdown_1.default('@wireapp/api-client/Client', {
      logger: console,
      markdown: false,
    });
    const httpClient = new http_1.HttpClient(this.config.urls.rest, this.accessTokenStore, this.config.store);
    const webSocket = new tcp_1.WebSocketClient(this.config.urls.ws, httpClient);
    webSocket.on(tcp_1.WebSocketClient.TOPIC.ON_INVALID_TOKEN, error =>
      __awaiter(this, void 0, void 0, function*() {
        this.logger.warn(`Cannot renew access token because cookie is invalid: ${error.message}`, error);
        yield this.logout();
        this.emit(APIClient.TOPIC.ON_LOGOUT, error);
      }),
    );
    this.transport = {
      http: httpClient,
      ws: webSocket,
    };
    this.account = {
      api: new AccountAPI_1.AccountAPI(this.transport.http),
    };
    this.asset = {
      api: new asset_1.AssetAPI(this.transport.http),
    };
    this.auth = {
      api: new auth_1.AuthAPI(this.transport.http, this.config.store),
    };
    this.broadcast = {
      api: new broadcast_1.BroadcastAPI(this.transport.http),
    };
    this.client = {
      api: new client_1.ClientAPI(this.transport.http),
    };
    this.connection = {
      api: new connection_1.ConnectionAPI(this.transport.http),
    };
    this.conversation = {
      api: new conversation_1.ConversationAPI(this.transport.http),
    };
    this.giphy = {
      api: new giphy_1.GiphyAPI(this.transport.http),
    };
    this.notification = {
      api: new notification_1.NotificationAPI(this.transport.http),
    };
    this.self = {
      api: new self_1.SelfAPI(this.transport.http),
    };
    this.teams = {
      feature: {
        api: new team_1.FeatureAPI(this.transport.http),
      },
      identityProvider: {
        api: new team_1.IdentityProviderAPI(this.transport.http),
      },
      invitation: {
        api: new team_1.TeamInvitationAPI(this.transport.http),
      },
      legalhold: {
        api: new team_1.LegalHoldAPI(this.transport.http),
      },
      member: {
        api: new team_1.MemberAPI(this.transport.http),
      },
      payment: {
        api: new team_1.PaymentAPI(this.transport.http),
      },
      service: {
        api: new team_1.ServiceAPI(this.transport.http),
      },
      team: {
        api: new team_1.TeamAPI(this.transport.http),
      },
    };
    this.user = {
      api: new user_1.UserAPI(this.transport.http),
    };
  }
  static get TOPIC() {
    return TOPIC;
  }
  init(clientType = client_1.ClientType.NONE) {
    return __awaiter(this, void 0, void 0, function*() {
      const initialAccessToken = yield this.transport.http.refreshAccessToken();
      const context = this.createContext(initialAccessToken.user, clientType);
      yield this.initEngine(context);
      yield this.accessTokenStore.updateToken(initialAccessToken);
      return context;
    });
  }
  login(loginData, accessTokenStore) {
    return __awaiter(this, void 0, void 0, function*() {
      if (this.context) {
        yield this.logout({ignoreError: true});
      }
      const cookieResponse = accessTokenStore ? {} : yield this.auth.api.postLogin(loginData);
      const accessToken = accessTokenStore ? accessTokenStore : cookieResponse.data;
      this.logger.info(
        `Saved initial access token. It will expire in "${accessToken.expires_in}" seconds.`,
        ObfuscationUtil.obfuscateAccessToken(accessToken),
      );
      const context = this.createContext(accessToken.user, loginData.clientType);
      yield this.initEngine(context);
      yield cookie_1.retrieveCookie(cookieResponse, this.config.store);
      yield this.accessTokenStore.updateToken(accessToken);
      return context;
    });
  }
  register(userAccount, clientType = client_1.ClientType.PERMANENT) {
    return __awaiter(this, void 0, void 0, function*() {
      if (this.context) {
        yield this.logout({ignoreError: true});
      }
      const user = yield this.auth.api.postRegister(userAccount);
      /**
       * Note:
       * It's necessary to initialize the context (Client.createContext()) and the store (Client.initEngine())
       * for saving the retrieved cookie from POST /access (Client.init()) in a Node environment.
       */
      const context = yield this.createContext(user.id, clientType);
      yield this.initEngine(context);
      return this.init(clientType);
    });
  }
  logout(options = {ignoreError: false}) {
    return __awaiter(this, void 0, void 0, function*() {
      try {
        yield this.auth.api.postLogout();
      } catch (error) {
        if (options.ignoreError) {
          this.logger.error(error);
        } else {
          throw error;
        }
      }
      this.disconnect('Closed by client logout');
      yield this.accessTokenStore.delete();
      delete this.context;
    });
  }
  connect(onBeforeConnect) {
    return this.transport.ws.connect(this.context && this.context.clientId, onBeforeConnect);
  }
  createContext(userId, clientType, clientId) {
    this.context = this.context
      ? Object.assign(Object.assign({}, this.context), {clientId, clientType})
      : new auth_1.Context(userId, clientType, clientId);
    return this.context;
  }
  disconnect(reason) {
    this.transport.ws.disconnect(reason);
  }
  initEngine(context) {
    return __awaiter(this, void 0, void 0, function*() {
      const clientType = context.clientType === client_1.ClientType.NONE ? '' : `@${context.clientType}`;
      const dbName = `${this.STORE_NAME_PREFIX}@${this.config.urls.name}@${context.userId}${clientType}`;
      this.logger.log(`Initialising store with name "${dbName}"`);
      try {
        const db = yield this.config.store.init(dbName);
        const isDexieStore = db && db.constructor.name === 'Dexie';
        if (isDexieStore) {
          if (this.config.schemaCallback) {
            this.config.schemaCallback(db);
          } else {
            const message = `Could not initialize store "${dbName}". Missing schema definition.`;
            throw new Error(message);
          }
          // In case the database got purged, db.close() is called automatically and we have to reopen it.
          yield db.open();
        }
      } catch (error) {
        this.logger.error(`Could not initialize store "${dbName}": ${error.message}`);
        throw error;
      }
      return this.config.store;
    });
  }
  get clientId() {
    if (this.context && this.context.clientId) {
      return this.context.clientId;
    }
    return undefined;
  }
  get userId() {
    if (this.context && this.context.userId) {
      return this.context.userId;
    }
    return undefined;
  }
  /** Should be used in cases where the user ID is MANDATORY. */
  get validatedUserId() {
    if (this.userId) {
      return this.userId;
    }
    throw new Error('No valid user ID.');
  }
  /** Should be used in cases where the client ID is MANDATORY. */
  get validatedClientId() {
    if (this.clientId) {
      return this.clientId;
    }
    throw new Error('No valid client ID.');
  }
}
exports.APIClient = APIClient;
APIClient.BACKEND = env_1.Backend;
APIClient.VERSION = version;
//# sourceMappingURL=APIClient.js.map
