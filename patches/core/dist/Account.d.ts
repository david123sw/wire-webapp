/// <reference types="node" />
import { APIClient } from '@wireapp/api-client';
import { Context, LoginData } from '@wireapp/api-client/dist/commonjs/auth/';
import { RegisteredClient } from '@wireapp/api-client/dist/commonjs/client/';
import * as Events from '@wireapp/api-client/dist/commonjs/event';
import EventEmitter from 'events';
import { BroadcastService } from './broadcast/';
import { ClientInfo, ClientService } from './client/';
import { ConnectionService } from './connection/';
import { AssetService, ConversationService, PayloadBundleType } from './conversation/';
import * as Messages from './conversation/message/Message';
import { CoreError } from './CoreError';
import { CryptographyService } from './cryptography/';
import { GiphyService } from './giphy/';
import { NotificationHandler, NotificationService } from './notification/';
import { SelfService } from './self/';
import { TeamService } from './team/';
import { UserService } from './user/';
declare enum TOPIC {
    ERROR = "Account.TOPIC.ERROR"
}
export declare interface Account {
    on(event: PayloadBundleType.ASSET, listener: (payload: Messages.FileAssetMessage) => void): this;
    on(event: PayloadBundleType.ASSET_ABORT, listener: (payload: Messages.FileAssetAbortMessage) => void): this;
    on(event: PayloadBundleType.ASSET_IMAGE, listener: (payload: Messages.ImageAssetMessage) => void): this;
    on(event: PayloadBundleType.ASSET_META, listener: (payload: Messages.FileAssetMetaDataMessage) => void): this;
    on(event: PayloadBundleType.CALL, listener: (payload: Messages.CallMessage) => void): this;
    on(event: PayloadBundleType.CLIENT_ACTION, listener: (payload: Messages.ResetSessionMessage) => void): this;
    on(event: PayloadBundleType.CLIENT_ADD, listener: (payload: Events.UserClientAddEvent) => void): this;
    on(event: PayloadBundleType.CLIENT_REMOVE, listener: (payload: Events.UserClientRemoveEvent) => void): this;
    on(event: PayloadBundleType.CONFIRMATION, listener: (payload: Messages.ConfirmationMessage) => void): this;
    on(event: PayloadBundleType.CONNECTION_REQUEST, listener: (payload: Events.UserConnectionEvent) => void): this;
    on(event: PayloadBundleType.CONVERSATION_CLEAR, listener: (payload: Messages.ClearConversationMessage) => void): this;
    on(event: PayloadBundleType.CONVERSATION_RENAME, listener: (payload: Events.ConversationRenameEvent) => void): this;
    on(event: PayloadBundleType.LOCATION, listener: (payload: Messages.LocationMessage) => void): this;
    on(event: PayloadBundleType.MEMBER_JOIN, listener: (payload: Events.TeamMemberJoinEvent) => void): this;
    on(event: PayloadBundleType.MESSAGE_DELETE, listener: (payload: Messages.DeleteMessage) => void): this;
    on(event: PayloadBundleType.MESSAGE_EDIT, listener: (payload: Messages.EditedTextMessage) => void): this;
    on(event: PayloadBundleType.MESSAGE_HIDE, listener: (payload: Messages.HideMessage) => void): this;
    on(event: PayloadBundleType.PING, listener: (payload: Messages.PingMessage) => void): this;
    on(event: PayloadBundleType.REACTION, listener: (payload: Messages.ReactionMessage) => void): this;
    on(event: PayloadBundleType.TEXT, listener: (payload: Messages.TextMessage) => void): this;
    on(event: PayloadBundleType.TIMER_UPDATE, listener: (payload: Events.ConversationMessageTimerUpdateEvent) => void): this;
    on(event: PayloadBundleType.TYPING, listener: (payload: Events.ConversationTypingEvent) => void): this;
    on(event: PayloadBundleType.UNKNOWN, listener: (payload: any) => void): this;
    on(event: TOPIC.ERROR, listener: (payload: CoreError) => void): this;
}
export declare class Account extends EventEmitter {
    private readonly logger;
    private readonly apiClient;
    service?: {
        asset: AssetService;
        broadcast: BroadcastService;
        client: ClientService;
        connection: ConnectionService;
        conversation: ConversationService;
        cryptography: CryptographyService;
        giphy: GiphyService;
        notification: NotificationService;
        self: SelfService;
        team: TeamService;
        user: UserService;
    };
    static readonly TOPIC: typeof TOPIC;
    constructor(apiClient?: APIClient);
    readonly clientId: string;
    readonly userId: string;
    init(): Promise<void>;
    login(loginData: LoginData, initClient?: boolean, clientInfo?: ClientInfo, accessTokenStore?: any): Promise<Context>;
    initClient(loginData: LoginData, clientInfo?: ClientInfo): Promise<{
        isNewClient: boolean;
        localClient: RegisteredClient;
    }>;
    loadAndValidateLocalClient(): Promise<RegisteredClient>;
    private registerClient;
    private resetContext;
    logout(): Promise<void>;
    listen(notificationHandler?: NotificationHandler): Promise<Account>;
    private readonly handlePayload;
    private readonly handleError;
}
export {};
