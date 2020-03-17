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
import {t} from 'Util/LocalizerUtil';
import {WebAppEvents} from '../../event/WebApp';
import {Shortcut} from '../../ui/Shortcut';
import {ShortcutType} from '../../ui/ShortcutType';

window.z = window.z || {};
window.z.viewModel = z.viewModel || {};

z.viewModel.PreviewSidebarViewModel = class PreviewSidebarViewModel {
  /**
   * View model for the list column.
   * @param {MainViewModel} mainViewModel - Main view model
   * @param {Object} repositories - Object containing all the repositories
   */
  constructor(mainViewModel, repositories) {
    // this.switchList = this.switchList.bind(this);
    // this.onContextMenu = this.onContextMenu.bind(this);
    this.logger = getLogger('z.viewModel.content.PreviewSidebarViewModel');

    this.elementId = 'sidebar-column';
    this.conversationRepository = repositories.conversation;
    this.callingRepository = repositories.calling;
    this.teamRepository = repositories.team;
    this.userRepository = repositories.user;
    this.preferenceNotificationRepository = repositories.preferenceNotification;

    this.actionsViewModel = mainViewModel.actions;
    this.contentViewModel = mainViewModel.content;
    this.panelViewModel = mainViewModel.panel;

    this.isActivatedAccount = this.userRepository.isActivatedAccount;
    this.isProAccount = this.teamRepository.isTeam;
    this.selfUser = this.userRepository.self;

    const startShortcut = Shortcut.getShortcutTooltip(ShortcutType.START);
    this.startTooltip = t('tooltipConversationsStart', startShortcut);
    this.conversationsTooltip = t('conversationViewTooltip');
    this.foldersTooltip = t('folderViewTooltip');

    this.showRecentConversations = ko.observable(true);
    this.showRecentConversations.subscribe(() => {
      const conversationList = document.querySelector('.conversation-list');
      if (conversationList) {
        conversationList.scrollTop = 0;
      }
    });
    this.showBadge = ko.pureComputed(() => {
      return this.preferenceNotificationRepository.notifications().length > 0;
    });
  }

  clickOnPreferencesButton() {
    amplify.publish(WebAppEvents.PREFERENCES.MANAGE_ACCOUNT);
  }

  clickOnPeopleButton() {
    if (this.isActivatedAccount()) {
      // this.listViewModel.switchList(z.viewModel.ListViewModel.STATE.START_UI);
    }
  }
};
