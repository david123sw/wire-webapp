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

import ko from 'knockout';

import {createRandomUuid, noop} from 'Util/util';

import {ParticipantAvatar} from 'Components/participantAvatar';
import {generateCellState, transDesc} from '../../conversation/ConversationCellState';
import {ConversationStatusIcon} from '../../conversation/ConversationStatusIcon';
import {Conversation} from '../../entity/Conversation';
import {MediaType} from '../../media/MediaType';
import {viewportObserver} from '../../ui/viewportObserver';

import 'Components/availabilityState';
import {BackendEvent} from '../../event/Backend';
import {ClientEvent} from '../../event/Client';

import {t} from 'Util/LocalizerUtil';
import {mapProfileAssets, updateUserEntityAssets} from '../../assets/AssetMapper';
import {NOTIFICATION_STATE} from '../../conversation/NotificationSetting';
import {AssetPayload} from '../../entity/message/Asset';
import {User} from '../../entity/User';

interface ConversationListCellProps {
  showJoinButton: boolean;
  conversation: Conversation;
  onJoinCall: (conversation: Conversation, mediaType: MediaType) => void;
  is_selected: (conversation: Conversation) => boolean;
  click: () => void;
  index: ko.Observable<number>;
  isVisibleFunc: (top: number, bottom: number) => boolean;
  offsetTop: ko.Observable<number>;
}

