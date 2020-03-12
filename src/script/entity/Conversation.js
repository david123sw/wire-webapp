/*
 * Secret
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

import {amplify} from 'amplify';
import ko from 'knockout';
import {LegalHoldStatus} from '@wireapp/protocol-messaging';
import {debounce} from 'underscore';

import {getLogger} from 'Util/Logger';
import {t} from 'Util/LocalizerUtil';
import {koArrayPushAll, koArrayUnshiftAll} from 'Util/util';
import {truncate} from 'Util/StringUtil';

import {Config} from '../auth/config';

import {ReceiptMode} from '../conversation/ReceiptMode';
import {ACCESS_STATE} from '../conversation/AccessState';
import {NOTIFICATION_STATE} from '../conversation/NotificationSetting';
import {ConversationType} from '../conversation/ConversationType';
import {ConversationStatus} from '../conversation/ConversationStatus';
import {ConversationRepository} from '../conversation/ConversationRepository';
import {ConversationVerificationState} from '../conversation/ConversationVerificationState';

import {WebAppEvents} from '../event/WebApp';
import {ClientRepository} from '../client/ClientRepository';
import {StatusType} from '../message/StatusType';
import {ConnectionEntity} from '../connection/ConnectionEntity';
import {HIDE_LEGAL_HOLD_MODAL} from '../view_model/content/LegalHoldModalViewModel';
import {BackendEvent} from '../event/Backend';
import {ROLE as TEAM_ROLE} from '../user/UserPermission';

export class Conversation {
  static get TIMESTAMP_TYPE() {
    return {
      ARCHIVED: 'archivedTimestamp',
      CLEARED: 'cleared_timestamp',
      LAST_EVENT: 'last_event_timestamp',
      LAST_READ: 'last_read_timestamp',
      LAST_SERVER: 'last_server_timestamp',
      MUTED: 'mutedTimestamp',
    };
  }

  /**
   * @param {string} conversation_id - Conversation ID
   */
  constructor(conversation_id = '') {
    this.id = conversation_id;

    this.logger = getLogger(`Conversation (${this.id})`);

    this.accessState = ko.observable(ACCESS_STATE.UNKNOWN);
    this.accessCode = ko.observable();
    this.creator = undefined;
    this.name = ko.observable();
    this.team_id = undefined;
    this.type = ko.observable();

    // secret conversation
    this.url_invite = ko.observable(false); //开启url链接加入
    this.confirm = ko.observable(false); //群聊邀请需群主确认 与memberjoin_confirm 互斥
    this.member_join_confirm = ko.observable(false); //群聊邀请需被邀请者确认与confirm 互斥
    this.add_right = ko.observable(false); //仅限群主拉人
    this.view_mem = ko.observable(false); //允许查看群成员信息
    this.view_chg_mem_notify = ko.observable(false); //邀请、删除群成员通知，群内所有人是否可见
    this.add_friend = ko.observable(false); //群内成员是否能互相加好友
    this.forumid = ko.observable(''); //社区ID int64
    this.show_invitor_list = ko.observable(false); //显示邀请列表
    this.msg_only_to_manager = ko.observable(false); //消息仅群主可以显示消息，其他成员不可见
    this.block_time = ko.observable(0); //禁言
    this.advisory = ko.observable(''); //公告

    this.memsum = ko.observable(0); //人数

    this.orator = ko.observable([]); //演讲者
    this.managers = ko.observable([]); //管理员

    this.invite_code = ko.observable('');
    this.is_request_invite = false;

    this.is_loaded = ko.observable(false);
    this.is_pending = ko.observable(false);

    this.participating_user_ets = ko.observableArray([]); // Does not include self user
    this.participating_user_ids = ko.observableArray([]); // Does not include self user
    this.selfUser = ko.observable();

    //ranjun
    this.is_request_members = false;
    this.has_more = true;
    this.temp_users = ko.observableArray([]);
    this.participating_user_aliasnames = ko.observableArray([]);
    this.aliasnames = ko.observableArray([]);
    this.alias_name = ko.observable(false);
    this.alias_name_ref = ko.observable();

    this.last_message = ko.observable(false);

    this.hasCreationMessage = false;

    this.firstUserEntity = ko.pureComputed(() => this.participating_user_ets()[0]);
    this.availabilityOfUser = ko.pureComputed(() => this.firstUserEntity() && this.firstUserEntity().availability());

    this.isGuest = ko.observable(false);
    this.isManaged = false;

    this.isSuperGroup = ko.pureComputed(() => ConversationType.SUPER_GROUP === this.type());
    this.inTeam = ko.pureComputed(() => this.team_id && !this.isGuest());
    this.isGuestRoom = ko.pureComputed(() => this.accessState() === ACCESS_STATE.TEAM.GUEST_ROOM);
    this.isTeamOnly = ko.pureComputed(() => this.accessState() === ACCESS_STATE.TEAM.TEAM_ONLY);
    this.withAllTeamMembers = ko.observable(undefined);

    this.isAllowChat = ko.pureComputed(() => {
      if (!this.isGroup()) {
        return true;
      }
      if (this.selfUser().is_creator) {
        return true;
      }
      return !this.block_time();
    });

    this.isTeam1to1 = ko.pureComputed(() => {
      const isGroupConversation = this.type() === ConversationType.GROUP;
      const hasOneParticipant = this.participating_user_ids().length === 1;
      return isGroupConversation && hasOneParticipant && this.team_id && !this.name();
    });
    this.isCreator = ko.pureComputed(() => {
      return this.selfUser().is_creator;
    });
    this.isGroup = ko.pureComputed(() => {
      const isGroupConversation =
        this.type() === ConversationType.GROUP || this.type() === ConversationType.SUPER_GROUP;
      return isGroupConversation && !this.isTeam1to1();
    });
    this.is1to1 = ko.pureComputed(() => {
      const is1to1Conversation = this.type() === ConversationType.ONE2ONE;
      return is1to1Conversation || this.isTeam1to1();
    });
    this.isRequest = ko.pureComputed(() => this.type() === ConversationType.CONNECT);
    this.isSelf = ko.pureComputed(() => this.type() === ConversationType.SELF);

    this.hasGuest = ko.pureComputed(() => {
      const hasGuestUser = this.participating_user_ets().some(userEntity => userEntity.isGuest());
      return hasGuestUser && this.isGroup() && this.selfUser() && this.selfUser().inTeam();
    });
    this.hasService = ko.pureComputed(() => this.participating_user_ets().some(userEntity => userEntity.isService));

    // in case this is a one2one conversation this is the connection to that user
    this.connection = ko.observable(new ConnectionEntity());
    this.connection.subscribe(connectionEntity => {
      const connectedUserId = connectionEntity && connectionEntity.userId;
      if (connectedUserId && !this.participating_user_ids().includes(connectedUserId)) {
        this.participating_user_ids.push(connectedUserId);
      }
    });

    // E2EE conversation states
    this.archivedState = ko.observable(false).extend({notify: 'always'});
    this.mutedState = ko.observable(NOTIFICATION_STATE.EVERYTHING);
    this.verification_state = ko.observable(ConversationVerificationState.UNVERIFIED);

    this.archivedTimestamp = ko.observable(0);
    this.cleared_timestamp = ko.observable(0);
    this.last_event_timestamp = ko.observable(0);
    this.last_read_timestamp = ko.observable(0);
    this.last_server_timestamp = ko.observable(0);
    this.mutedTimestamp = ko.observable(0);
    this.place_top = ko.observable(false);
    this.previewPictureResource = ko.observable();
    this.mediumPictureResource = ko.observable();
    this.members = ko.observable();

    this.has_announcement_shown = ko.observable(false);
    // Self permission role
    this.hasSettingPermission = ko.observable(false);

    // Conversation states for view
    this.notificationState = ko.pureComputed(() => {
      if (!this.selfUser()) {
        return NOTIFICATION_STATE.NOTHING;
      }

      const knownNotificationStates = Object.values(NOTIFICATION_STATE);
      if (knownNotificationStates.includes(this.mutedState())) {
        const isStateMentionsAndReplies = this.mutedState() === NOTIFICATION_STATE.MENTIONS_AND_REPLIES;
        const isInvalidState = isStateMentionsAndReplies && !this.selfUser().inTeam();
        return isInvalidState ? NOTIFICATION_STATE.NOTHING : this.mutedState();
      }

      if (typeof this.mutedState() === 'boolean') {
        const migratedMutedState = this.selfUser().inTeam()
          ? NOTIFICATION_STATE.MENTIONS_AND_REPLIES
          : NOTIFICATION_STATE.NOTHING;
        return this.mutedState() ? migratedMutedState : NOTIFICATION_STATE.EVERYTHING;
      }

      return NOTIFICATION_STATE.EVERYTHING;
    });

    this.is_archived = this.archivedState;
    this.is_cleared = ko.pureComputed(() => this.last_event_timestamp() <= this.cleared_timestamp());
    this.is_verified = ko.pureComputed(() => {
      if (!this._isInitialized()) {
        return undefined;
      }

      return this.allUserEntities.every(userEntity => userEntity.is_verified());
    });

    this.legalHoldStatus = ko.observable(LegalHoldStatus.DISABLED);

    this.hasLegalHold = ko.computed(() => {
      const isInitialized = this._isInitialized();
      const hasLegalHold = isInitialized && this.allUserEntities.some(userEntity => userEntity.isOnLegalHold());
      if (isInitialized) {
        this.legalHoldStatus(hasLegalHold ? LegalHoldStatus.ENABLED : LegalHoldStatus.DISABLED);
      }
      if (!hasLegalHold) {
        amplify.publish(HIDE_LEGAL_HOLD_MODAL, this.id);
      }
      return hasLegalHold;
    });

    this.blockLegalHoldMessage = false;

    this.legalHoldStatus.subscribe(legalHoldStatus => {
      if (!this.blockLegalHoldMessage && this._isInitialized()) {
        amplify.publish(WebAppEvents.CONVERSATION.INJECT_LEGAL_HOLD_MESSAGE, {
          conversationEntity: this,
          legalHoldStatus,
          userId: this.selfUser().id,
        });
      }
    });

    this.isCreatedBySelf = ko.pureComputed(
      () => this.selfUser().id === this.creator && !this.removed_from_conversation(),
    );

    this.showNotificationsEverything = ko.pureComputed(() => {
      return this.notificationState() === NOTIFICATION_STATE.EVERYTHING;
    });
    this.showNotificationsNothing = ko.pureComputed(() => {
      return this.notificationState() === NOTIFICATION_STATE.NOTHING;
    });
    this.showNotificationsMentionsAndReplies = ko.pureComputed(() => {
      return this.notificationState() === NOTIFICATION_STATE.MENTIONS_AND_REPLIES;
    });

    this.status = ko.observable(ConversationStatus.CURRENT_MEMBER);
    this.removed_from_conversation = ko.pureComputed(() => {
      return this.status() === ConversationStatus.PAST_MEMBER;
    });
    this.isActiveParticipant = ko.pureComputed(() => !this.removed_from_conversation() && !this.isGuest());
    this.isClearable = ko.pureComputed(() => !this.isRequest() && !this.is_cleared());
    this.isLeavable = ko.pureComputed(() => this.isGroup() && !this.removed_from_conversation());
    this.isMutable = ko.pureComputed(() => !this.isRequest() && !this.removed_from_conversation());

    // Messages
    this.localMessageTimer = ko.observable(null);
    this.globalMessageTimer = ko.observable(null);

    this.receiptMode = ko.observable(ReceiptMode.DELIVERY);

    this.messageTimer = ko.pureComputed(() => this.globalMessageTimer() || this.localMessageTimer());
    this.hasGlobalMessageTimer = ko.pureComputed(() => this.globalMessageTimer() > 0);

    this.messages_unordered = ko.observableArray();
    this.messages = ko.pureComputed(() => {
      const msgs = this.messages_unordered().sort((message_a, message_b) => {
        return message_a.timestamp() - message_b.timestamp();
      });
      if (msgs.length > 0) {
        this.last_message(msgs[msgs.length - 1]);
      }
      return msgs;
    });

    this.hasAdditionalMessages = ko.observable(true);

    this.messages_visible = ko
      .pureComputed(() => {
        // console.log('--sss--', this.messages_unordered().length);
        return !this.id
          ? []
          : this.messages().filter((messageEntity, index, array) => {
              const previous = index >= 1 ? array[index - 1] : undefined;
              if (previous && previous.primary_key === messageEntity.primary_key) {
                return false;
              }

              //check2
              const systemNotifies = [
                BackendEvent.NOTIFY.SYSTEM_SECRET_ID,
                BackendEvent.NOTIFY.SYSTEM_NEW_DEVICE_ID,
                BackendEvent.NOTIFY.SYSTEM_MONEY_TRANSFER_ID,
              ];
              if (systemNotifies.includes(messageEntity.from)) {
                return false;
              }

              return messageEntity.visible();
            });
      })
      .extend({trackArrayChanges: true});

    // Calling
    this.unreadState = ko.pureComputed(() => {
      const unreadState = {
        allEvents: [],
        allMessages: [],
        calls: [],
        otherMessages: [],
        pings: [],
        selfMentions: [],
        selfReplies: [],
      };

      for (let index = this.messages().length - 1; index >= 0; index--) {
        const messageEntity = this.messages()[index];
        if (messageEntity.visible()) {
          const isReadMessage = messageEntity.timestamp() <= this.last_read_timestamp() || messageEntity.user().is_me;
          if (isReadMessage) {
            break;
          }

          const isMissedCall = messageEntity.is_call() && !messageEntity.was_completed();
          const isPing = messageEntity.is_ping();
          const isMessage = messageEntity.is_content();
          const isSelfMentioned = isMessage && this.selfUser() && messageEntity.isUserMentioned(this.selfUser().id);
          const isSelfQuoted = isMessage && this.selfUser() && messageEntity.isUserQuoted(this.selfUser().id);

          if (isMissedCall || isPing || isMessage) {
            unreadState.allMessages.push(messageEntity);
          }

          if (isSelfMentioned) {
            unreadState.selfMentions.push(messageEntity);
          } else if (isSelfQuoted) {
            unreadState.selfReplies.push(messageEntity);
          } else if (isMissedCall) {
            unreadState.calls.push(messageEntity);
          } else if (isPing) {
            unreadState.pings.push(messageEntity);
          } else if (isMessage) {
            unreadState.otherMessages.push(messageEntity);
          }

          unreadState.allEvents.push(messageEntity);
        }
      }

      return unreadState;
    });

    this.hasUnread = () => {
      const lastMessage = [...this.messages()].reverse().find(message => message.isIncoming());
      return !!lastMessage && lastMessage.timestamp() > this.last_read_timestamp();
    };

    this.hasUnreadTargeted = () => {
      const selfId = this.selfUser().id;
      const lastMessage = [...this.messages()]
        .reverse()
        .find(message => !message.user().is_me && message.is_content() && message.isUserTargeted(selfId));
      return !!lastMessage && lastMessage.timestamp() > this.last_read_timestamp();
    };

    /**
     * Display name strategy:
     *
     * 'One-to-One Conversations' and 'Connection Requests':
     * We should not use the conversation name received from the backend as fallback as it will always contain the
     * name of the user who received the connection request initially
     *
     * - Name of the other participant
     * - Name of the other user of the associated connection
     * - "..." if neither of those has been attached yet
     *
     * 'Group Conversation':
     * - Conversation name received from backend
     * - If unnamed, we will create a name from the participant names
     * - Join the user's first names to a comma separated list or uses the user's first name if only one user participating
     * - "..." if the user entities have not yet been attached yet
     */
    this.display_name = ko.pureComputed(() => {
      if (this.isRequest() || this.is1to1()) {
        const [userEntity] = this.participating_user_ets();
        const userName = userEntity && userEntity.name();
        const remark = userEntity && userEntity.remark();
        if (remark) {
          return remark;
        }
        return userName ? userName : '…';
      }

      if (this.isGroup()) {
        if (this.name()) {
          return `${this.name()}(${this.memsum()})`;
        }

        const hasUserEntities = !!this.participating_user_ets().length;
        if (hasUserEntities) {
          const isJustServices = this.participating_user_ets().every(userEntity => userEntity.isService);
          const joinedNames = this.participating_user_ets()
            .filter(userEntity => isJustServices || !userEntity.isService)
            .map(userEntity => userEntity.first_name())
            .join(', ');

          const maxLength = ConversationRepository.CONFIG.GROUP.MAX_NAME_LENGTH;
          return `${truncate(joinedNames, maxLength, false)}(${this.memsum()})`;
        }

        const hasUserIds = !!this.participating_user_ids().length;
        if (!hasUserIds) {
          return `${t('conversationsEmptyConversation')}(${this.memsum()})`;
        }
      }

      return '…';
    });

    this.publishPersistState = debounce(() => amplify.publish(WebAppEvents.CONVERSATION.PERSIST_STATE, this), 100);

    this.check_users_permissions = ko.pureComputed(() => {
      if (this.isGroup()) {
        this.allUserEntities.forEach(userEntity => {
          if (userEntity.is_creator) {
            userEntity.teamRole(TEAM_ROLE.OWNER);
          } else if (this.managers().some(user_id => user_id === userEntity.id)) {
            userEntity.teamRole(TEAM_ROLE.ADMIN);
          } else {
            userEntity.teamRole(TEAM_ROLE.MEMBER);
          }
        });
      }

      if (this.isSuperGroup()) {
        this.hasSettingPermission(false);
      } else if (this.messageTimer()) {
        this.hasSettingPermission(this.messageTimer());
      } else if (this.selfUser().teamRole() === TEAM_ROLE.OWNER || this.selfUser().teamRole() === TEAM_ROLE.ADMIN) {
        this.hasSettingPermission(false);
      }
      return true;
    });

    this._initSubscriptions();
  }

  _isInitialized() {
    const hasMappedUsers = this.participating_user_ets().length || !this.participating_user_ids().length;
    return Boolean(this.selfUser() && hasMappedUsers);
  }

  _initSubscriptions() {
    [
      this.archivedState,
      this.archivedTimestamp,
      this.cleared_timestamp,
      this.members,
      this.messageTimer,
      this.isGuest,
      this.has_announcement_shown,
      this.last_event_timestamp,
      this.last_read_timestamp,
      this.last_server_timestamp,
      this.mediumPictureResource,
      this.mutedState,
      this.mutedTimestamp,
      this.place_top,
      this.name,
      this.participating_user_ids,
      this.previewPictureResource,
      this.receiptMode,
      this.status,
      this.type,
      this.verification_state,
    ].forEach(property => property.subscribe(this.persistState.bind(this)));
  }

  get allUserEntities() {
    return [this.selfUser()].concat(this.participating_user_ets());
  }

  persistState() {
    if (this.shouldPersistStateChanges) {
      this.publishPersistState();
    }
  }

  setStateChangePersistence(persistChanges) {
    this.shouldPersistStateChanges = persistChanges;
  }

  /**
   * Remove all message from conversation unless there are unread messages.
   * @returns {undefined} No return value
   */
  release() {
    if (!this.unreadState().allEvents.length) {
      this.remove_messages();
      this.is_loaded(false);
      this.hasAdditionalMessages(true);
    }
  }

  /**
   * Set the timestamp of a given type.
   * @note This will only increment timestamps
   * @param {string|number} timestamp - Timestamp to be set
   * @param {Conversation.TIMESTAMP_TYPE} type - Type of timestamp to be updated
   * @param {boolean} forceUpdate - set the timestamp regardless of previous timestamp value (no checks)
   * @returns {boolean|number} Timestamp value which can be 'false' (boolean) if there is no timestamp
   */
  setTimestamp(timestamp, type, forceUpdate = false) {
    if (typeof timestamp === 'string') {
      timestamp = window.parseInt(timestamp, 10);
    }

    const entityTimestamp = this[type];
    if (!entityTimestamp) {
      throw new z.error.ConversationError(z.error.ConversationError.TYPE.INVALID_PARAMETER);
    }

    const updatedTimestamp = forceUpdate ? timestamp : this._incrementTimeOnly(entityTimestamp(), timestamp);

    if (updatedTimestamp !== false) {
      entityTimestamp(updatedTimestamp);
    }
    return updatedTimestamp;
  }

  /**
   * Increment only on timestamp update
   * @param {number} currentTimestamp - Current timestamp
   * @param {number} updatedTimestamp - Timestamp from update
   * @returns {number|false} Updated timestamp or `false` if not increased
   */
  _incrementTimeOnly(currentTimestamp, updatedTimestamp) {
    const timestampIncreased = updatedTimestamp > currentTimestamp;
    return timestampIncreased ? updatedTimestamp : false;
  }

  /**
   * Adds a single message to the conversation.
   * @param {Message} messageEntity - Message entity to be added to the conversation.
   * @returns {Message | undefined} replacedEntity - If a message was replaced in the conversation, returns the original message
   */
  add_message(messageEntity) {
    if (messageEntity) {
      const messageWithLinkPreview = () => this._findDuplicate(messageEntity.id, messageEntity.from);
      const editedMessage = () => this._findDuplicate(messageEntity.replacing_message_id, messageEntity.from);
      const alreadyAdded = messageWithLinkPreview() || editedMessage();
      if (alreadyAdded) {
        return false;
      }

      this.update_timestamps(messageEntity);
      this.messages_unordered.push(messageEntity);
      amplify.publish(WebAppEvents.CONVERSATION.MESSAGE.ADDED, messageEntity);
      return true;
    }
  }

  /**
   * Adds multiple messages to the conversation.
   * @param {Array<Message>} message_ets - Array of message entities to be added to the conversation
   * @returns {undefined} No return value
   */
  add_messages(message_ets) {
    message_ets = message_ets.map(message_et => this._checkForDuplicate(message_et)).filter(message_et => message_et);

    // in order to avoid multiple db writes check the messages from the end and stop once
    // we found a message from self user
    for (let counter = message_ets.length - 1; counter >= 0; counter--) {
      const message_et = message_ets[counter];
      if (message_et.user() && message_et.user().is_me) {
        this.update_timestamps(message_et);
        break;
      }
    }
    koArrayPushAll(this.messages_unordered, message_ets);
  }

  getFirstUnreadSelfMention() {
    return this.unreadState()
      .selfMentions.slice()
      .pop();
  }

  get_last_known_timestamp(currentTimestamp) {
    const last_known_timestamp = Math.max(this.last_server_timestamp(), this.last_event_timestamp());
    return last_known_timestamp || currentTimestamp;
  }

  get_latest_timestamp(currentTimestamp) {
    return Math.max(this.last_server_timestamp(), this.last_event_timestamp(), currentTimestamp);
  }

  get_next_iso_date(currentTimestamp) {
    if (typeof currentTimestamp !== 'number') {
      currentTimestamp = Date.now();
    }
    const timestamp = Math.max(this.last_server_timestamp() + 1, currentTimestamp);
    return new Date(timestamp).toISOString();
  }

  getNumberOfServices() {
    return this.participating_user_ets().filter(userEntity => userEntity.isService).length;
  }

  getNumberOfParticipants(countSelf = true, countServices = true) {
    const adjustCountForSelf = countSelf && !this.removed_from_conversation() ? 1 : 0;
    const adjustCountForServices = countServices ? 0 : this.getNumberOfServices();

    return this.participating_user_ids().length + adjustCountForSelf - adjustCountForServices;
  }

  getNumberOfClients() {
    const participantsMapped = this.participating_user_ids().length === this.participating_user_ets().length;
    if (participantsMapped) {
      return this.participating_user_ets().reduce((accumulator, userEntity) => {
        return userEntity.devices().length
          ? accumulator + userEntity.devices().length
          : accumulator + ClientRepository.CONFIG.AVERAGE_NUMBER_OF_CLIENTS;
      }, this.selfUser().devices().length);
    }

    return this.getNumberOfParticipants() * ClientRepository.CONFIG.AVERAGE_NUMBER_OF_CLIENTS;
  }

  /**
   * Prepends messages with new batch of messages.
   * @param {Array<Message>} message_ets - Array of messages to be added to conversation
   * @returns {undefined} No return value
   */
  prepend_messages(message_ets) {
    message_ets = message_ets.map(message_et => this._checkForDuplicate(message_et)).filter(message_et => message_et);

    koArrayUnshiftAll(this.messages_unordered, message_ets);
  }

  /**
   * Removes message from the conversation by message id.
   * @param {string} message_id - ID of the message entity to be removed from the conversation
   * @returns {undefined} No return value
   */
  remove_message_by_id(message_id) {
    this.messages_unordered.remove(message_et => message_id && message_id === message_et.id);
  }

  /**
   * Removes messages from the conversation.
   * @param {number} [timestamp] - Optional timestamp which messages should be removed
   * @returns {undefined} No return value
   */
  remove_messages(timestamp) {
    if (timestamp && typeof timestamp === 'number') {
      return this.messages_unordered.remove(message_et => timestamp >= message_et.timestamp());
    }
    this.messages_unordered.removeAll();
  }

  shouldUnarchive() {
    if (!this.archivedState() || this.showNotificationsNothing()) {
      return false;
    }

    const isNewerMessage = messageEntity => messageEntity.timestamp() > this.archivedTimestamp();

    const {allEvents, allMessages, selfMentions, selfReplies} = this.unreadState();
    if (this.showNotificationsMentionsAndReplies()) {
      const mentionsAndReplies = selfMentions.concat(selfReplies);
      return mentionsAndReplies.some(isNewerMessage);
    }

    const hasNewMessage = allMessages.some(isNewerMessage);
    if (hasNewMessage) {
      return true;
    }

    return allEvents.some(messageEntity => {
      if (!isNewerMessage(messageEntity)) {
        return false;
      }

      const isCallActivation = messageEntity.is_call() && messageEntity.is_activation();
      const isMemberJoin = messageEntity.is_member() && messageEntity.isMemberJoin();
      const wasSelfUserAdded = isMemberJoin && messageEntity.isUserAffected(this.selfUser().id);

      return isCallActivation || wasSelfUserAdded;
    });
  }

  /**
   * Checks for message duplicates.
   *
   * @private
   * @param {Message} messageEntity - Message entity to be added to the conversation
   * @returns {Message|undefined} Message if it is not a duplicate
   */
  _checkForDuplicate(messageEntity) {
    if (messageEntity) {
      const existingMessageEntity = this._findDuplicate(messageEntity.id, messageEntity.from);
      if (existingMessageEntity) {
        // const logData = {additionalMessage: messageEntity, existingMessage: existingMessageEntity};
        // this.logger.warn(`Filtered message '${messageEntity.id}' as duplicate in view`, logData);
        return undefined;
      }
      return messageEntity;
    }
  }

  _findDuplicate(messageId, from) {
    if (messageId) {
      return this.messages_unordered().find(messageEntity => {
        const sameId = messageEntity.id === messageId;
        const sameSender = messageEntity.from === from;
        return sameId && sameSender;
      });
    }
  }

  update_timestamp_server(time, is_backend_timestamp = false) {
    if (is_backend_timestamp) {
      const timestamp = new Date(time).getTime();

      if (!isNaN(timestamp)) {
        this.setTimestamp(timestamp, Conversation.TIMESTAMP_TYPE.LAST_SERVER);
      }
    }
  }

  /**
   * Update information about conversation activity from single message.
   *
   * @private
   * @param {Message} message_et - Message to be added to conversation
   * @returns {undefined} No return value
   */
  update_timestamps(message_et) {
    if (message_et) {
      const timestamp = message_et.timestamp();

      if (timestamp <= this.last_server_timestamp()) {
        if (message_et.timestamp_affects_order()) {
          this.setTimestamp(timestamp, Conversation.TIMESTAMP_TYPE.LAST_EVENT);

          const from_self = message_et.user() && message_et.user().is_me;
          if (from_self) {
            this.setTimestamp(timestamp, Conversation.TIMESTAMP_TYPE.LAST_READ);
          }
        }
      }
    }
  }

  /**
   * Get all messages.
   * @returns {Array<Message>} Array of all message in the conversation
   */
  get_all_messages() {
    return this.messages();
  }

  /**
   * Get the first message of the conversation.
   * @returns {Message|undefined} First message entity or undefined
   */
  getFirstMessage() {
    return this.messages()[0];
  }

  /**
   * Get the last message of the conversation.
   * @returns {Message|undefined} Last message entity or undefined
   */
  getLastMessage() {
    return this.last_message();
  }

  /**
   * Get the message before a given message.
   * @param {Message} message_et - Message to look up from
   * @returns {Message | undefined} Previous message
   */
  get_previous_message(message_et) {
    const messages_visible = this.messages_visible();
    const message_index = messages_visible.indexOf(message_et);
    if (message_index > 0) {
      return messages_visible[message_index - 1];
    }
  }

  /**
   * Get the last text message that was added by self user.
   * @returns {Message} Last message edited
   */
  get_last_editable_message() {
    const messages = this.messages();
    for (let index = messages.length - 1; index >= 0; index--) {
      const message_et = messages[index];
      if (message_et.is_editable()) {
        return message_et;
      }
    }
  }

  /**
   * Get the last delivered message.
   * @returns {Message} Last delivered message
   */
  getLastDeliveredMessage() {
    return this.messages()
      .slice()
      .reverse()
      .find(messageEntity => {
        const isDelivered = messageEntity.status() >= StatusType.DELIVERED;
        return isDelivered && messageEntity.user().is_me;
      });
  }

  /**
   * Get a message by it's unique ID.
   * Only lookup in the loaded message list which is a limited view of all the messages in DB.
   *
   * @param {string} messageId - ID of message to be retrieved
   * @returns {Message|undefined} Message with ID or undefined
   */
  getMessage(messageId) {
    return this.messages().find(messageEntity => messageEntity.id === messageId);
  }

  updateGuests() {
    this.getTemporaryGuests().forEach(userEntity => userEntity.checkGuestExpiration());
  }

  getTemporaryGuests() {
    const userEntities = this.selfUser()
      ? this.participating_user_ets().concat(this.selfUser())
      : this.participating_user_ets();
    return userEntities.filter(userEntity => userEntity.isTemporaryGuest());
  }

  getUsersWithUnverifiedClients() {
    const userEntities = this.selfUser()
      ? this.participating_user_ets().concat(this.selfUser())
      : this.participating_user_ets();
    return userEntities.filter(userEntity => !userEntity.is_verified());
  }

  supportsVideoCall(isCreatingUser = false) {
    if (this.is1to1()) {
      return true;
    }

    const participantCount = this.getNumberOfParticipants(true, false);
    const passesParticipantLimit = participantCount <= Config.MAX_VIDEO_PARTICIPANTS;

    if (!passesParticipantLimit) {
      return false;
    }

    if (this.selfUser().inTeam()) {
      return true;
    }

    if (isCreatingUser) {
      return false;
    }

    return true;
  }

  serialize() {
    return {
      add_friend: this.add_friend(),
      add_right: this.add_right(),
      advisory: this.advisory(),
      archived_state: this.archivedState(),
      archived_timestamp: this.archivedTimestamp(),
      block_time: this.block_time(),
      cleared_timestamp: this.cleared_timestamp(),
      confirm: this.confirm(),
      ephemeral_timer: this.localMessageTimer(),
      forumid: this.forumid(),
      global_message_timer: this.globalMessageTimer(),
      has_announcement_shown: this.has_announcement_shown(),
      id: this.id,
      invite_code: this.invite_code(),
      is_guest: this.isGuest(),
      is_managed: this.isManaged,
      last_event_timestamp: this.last_event_timestamp(),
      last_read_timestamp: this.last_read_timestamp(),
      last_server_timestamp: this.last_server_timestamp(),
      legal_hold_status: this.legalHoldStatus(),
      mediumPictureResource: this.mediumPictureResource(),
      member_join_confirm: this.member_join_confirm(),
      members: this.members(),
      memsum: this.memsum(),
      msg_only_to_manager: this.msg_only_to_manager(),
      muted_state: this.mutedState(),
      muted_timestamp: this.mutedTimestamp(),
      name: this.name(),
      orator: this.orator(),
      others: this.participating_user_ids(),
      place_top: this.place_top(),
      previewPictureResource: this.previewPictureResource(),
      receipt_mode: this.receiptMode(),
      show_invitor_list: this.show_invitor_list(),
      status: this.status(),
      team_id: this.team_id,
      type: this.type(),
      url_invite: this.url_invite(),
      verification_state: this.verification_state(),
      view_chg_mem_notify: this.view_chg_mem_notify(),
      view_mem: this.view_mem(),
    };
  }
}
