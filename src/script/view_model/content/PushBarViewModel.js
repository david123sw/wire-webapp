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

import {getLogger} from 'Util/Logger';
import {TIME_IN_MILLIS} from 'Util/TimeUtil';
import {ConversationVerificationState} from '../../conversation/ConversationVerificationState';

window.z = window.z || {};
window.z.viewModel = z.viewModel || {};
window.z.viewModel.content = z.viewModel.content || {};

// Parent: ContentViewModel
z.viewModel.content.PushBarViewModel = class PushBarViewModel {
  constructor(callingViewModel, panelViewModel, contentViewModel, repositories) {
    this.addedToView = this.addedToView.bind(this);

    this.callingViewModel = callingViewModel;
    this.callingRepository = repositories.calling;
    this.conversationRepository = repositories.conversation;
    this.userRepository = repositories.user;
    this.multitasking = contentViewModel.multitasking;
    this.logger = getLogger('z.viewModel.content.PushBarViewModel');

    this.panelViewModel = panelViewModel;
    this.contentViewModel = contentViewModel;

    this.panelIsVisible = this.panelViewModel.isVisible;

    // TODO remove the titlebar for now to ensure that buttons are clickable in macOS wrappers
    window.setTimeout(() => $('.pushbar').remove(), TIME_IN_MILLIS.SECOND);

    this.conversationEntity = this.conversationRepository.active_conversation;
    this.ConversationVerificationState = ConversationVerificationState;

    this.joinedCall = this.callingRepository.joinedCall;
    this.isActivatedAccount = this.userRepository.isActivatedAccount;
  }

  clickOnDetails() {
    this.panelViewModel.togglePanel(z.viewModel.PanelViewModel.STATE.CONVERSATION_DETAILS);
  }

  onClose() {
    if (this.conversationEntity()) {
      this.conversationEntity().has_announcement_shown(true);
    }
  }

  addedToView() {
    //blank
  }
};
