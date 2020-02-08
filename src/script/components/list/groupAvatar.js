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

class GroupAvatar {
  constructor({conversation}) {
    const conversation_ref = 'function' === typeof conversation ? conversation() : conversation;
    this.conversation_accent_color =
      conversation_ref && conversation_ref.accent_color
        ? conversation_ref.accent_color
        : `var(--accent-color-${Math.floor(Math.random() * 7 + 1)})`;
    if (conversation_ref) {
      conversation_ref.accent_color = this.conversation_accent_color;
    }
  }
}

ko.components.register('group-avatar', {
  template: `
    <div class="group-avatar-box-wrapper" data-bind="style:{'background-color':conversation_accent_color}">
      <div class="group-avatar-box-circle-outer-1">
        <div class="group-avatar-box-circle-inner-1" data-bind="style:{'background-color':conversation_accent_color}"></div>
      </div>
      
      <div class="group-avatar-box-circle-outer-2">
        <div class="group-avatar-box-circle-inner-2" data-bind="style:{'background-color':conversation_accent_color}"></div>
      </div>
      
      <div class="group-avatar-box-circle-outer-3">
        <div class="group-avatar-box-circle-inner-3" data-bind="style:{'background-color':conversation_accent_color}"></div>
      </div>
      
      <div class="group-avatar-box-circle-outer-4">
        <div class="group-avatar-box-circle-inner-4" data-bind="style:{'background-color':conversation_accent_color}"></div>
      </div>
    </div>
  `,
  viewModel: GroupAvatar,
});

ko.components.register('group-avatar-large', {
  template: `
    <div class="group-avatar-box-wrapper-large" data-bind="style:{'background-color':conversation_accent_color}">
      <div class="group-avatar-box-circle-outer-large-1">
        <div class="group-avatar-box-circle-inner-large-1" data-bind="style:{'background-color':conversation_accent_color}"></div>
      </div>
      
      <div class="group-avatar-box-circle-outer-large-2">
        <div class="group-avatar-box-circle-inner-large-2" data-bind="style:{'background-color':conversation_accent_color}"></div>
      </div>
      
      <div class="group-avatar-box-circle-outer-large-3">
        <div class="group-avatar-box-circle-inner-large-3" data-bind="style:{'background-color':conversation_accent_color}"></div>
      </div>
      
      <div class="group-avatar-box-circle-outer-large-4">
        <div class="group-avatar-box-circle-inner-large-4" data-bind="style:{'background-color':conversation_accent_color}"></div>
      </div>
    </div>
  `,
  viewModel: GroupAvatar,
});