class ConversationListCell {
  conversation: Conversation;
  isSelected: ko.Computed<boolean>;
  on_click: () => void;
  ParticipantAvatar: typeof ParticipantAvatar;
  showJoinButton: boolean;
  isGroup: boolean;
  is1To1: boolean;
  isInTeam: boolean;
  place_top: ko.Computed<boolean>;
  mutedState: ko.Computed<number | boolean>;
  fakeUser: ko.Computed<User | boolean>;
  isInViewport: ko.Observable<boolean>;
  users: any;
  refresh_lock: boolean;
  cell_state: ko.Observable<ReturnType<typeof generateCellState>>;
  ConversationStatusIcon: typeof ConversationStatusIcon;
  onClickJoinCall: (viewModel: ConversationListCell, event: MouseEvent) => void;
  dispose: () => void;
  constructor(
    {
      showJoinButton,
      conversation,
      onJoinCall,
      is_selected = () => false,
      click = noop,
      index = ko.observable(0),
      isVisibleFunc = () => false,
      offsetTop = ko.observable(0),
    }: ConversationListCellProps,
    element: HTMLElement,
  ) {
    this.conversation = conversation;
    this.refresh_lock = false;
    this.isSelected = ko.computed(() => {
      const status = is_selected(conversation);
      if (status) {
        conversation.check_users_permissions();
      }
      return status;
    });

    // "click" should be renamed to "right_click"
    this.on_click = click;
    this.ParticipantAvatar = ParticipantAvatar;
    this.showJoinButton = showJoinButton;
    this.isGroup = conversation.isGroup();
    this.is1To1 = conversation.is1to1();
    this.isInTeam = conversation.selfUser().inTeam();
    this.place_top = ko.computed(() => conversation.place_top());
    this.mutedState = ko.computed(() => conversation.mutedState());
    this.fakeUser = ko.computed(() => {
      const preview = conversation.previewPictureResource();
      const complete = conversation.mediumPictureResource();
      if (preview && complete) {
        const user = new User(createRandomUuid());
        user.isFakeUser = true;
        const assets: AssetPayload[] = [JSON.parse(JSON.stringify(preview)), JSON.parse(JSON.stringify(complete))];
        const mappedAssets = mapProfileAssets(user.id, assets);
        updateUserEntityAssets(user, mappedAssets);
        return user;
      } else {
        return false;
      }
    });

    const cellHeight = 56;
    const cellTop = index() * cellHeight + offsetTop();
    const cellBottom = cellTop + cellHeight;

    /*
     *  We did use getBoundingClientRect to determine the initial visibility
     *  of an element, but this proved to be a major bottleneck with lots
     *  of <conversation-list-cell>s
     */
    const isInitiallyVisible = isVisibleFunc(cellTop, cellBottom);

    this.isInViewport = ko.observable(isInitiallyVisible);

    if (!isInitiallyVisible) {
      viewportObserver.trackElement(
        element,
        (isInViewport: boolean) => {
          if (isInViewport) {
            this.isInViewport(true);
            viewportObserver.removeElement(element);
          }
        },
        false,
        undefined,
      );
    }

    this.users = this.conversation.participating_user_ets;

    this.cell_state = ko.observable({icon: null, description: null});

    this.ConversationStatusIcon = ConversationStatusIcon;

    this.onClickJoinCall = (viewModel, event) => {
      event.preventDefault();
      onJoinCall(conversation, MediaType.AUDIO);
    };

    const cellStateObservable = ko
      .computed(() => {
        const current = this.cell_state().description;
        const next = generateCellState(this.conversation);
        if (NOTIFICATION_STATE.NOTHING === this.mutedState()) {
          if (this.isSelected()) {
            if (next.description !== '' && next.description !== current) {
              next.icon = null;
              this.cell_state(next);
              this.refresh_lock = true;
            }
          } else {
            if (0 < this.conversation.unreadState().allMessages.length) {
              next.description = t(
                'conversationsSecondaryLineSummaryMessage',
                this.conversation.unreadState().allMessages.length,
              );
              next.icon = null;
              this.cell_state(next);
              this.refresh_lock = true;
            }
          }
        } else if (next.description !== '' && next.description !== current) {
          this.cell_state(next);
          this.refresh_lock = true;
        }

        if (!this.refresh_lock) {
          window.wire.app.repository.conversation.getPrecedingMessagesAsLast(this.conversation).then((events: any) => {
            const last = events[0];
            if (last) {
              let prefix = '';
              if (this.conversation.isGroup()) {
                const user_from = this.conversation.allUserEntities.filter(userEntity => {
                  return userEntity.id === last.from;
                });
                if (0 < user_from.length) {
                  prefix =
                    this.conversation.selfUser().id === user_from[0].id
                      ? `${t('extra_special_message_type_4_to_1')}: `
                      : `${user_from[0].remark() ? user_from[0].remark() : user_from[0].name()}: `;
                }
              }

              if (ClientEvent.CONVERSATION.MESSAGE_ADD === last.type) {
                this.cell_state({
                  description: last.data.content
                    ? last.data.previews.length > 0
                      ? `${prefix}${t('notificationSharedLink')}`
                      : `${prefix}${last.data.content}`
                    : '',
                  icon: this.cell_state().icon,
                });
              } else if (BackendEvent.CONVERSATION.MEMBER_LEAVE === last.type) {
                const desc = last.data.user_names
                  ? transDesc('conversationsSecondaryLinePersonLeft', last.data.user_names.join(','))
                  : '';
                this.cell_state({icon: this.cell_state().icon, description: desc});
              } else if (BackendEvent.CONVERSATION.MEMBER_JOIN === last.type) {
                const add_id = last.from;
                const added_ids = last.data.user_ids.slice(0);
                added_ids.unshift(add_id);
                const added_names: string[] = [];
                for (let i = 0; i < added_ids.length; ++i) {
                  this.conversation.allUserEntities.map(userEntity => {
                    if (userEntity.id === added_ids[i]) {
                      if (this.conversation.selfUser().id === added_ids[i]) {
                        added_names.push(t('extra_special_message_type_4_to_1'));
                      } else {
                        added_names.push(userEntity.remark() ? userEntity.remark() : userEntity.name());
                      }
                    }
                  });
                }
                //系统消息单独处理，暂不显示
                const desc =
                  add_id === BackendEvent.NOTIFY.SYSTEM_SECRET_ID
                    ? ''
                    : added_names[0] + t('conversationsSecondaryLinePersonAdded', added_names.slice(1).join(','));
                this.cell_state({
                  description: desc,
                  icon: this.cell_state().icon,
                });
              } else if (
                ClientEvent.CONVERSATION.VOICE_CHANNEL_ACTIVATE === last.type ||
                ClientEvent.CONVERSATION.VOICE_CHANNEL_DEACTIVATE === last.type
              ) {
                this.cell_state({
                  description: `${prefix}${t('conversationVoiceChannelDeactivate')}`,
                  icon: this.cell_state().icon,
                });
              } else if (ClientEvent.CONVERSATION.ASSET_ADD === last.type) {
                let asset = '';
                if (last.data.content_type.startsWith('image')) {
                  asset = t('notificationAssetAdd');
                } else if (last.data.content_type.startsWith('video')) {
                  asset = t('notificationSharedVideo');
                } else if (last.data.content_type.startsWith('audio')) {
                  asset = t('notificationSharedAudio');
                } else {
                  asset = t('notificationSharedFile');
                }
                this.cell_state({
                  description: `${prefix}${asset}`,
                  icon: this.cell_state().icon,
                });
              }
              this.refresh_lock = true;
            }
          });
        }
      })
      .extend({rateLimit: 500});

    this.dispose = () => {
      viewportObserver.removeElement(element);
      cellStateObservable.dispose();
      this.isSelected.dispose();
    };
  }
}

