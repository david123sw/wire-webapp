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

enum CONTACT_IMPORT {
  MACOS = 'contact_import.macos',
}

enum EMOJI {
  REPLACE_INLINE = 'settings.emoji.replace_inline',
}

enum INTERFACE {
  THEME = 'settings.interface.theme',
}

enum PREVIEWS {
  SEND = 'settings.previews.send',
}

enum PROPERTIES {
  ENABLE_DEBUGGING = 'enable_debugging',
  NOTIFICATIONS = 'settings.notifications',
  PRIVACY = 'settings.privacy.improve_wire',
  SOUND_ALERTS = 'settings.sound.alerts',
  VERSION = 'version',
}

const PROPERTIES_TYPE = {
  ...PROPERTIES,
  CONTACT_IMPORT,
  EMOJI,
  INTERFACE,
  PREVIEWS,
};

export {PROPERTIES_TYPE};
