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
import {NOTIFICATION_STATE, getNotificationText} from '../../conversation/NotificationSetting';

export class NotificationsViewModel extends BasePanelViewModel {
  constructor(params) {
    super(params);

    this.notificationChanged = this.notificationChanged.bind(this);

    this.conversationRepository = params.repositories.conversation;

    this.settings = Object.values(NOTIFICATION_STATE).map(status => ({
      text: getNotificationText(status),
      value: status,
    }));

    this.currentNotificationSetting = ko.observable();

    ko.pureComputed(() => {
      return this.activeConversation() && this.activeConversation().notificationState();
    }).subscribe(setting => {
      this.currentNotificationSetting(setting);
    });
  }

  notificationChanged(viewModel, event) {
    const notificationState = parseInt(event.target.value, 10);
    this.conversationRepository.setNotificationState(this.activeConversation(), notificationState);
  }

  getElementId() {
    return 'notification-settings';
  }
}
