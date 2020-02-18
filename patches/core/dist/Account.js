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
const __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, '__esModule', {value: true});
const api_client_1 = require('@wireapp/api-client');
const client_1 = require('@wireapp/api-client/dist/commonjs/client/');
const http_1 = require('@wireapp/api-client/dist/commonjs/http/');
const tcp_1 = require('@wireapp/api-client/dist/commonjs/tcp/');
const cryptobox = __importStar(require('@wireapp/cryptobox'));
const store_engine_1 = require('@wireapp/store-engine');
const events_1 = __importDefault(require('events'));
const logdown_1 = __importDefault(require('logdown'));
const auth_1 = require('./auth/');
const broadcast_1 = require('./broadcast/');
const client_2 = require('./client/');
const connection_1 = require('./connection/');
const conversation_1 = require('./conversation/');
const cryptography_1 = require('./cryptography/');
const giphy_1 = require('./giphy/');
const notification_1 = require('./notification/');
const self_1 = require('./self/');
const team_1 = require('./team/');
const user_1 = require('./user/');
let TOPIC;
(function(TOPIC) {
  TOPIC.ERROR = 'Account.TOPIC.ERROR';
})(TOPIC || (TOPIC = {}));
class Account extends events_1.default {
  constructor(apiClient = new api_client_1.APIClient()) {
    super();
    this.handlePayload = payload =>
      __awaiter(this, void 0, void 0, function*() {
        switch (payload.type) {
          case conversation_1.PayloadBundleType.TIMER_UPDATE: {
            const {
              data: {message_timer},
              conversation,
            } = payload;
            const expireAfterMillis = Number(message_timer);
            this.service.conversation.messageTimer.setConversationLevelTimer(conversation, expireAfterMillis);
            break;
          }
        }
        this.emit(payload.type, payload);
      });
    this.handleError = accountError => {
      this.emit(Account.TOPIC.ERROR, accountError);
    };
    this.apiClient = apiClient;
    this.logger = logdown_1.default('@wireapp/core/Account', {
      logger: console,
      markdown: false,
    });
  }
  static get TOPIC() {
    return TOPIC;
  }
  get clientId() {
    return this.apiClient.validatedClientId;
  }
  get userId() {
    return this.apiClient.validatedUserId;
  }
  init() {
    return __awaiter(this, void 0, void 0, function*() {
      const assetService = new conversation_1.AssetService(this.apiClient);
      const cryptographyService = new cryptography_1.CryptographyService(this.apiClient, this.apiClient.config.store);
      const clientService = new client_2.ClientService(
        this.apiClient,
        this.apiClient.config.store,
        cryptographyService,
      );
      const connectionService = new connection_1.ConnectionService(this.apiClient);
      const giphyService = new giphy_1.GiphyService(this.apiClient);
      const conversationService = new conversation_1.ConversationService(
        this.apiClient,
        cryptographyService,
        assetService,
      );
      const notificationService = new notification_1.NotificationService(this.apiClient, cryptographyService);
      const selfService = new self_1.SelfService(this.apiClient);
      const teamService = new team_1.TeamService(this.apiClient);
      const broadcastService = new broadcast_1.BroadcastService(
        this.apiClient,
        conversationService,
        cryptographyService,
      );
      const userService = new user_1.UserService(this.apiClient, broadcastService);
      this.service = {
        asset: assetService,
        broadcast: broadcastService,
        client: clientService,
        connection: connectionService,
        conversation: conversationService,
        cryptography: cryptographyService,
        giphy: giphyService,
        notification: notificationService,
        self: selfService,
        team: teamService,
        user: userService,
      };
    });
  }
  login(loginData, initClient = true, clientInfo, accessTokenStore) {
    return __awaiter(this, void 0, void 0, function*() {
      this.resetContext();
      yield this.init();
      auth_1.LoginSanitizer.removeNonPrintableCharacters(loginData);
      yield this.apiClient.login(loginData, accessTokenStore);
      if (initClient) {
        yield this.initClient(loginData, clientInfo);
      }
      if (this.apiClient.context) {
        return this.apiClient.context;
      }
      throw Error('Login failed.');
    });
  }
  initClient(loginData, clientInfo) {
    return __awaiter(this, void 0, void 0, function*() {
      if (!this.service) {
        throw new Error('Services are not set.');
      }
      try {
        const localClient = yield this.loadAndValidateLocalClient();
        return {isNewClient: false, localClient};
      } catch (error) {
        // There was no client so we need to "create" and "register" a client
        const notFoundInDatabase =
          error instanceof cryptobox.error.CryptoboxError ||
          error.constructor.name === 'CryptoboxError' ||
          error instanceof store_engine_1.error.RecordNotFoundError ||
          error.constructor.name === store_engine_1.error.RecordNotFoundError.constructor.name;
        const notFoundOnBackend = error.response && error.response.status === http_1.StatusCode.NOT_FOUND;
        if (notFoundInDatabase) {
          this.logger.log('Could not find valid client in database');
          return this.registerClient(loginData, clientInfo);
        }
        if (notFoundOnBackend) {
          this.logger.log('Could not find valid client on backend');
          const client = yield this.service.client.getLocalClient();
          const shouldDeleteWholeDatabase = client.type === client_1.ClientType.TEMPORARY;
          if (shouldDeleteWholeDatabase) {
            this.logger.log('Last client was temporary - Deleting database');
            yield this.apiClient.config.store.purge();
            yield this.apiClient.init(loginData.clientType);
            return this.registerClient(loginData, clientInfo);
          }
          this.logger.log('Last client was permanent - Deleting cryptography stores');
          yield this.service.cryptography.deleteCryptographyStores();
          return this.registerClient(loginData, clientInfo);
        }
        throw error;
      }
    });
  }
  loadAndValidateLocalClient() {
    return __awaiter(this, void 0, void 0, function*() {
      yield this.service.cryptography.initCryptobox();
      const loadedClient = yield this.service.client.getLocalClient();
      yield this.apiClient.client.api.getClient(loadedClient.id);
      this.apiClient.context.clientId = loadedClient.id;
      return loadedClient;
    });
  }
  registerClient(loginData, clientInfo) {
    return __awaiter(this, void 0, void 0, function*() {
      if (!this.service) {
        throw new Error('Services are not set.');
      }
      const registeredClient = yield this.service.client.register(loginData, clientInfo);
      this.apiClient.context.clientId = registeredClient.id;
      this.logger.log('Client is created');
      yield this.service.notification.initializeNotificationStream();
      yield this.service.client.synchronizeClients();
      return {isNewClient: true, localClient: registeredClient};
    });
  }
  resetContext() {
    delete this.apiClient.context;
    delete this.service;
  }
  logout() {
    return __awaiter(this, void 0, void 0, function*() {
      yield this.apiClient.logout();
      this.resetContext();
    });
  }
  listen(notificationHandler = this.service.notification.handleNotification) {
    return __awaiter(this, void 0, void 0, function*() {
      if (!this.apiClient.context) {
        throw new Error('Context is not set - please login first');
      }
      this.apiClient.transport.ws.removeAllListeners(tcp_1.WebSocketClient.TOPIC.ON_MESSAGE);
      this.apiClient.transport.ws.on(tcp_1.WebSocketClient.TOPIC.ON_MESSAGE, notification => {
        notificationHandler(notification, conversation_1.PayloadBundleSource.WEBSOCKET).catch(error => {
          this.logger.error(`Failed to handle notification ID "${notification.id}": ${error.message}`, error);
        });
      });
      this.service.notification.removeAllListeners(notification_1.NotificationService.TOPIC.NOTIFICATION_ERROR);
      this.service.notification.on(notification_1.NotificationService.TOPIC.NOTIFICATION_ERROR, this.handleError);
      for (const payloadType of Object.values(conversation_1.PayloadBundleType)) {
        this.service.notification.removeAllListeners(payloadType);
        this.service.notification.on(payloadType, this.handlePayload);
      }
      const onBeforeConnect = () =>
        __awaiter(this, void 0, void 0, function*() {
          return this.service.notification.handleNotificationStream(notificationHandler);
        });
      yield this.apiClient.connect(onBeforeConnect);
      return this;
    });
  }
}
exports.Account = Account;
//# sourceMappingURL=Account.js.map