ko.components.register('conversation-list-cell', {
  template: `
    <div class="conversation-list-cell" data-bind="attr: {'data-uie-uid': conversation.id, 'data-uie-value': conversation.display_name()}, css: {'conversation-list-cell-active': isSelected()}">
    <!-- ko if: isInViewport() -->
      <div class="conversation-list-cell-left" data-bind="css: {'conversation-list-cell-left-opaque': conversation.removed_from_conversation() || conversation.participating_user_ids().length === 0}">
        <!-- ko if: isGroup -->
          <div class="avatar-halo">
            <!-- ko if: fakeUser() -->
              <participant-avatar params="participant: fakeUser(), size: ParticipantAvatar.SIZE.SMALL, conversation: conversation"></participant-avatar>
            <!-- /ko -->
            <!-- ko ifnot: fakeUser() -->
              <group-avatar params="conversation: conversation"></group-avatar>
            <!-- /ko -->
          </div>
        <!-- /ko -->
        <!-- ko if: !isGroup && users().length -->
          <div class="avatar-halo">
            <participant-avatar params="participant: users()[0], size: ParticipantAvatar.SIZE.SMALL"></participant-avatar>
          </div>
        <!-- /ko -->
      </div>
      <div class="conversation-list-cell-center">
        <!-- ko if: is1To1 && isInTeam -->
          <availability-state class="conversation-list-cell-availability"
                              data-uie-name="status-availability-item"
                              params="availability: conversation.availabilityOfUser, label: conversation.display_name(), theme: isSelected()">
          </availability-state>
        <!-- /ko -->
        <!-- ko ifnot: is1To1 && isInTeam -->
          <span class="conversation-list-cell-name" data-bind="text: conversation.display_name(), css: {'accent-text': isSelected()}"></span>
        <!-- /ko -->
        <span class="conversation-list-cell-description" data-bind="text: cell_state().description" data-uie-name="secondary-line"></span>
      </div>
      <div class="conversation-list-cell-right">
        <!-- ko ifnot: showJoinButton -->
          <!-- ko if: cell_state().icon === ConversationStatusIcon.PENDING_CONNECTION -->
            <span class="conversation-list-cell-badge cell-badge-dark" data-uie-name="status-pending"><pending-icon class="svg-icon"></pending-icon></span>
          <!-- /ko -->
          <!-- ko if: cell_state().icon === ConversationStatusIcon.UNREAD_MENTION -->
            <span class="conversation-list-cell-badge cell-badge-light" data-uie-name="status-mention"><mention-icon class="svg-icon"></mention-icon></span>
          <!-- /ko -->
          <!-- ko if: cell_state().icon === ConversationStatusIcon.UNREAD_REPLY -->
            <span class="conversation-list-cell-badge cell-badge-light" data-uie-name="status-reply"><reply-icon class="svg-icon"></reply-icon></span>
          <!-- /ko -->
          <!-- ko if: cell_state().icon === ConversationStatusIcon.UNREAD_PING -->
            <span class="conversation-list-cell-badge cell-badge-light" data-uie-name="status-ping"><ping-icon class="svg-icon"></ping-icon></span>
          <!-- /ko -->
          <!-- ko if: cell_state().icon === ConversationStatusIcon.MISSED_CALL -->
            <span class="conversation-list-cell-badge cell-badge-light" data-uie-name="status-missed-call"><hangup-icon class="svg-icon"></hangup-icon></span>
          <!-- /ko -->
          <!-- ko if: cell_state().icon === ConversationStatusIcon.UNREAD_MESSAGES && conversation.unreadState().allMessages.length > 0 -->
            <span class="conversation-list-cell-badge cell-badge-light" data-bind="text: conversation.unreadState().allMessages.length" data-uie-name="status-unread"></span>
          <!-- /ko -->
        <!-- /ko -->
        <!-- ko if: place_top() -->
          <span class="conversation-list-cell-badge cell-badge-dark-new conversation-muted" data-uie-name="status-sticky"><sticky-icon class="svg-icon"></sticky-icon></span>
        <!-- /ko -->
        <!-- ko if: mutedState() -->
          <span class="conversation-list-cell-badge cell-badge-dark conversation-muted" data-uie-name="status-silence"><mute-icon class="svg-icon"></mute-icon></span>
        <!-- /ko -->
        <span class="conversation-list-cell-context-menu" data-bind="click: (_, event) => on_click(conversation, event)" data-uie-name="go-options"></span>
        <!-- ko if: showJoinButton -->
          <div class="call-ui__button call-ui__button--green call-ui__button--join" data-bind="click: onClickJoinCall, text: t('callJoin')" data-uie-name="do-call-controls-call-join"></div>
        <!-- /ko -->
      </div>
      <!-- /ko -->
    </div>
  `,
  viewModel: {
    createViewModel: (props: ConversationListCellProps, componentInfo: any) =>
      new ConversationListCell(props, componentInfo.element),
  },
});
