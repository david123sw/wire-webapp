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

import {BasePanelViewModel} from './BasePanelViewModel';
import {MotionDuration} from '../../motion/MotionDuration';
import {ConversationType} from '../../conversation/ConversationType';

export class ConversationParticipantsViewModel extends BasePanelViewModel {
  static get STATE() {
    return {
      DEFAULT: 'ConversationParticipantsViewModel.STATE.DEFAULT',
      MODIFY_ADMIN: 'ConversationParticipantsViewModel.STATE.MODIFY_ADMIN',
      MODIFY_MANAGER: 'ConversationParticipantsViewModel.STATE.MODIFY_MANAGER',
      MODIFY_ORATOR: 'ConversationParticipantsViewModel.STATE.MODIFY_ORATOR',
    };
  }
  constructor(params) {
    super(params);
    this.clickOnShowUser = this.clickOnShowUser.bind(this);

    const repositories = params.repositories;
    this.searchRepository = repositories.search;
    this.teamRepository = repositories.team;
    this.conversationRepository = repositories.conversation;
    this.onGoBack = params.onGoBack;
    this.alreadyExist = ko.observable('');

    this.participants = ko.observableArray([]);

    this.highlightedUsers = ko.observable([]);

    this.searchInput = ko.observable('');
    this.MotionDuration = MotionDuration;
    this.lastId = null;
  }

  getElementId() {
    return 'conversation-participants';
  }

  clickOnShowUser(userEntity) {
    if (this.mode === ConversationParticipantsViewModel.STATE.MODIFY_ORATOR) {
      if (this.alreadyExist()) {
        const idx = this.alreadyExist().findIndex(userId => {
          return userId === userEntity.id;
        });
        if (idx === -1) {
          this.alreadyExist().push(userEntity.id);
          this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
            orator: this.alreadyExist(),
          });
          this.activeConversation().orator(this.alreadyExist());
        } else {
          return;
        }
      }
      this.onGoBack();
    } else if (this.mode === ConversationParticipantsViewModel.STATE.MODIFY_ADMIN) {
      if (this.alreadyExist()) {
        const idx = this.alreadyExist().findIndex(userId => {
          return userId === userEntity.id;
        });
        if (idx === -1) {
          this.alreadyExist().push(userEntity.id);
          this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
            man_add: [userEntity.id],
          });
          this.activeConversation().managers(this.alreadyExist());
        } else {
          return;
        }
      }
      this.onGoBack();
    } else if (this.mode === ConversationParticipantsViewModel.STATE.MODIFY_MANAGER) {
      if (this.alreadyExist()) {
        const idx = this.alreadyExist().findIndex(userId => {
          return userId === userEntity.id;
        });
        if (idx === -1) {
          this.alreadyExist().push(userEntity.id);
          this.conversationRepository.conversation_service.postModifyGroupManager(
            this.activeConversation().id,
            userEntity.id,
          );
        } else {
          return;
        }
      }
      this.onGoBack();
    } else {
      this.navigateTo(z.viewModel.PanelViewModel.STATE.GROUP_PARTICIPANT_USER, {entity: userEntity});
    }
  }

  onPushMore() {
    this.updateMembers(true);
  }
  onScrollInit() {}

  updateMembers(isMore = false) {
    if (this.activeConversation()) {
      if (this.activeConversation().type() === ConversationType.SUPER_GROUP) {
        this.conversationRepository.getBigGroupUser(this.activeConversation(), 30, this.lastId).then(users => {
          if (users.length > 0) {
            this.lastId = users[users.length - 1].id;
          }
          users.map(userEntity => {
            if (this.alreadyExist()) {
              userEntity.isAlready =
                this.alreadyExist().findIndex(userId => {
                  return userId === userEntity.id;
                }) !== -1;
            } else {
              userEntity.isAlready = false;
            }
            if (userEntity.id !== this.activeConversation().creator) {
              userEntity.is_creator = false;
              this.participants.push(userEntity);
            } else {
              userEntity.is_creator = true;
              this.participants.unshift(userEntity);
            }
          });
        });
      } else if (!isMore) {
        this.activeConversation()
          .participating_user_ets()
          .map(userEntity => {
            if (this.alreadyExist()) {
              userEntity.isAlready =
                this.alreadyExist().findIndex(userId => {
                  return userId === userEntity.id;
                }) !== -1;
            } else {
              userEntity.isAlready = false;
            }
            if (userEntity.id !== this.activeConversation().creator) {
              userEntity.is_creator = false;
              this.participants.push(userEntity);
            } else {
              userEntity.is_creator = true;
              this.participants.unshift(userEntity);
            }
          });
        const selfUser = this.activeConversation().selfUser();
        if (this.alreadyExist()) {
          selfUser.isAlready =
            this.alreadyExist().findIndex(userId => {
              return userId === selfUser.id;
            }) !== -1;
        } else {
          selfUser.isAlready = false;
        }
        this.participants.unshift(selfUser);
      }
    } else {
      this.participants.removeAll();
    }
  }

  initView(params) {
    this.searchInput('');
    this.highlightedUsers(params && params.highlightedUsers ? params.highlightedUsers : []);
    if (params && params.mode) {
      this.mode = params.mode;
      this.alreadyExist(params.exist ? params.exist : []);
    } else {
      this.mode = ConversationParticipantsViewModel.STATE.DEFAULT;
      this.alreadyExist(null);
    }
    this.lastId = null;
    this.participants.removeAll();
    this.updateMembers();
  }
}
