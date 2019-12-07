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
// require(`Resource/translation/${navigator.language.substr(0, 5)}.json`);

export enum GENERIC_MESSAGE_TYPE {
  ASSET = 'asset',
  AVAILABILITY = 'availability',
  CALLING = 'calling',
  CLEARED = 'cleared',
  CLIENT_ACTION = 'clientAction',
  CONFIRMATION = 'confirmation',
  DELETED = 'deleted',
  EDITED = 'edited',
  EPHEMERAL = 'ephemeral',
  EXTERNAL = 'external',
  HIDDEN = 'hidden',
  IMAGE = 'image',
  KNOCK = 'knock',
  LAST_READ = 'lastRead',
  LOCATION = 'location',
  REACTION = 'reaction',
  TEXT = 'text',
}

export enum EXTRA_SPECIAL_MESSAGE_TYPE {
  RED_PACKET = '1',
  TRANSFER_MONEY = '2',
  AUTO_REPLY = '3',
  OPEN_RED_PACKET = '4',
  VIRTUAL_CURRENCIES_OPERATION = '5',
  TRANSFER_VIRTUAL_CURRENCIES_OPERATION = '6',
  SOCIAL_FRIEND_INVITE = '7',
  OTC_MINI_PROGRAM_INVITE = '8',
  OTC_MINI_PROGRAM_SHARE = '9',
  JOIN_GROUP_FAST_LINK_ONLY_IOS = '10',
  INVITE_PERSONS_JOIN_GROUP_FAST_LINK_ONLY_IOS = '11',
  INVITE_FRIENDS_JOIN_GROUP = '12',
  SHARE_OPERATION_FOR_RECORD_TEMPLATE = '13',
  SHARE_OPERATION_FOR_NEWS_TEMPLATE = '14',
  SHARE_OPERATION_FOR_SOCIAL_PICTURE_TEMPLATE = '15',
  SHARE_OPERATION_FOR_SOCIAL_VIDEO_TEMPLATE = '16',
  SHARE_OPERATION_FOR_SOCIAL_AUDIO_TEMPLATE = '17',
  SHARE_OPERATION_FOR_SOCIAL_TEXT_TEMPLATE = '18',
}

export enum EXTRA_SPECIAL_MESSAGE_TYPE_REMINDER {
  RED_PACKET = 'extra_special_message_type_1',
  TRANSFER_MONEY = 'extra_special_message_type_2',
  AUTO_REPLY = 'extra_special_message_type_3',
  OPEN_RED_PACKET = 'extra_special_message_type_4',
  VIRTUAL_CURRENCIES_OPERATION = 'extra_special_message_type_5',
  TRANSFER_VIRTUAL_CURRENCIES_OPERATION = 'extra_special_message_type_6',
  SOCIAL_FRIEND_INVITE = 'extra_special_message_type_7',
  OTC_MINI_PROGRAM_INVITE = 'extra_special_message_type_8',
  OTC_MINI_PROGRAM_SHARE = 'extra_special_message_type_9',
  JOIN_GROUP_FAST_LINK_ONLY_IOS = 'extra_special_message_type_10',
  INVITE_PERSONS_JOIN_GROUP_FAST_LINK_ONLY_IOS = 'extra_special_message_type_11',
  INVITE_FRIENDS_JOIN_GROUP = 'extra_special_message_type_12',
  SHARE_OPERATION_FOR_RECORD_TEMPLATE = 'extra_special_message_type_13',
  SHARE_OPERATION_FOR_NEWS_TEMPLATE = 'extra_special_message_type_14',
  SHARE_OPERATION_FOR_SOCIAL_PICTURE_TEMPLATE = 'extra_special_message_type_15',
  SHARE_OPERATION_FOR_SOCIAL_VIDEO_TEMPLATE = 'extra_special_message_type_16',
  SHARE_OPERATION_FOR_SOCIAL_AUDIO_TEMPLATE = 'extra_special_message_type_17',
  SHARE_OPERATION_FOR_SOCIAL_TEXT_TEMPLATE = 'extra_special_message_type_18',
}
