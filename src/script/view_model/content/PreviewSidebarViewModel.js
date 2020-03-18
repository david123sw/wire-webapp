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
import {WebAppEvents} from '../../event/WebApp';

window.z = window.z || {};
window.z.viewModel = z.viewModel || {};

z.viewModel.PreviewSidebarViewModel = class PreviewSidebarViewModel {
  /**
   * View model for the list column.
   * @param {MainViewModel} mainViewModel - Main view model
   * @param {Object} repositories - Object containing all the repositories
   */

  static get LType() {
    return {
      OPEN_NEAREST_LIST: 'open_nearest_list',
      OPEN_PEOPLE: 'open_people',
      OPEN_SETTING: 'open_setting',
    };
  }

  constructor(listViewModel, repositories) {
    this.logger = getLogger('z.viewModel.content.PreviewSidebarViewModel');

    this.elementId = 'preview-left-sidebar-column';
    this.conversationRepository = repositories.conversation;
    this.userRepository = repositories.user;
    this.listViewModel = listViewModel;

    this.selfUser = this.userRepository.self;

    this.rightType = ko.observable(z.viewModel.PreviewSidebarViewModel.LType.OPEN_NEAREST_LIST);

    this.webappLoaded = ko.observable(false);
    amplify.subscribe(WebAppEvents.LIFECYCLE.LOADED, () => this.webappLoaded(true));

    amplify.subscribe(WebAppEvents.RIGHT_NAVIGATE.OPEN_NEAREST_LIST, this.changeTag.bind(this));

    ko.applyBindings(this, document.getElementById(this.elementId));
  }
  changeTag(type) {
    if (this.rightType() !== type) {
      this.rightType(type);
      switch (type) {
        case z.viewModel.PreviewSidebarViewModel.LType.OPEN_NEAREST_LIST:
          this.listViewModel.openNearList();
          break;
        case z.viewModel.PreviewSidebarViewModel.LType.OPEN_PEOPLE:
          this.listViewModel.switchList(z.viewModel.ListViewModel.STATE.START_UI);
          break;
        case z.viewModel.PreviewSidebarViewModel.LType.OPEN_SETTING:
          amplify.publish(WebAppEvents.PREFERENCES.MANAGE_ACCOUNT);
          break;
      }
    }
  }
};
