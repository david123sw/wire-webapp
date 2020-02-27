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

    this.participants = ko.pureComputed(() => {
      if (this.activeConversation()) {
        const userParticipants = [];
        let groupCreatorEntity = undefined;

        this.activeConversation()
          .participating_user_ets()
          .map(userEntity => {
            if (userEntity.id !== this.activeConversation().creator) {
              userParticipants.push(userEntity);
            } else {
              groupCreatorEntity = userEntity;
            }
            if (this.alreadyExist()) {
              userEntity.isAlready =
                this.alreadyExist().findIndex(userId => {
                  return userId === userEntity.id;
                }) !== -1;
            } else {
              userEntity.isAlready = false;
            }
          });

        if (groupCreatorEntity) {
          userParticipants.unshift(groupCreatorEntity);
        }
        const selfUser = this.activeConversation().selfUser();
        if (this.alreadyExist()) {
          selfUser.isAlready =
            this.alreadyExist().findIndex(userId => {
              return userId === selfUser.id;
            }) !== -1;
        } else {
          selfUser.isAlready = false;
        }
        userParticipants.unshift(selfUser);
        userParticipants.map(userEntity => {
          userEntity.is_creator = userEntity.id === this.activeConversation().creator;
        });
        return userParticipants;
      }
      return [];
    });

    this.highlightedUsers = ko.observable([]);

    this.searchInput = ko.observable('');
    this.MotionDuration = MotionDuration;
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
  }
}
