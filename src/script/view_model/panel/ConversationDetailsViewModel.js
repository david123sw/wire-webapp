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
import {formatDuration} from 'Util/TimeUtil';
import {removeLineBreaks} from 'Util/StringUtil';

import 'Components/receiptModeToggle';
import {BasePanelViewModel} from './BasePanelViewModel';

import {getNotificationText} from '../../conversation/NotificationSetting';
import {ConversationVerificationState} from '../../conversation/ConversationVerificationState';
import {WebAppEvents} from '../../event/WebApp';
import {Shortcut} from '../../ui/Shortcut';
import {ShortcutType} from '../../ui/ShortcutType';
import {ConversationRepository} from '../../conversation/ConversationRepository';

import 'Components/panel/panelActions';

import {mapProfileAssets, updateUserEntityAssets} from '../../assets/AssetMapper';
import {User} from '../../entity/User';
import {createRandomUuid, koArrayPushAll} from 'Util/util';
import {ParticipantAvatar} from 'Components/participantAvatar';
import {modals, ModalsViewModel} from '../ModalsViewModel';
import {validateProfileImageResolution} from 'Util/util';
import {ConversationType} from '../../conversation/ConversationType';

export class ConversationDetailsViewModel extends BasePanelViewModel {
  static get CONFIG() {
    return {
      AVATAR_IMG_SIZE: 32,
      AVATAR_IMG_TYPES: ['image/bmp', 'image/jpeg', 'image/jpg', 'image/png', '.jpg-large'],
      MAX_USERS_VISIBLE: 6,
      REDUCED_USERS_COUNT: 4,
    };
  }

  constructor(params) {
    super(params);
    this.clickOnShowService = this.clickOnShowService.bind(this);
    this.clickOnShowUser = this.clickOnShowUser.bind(this);
    this.updateConversationReceiptMode = this.updateConversationReceiptMode.bind(this);

    const {mainViewModel, repositories} = params;

    const {conversation, integration, search, team, user} = repositories;
    this.conversationRepository = conversation;
    this.integrationRepository = integration;
    this.searchRepository = search;
    this.teamRepository = team;
    this.userRepository = user;

    this.ConversationRepository = ConversationRepository;

    this.actionsViewModel = mainViewModel.actions;

    this.logger = getLogger('z.viewModel.panel.ConversationDetailsViewModel');

    this.isActivatedAccount = this.userRepository.isActivatedAccount;
    this.isTeam = this.teamRepository.isTeam;

    this.ParticipantAvatar = ParticipantAvatar;

    this.GroupAvatarFileTypes = ConversationDetailsViewModel.CONFIG.AVATAR_IMG_TYPES.join(',');

    this.isTeamOnly = ko.pureComputed(() => this.activeConversation() && this.activeConversation().isTeamOnly());

    this.serviceParticipants = ko.observableArray();
    this.userParticipants = ko.observableArray();
    this.showAllUsersCount = ko.observable(0);
    this.selectedService = ko.observable();

    this.isEditingAnnouncement = ko.observable(false);
    this.enableDisplayAnnouncement = ko.pureComputed(() => {
      if (this.activeConversation().isCreator()) {
      } else {
        return true;
      }
    });
    this.firstParticipant = ko.pureComputed(() => {
      return this.activeConversation() && this.activeConversation().firstUserEntity();
    });

    this.has_modify_permissions = ko.pureComputed(() => {
      return this.activeConversation() && this.activeConversation().hasSettingPermission();
    });

    this.isSingleUserMode = conversationEntity => {
      return conversationEntity && (conversationEntity.is1to1() || conversationEntity.isRequest());
    };

    this.isActiveGroupParticipant = ko.pureComputed(() => {
      return this.activeConversation()
        ? this.activeConversation().isGroup() && this.activeConversation().isActiveParticipant()
        : false;
    });

    // Details avatar
    this.fakeUser = ko.pureComputed(() => {
      const preview = this.activeConversation().previewPictureResource();
      const complete = this.activeConversation().mediumPictureResource();
      if (preview && complete) {
        const user_et = new User(createRandomUuid());
        user_et.isFakeUser = true;
        const assets = [JSON.parse(JSON.stringify(preview)), JSON.parse(JSON.stringify(complete))];
        const mappedAssets = mapProfileAssets(user_et.id, assets);
        updateUserEntityAssets(user_et, mappedAssets);
        return user_et;
      }
      return false;
    });

    this.isSuperGroup = ko.pureComputed(() => {
      if (!this.activeConversation().isActiveParticipant() || !this.activeConversation()) {
        return false;
      }
      return !this.activeConversation().isSuperGroup();
    });

    this.isVerified = ko.pureComputed(() => {
      return this.activeConversation()
        ? this.activeConversation().verification_state() === ConversationVerificationState.VERIFIED
        : false;
    });

    this.inviteCode = ko.pureComputed(() => {
      if (!this.activeConversation().isGroup()) {
        return false;
      }
      return this.conversationRepository.getInviteUrl(this.activeConversation());
    });

    this.isEditingName = ko.observable(false);

    this.isEditingName.subscribe(isEditing => {
      if (isEditing) {
        return window.setTimeout(() => $('.conversation-details__name--input').focus(), 0);
      }
      const name = $('.conversation-details__name--input');
      $('.conversation-details__name').css('height', `${name.height()}px`);
    });

    this.isServiceMode = ko.pureComputed(() => {
      return (
        this.isSingleUserMode(this.activeConversation()) && this.firstParticipant() && this.firstParticipant().isService
      );
    });

    this.showTopActions = ko.pureComputed(() => this.isActiveGroupParticipant() || this.showSectionOptions());

    this.showActionAddParticipants = this.isActiveGroupParticipant;

    this.showActionMute = ko.pureComputed(() => {
      return this.activeConversation() && this.activeConversation().isMutable() && !this.isTeam();
    });

    this.showOptionGuests = ko.pureComputed(() => {
      return this.isActiveGroupParticipant() && this.activeConversation().inTeam();
    });

    this.showOptionReadReceipts = ko.pureComputed(() => this.activeConversation().inTeam());

    this.hasReceiptsEnabled = ko.pureComputed(() => {
      return this.conversationRepository.expectReadReceipt(this.activeConversation());
    });

    this.hasAdvancedNotifications = ko.pureComputed(() => {
      return this.activeConversation() && this.activeConversation().isMutable() && this.isTeam();
    });

    this.showOptionNotificationsGroup = ko.pureComputed(() => {
      return this.hasAdvancedNotifications() && this.activeConversation().isGroup();
    });

    this.showOptionNotifications1To1 = ko.pureComputed(() => {
      return this.hasAdvancedNotifications() && !this.activeConversation().isGroup();
    });

    this.showOptionTimedMessages = ko.pureComputed(() => {
      if (this.activeConversation().is1to1()) {
        return true;
      } else if (this.activeConversation().isGroup()) {
        if (this.activeConversation().hasSettingPermission()) {
          return true;
        }
        return !this.activeConversation().hasGlobalMessageTimer();
      }

      return false;
    });

    this.showSectionOptions = ko.pureComputed(() => {
      return this.showOptionGuests() || this.showOptionNotificationsGroup() || this.showOptionTimedMessages();
    });

    this.participantsUserText = ko.pureComputed(() => {
      const hasMultipleParticipants = this.userParticipants().length > 1;
      return hasMultipleParticipants
        ? t('conversationDetailsParticipantsUsersMany')
        : t('conversationDetailsParticipantsUsersOne');
    });

    this.participantsServiceText = ko.pureComputed(() => {
      const hasMultipleParticipants = this.serviceParticipants().length > 1;
      return hasMultipleParticipants
        ? t('conversationDetailsParticipantsServicesMany')
        : t('conversationDetailsParticipantsServicesOne');
    });

    this.guestOptionsText = ko.pureComputed(() => {
      return this.isTeamOnly() ? t('conversationDetailsGuestsOff') : t('conversationDetailsGuestsOn');
    });

    this.notificationStatusText = ko.pureComputed(() => {
      return this.activeConversation() ? getNotificationText(this.activeConversation().notificationState()) : '';
    });

    this.timedMessagesText = ko.pureComputed(() => {
      if (this.activeConversation()) {
        const hasTimer = this.activeConversation().messageTimer();
        if (hasTimer) {
          return formatDuration(this.activeConversation().messageTimer()).text;
        }
      }
      return t('ephemeralUnitsNone');
    });

    const addPeopleShortcut = Shortcut.getShortcutTooltip(ShortcutType.ADD_PEOPLE);
    this.addPeopleTooltip = ko.pureComputed(() => {
      return t('tooltipConversationDetailsAddPeople', addPeopleShortcut);
    });

    this.isServiceMode.subscribe(isService => {
      if (isService) {
        const entity = this.firstParticipant();
        this.integrationRepository.getServiceFromUser(entity).then(serviceEntity => {
          this.selectedService(serviceEntity);
          this.integrationRepository.addProviderNameToParticipant(serviceEntity);
        });
      }
    });
  }

  getConversationActions(conversationEntity) {
    if (!conversationEntity) {
      return [];
    }

    const is1to1 = conversationEntity.is1to1();
    const isSingleUserMode = this.isSingleUserMode(conversationEntity);

    const allMenuElements = [
      {
        condition: () => z.userPermission().canCreateGroupConversation() && is1to1 && !this.isServiceMode(),
        item: {
          click: () => this.clickOnCreateGroup(),
          icon: 'group-icon',
          identifier: 'go-create-group',
          label: t('conversationDetailsActionCreateGroup'),
        },
      },
      {
        condition: () => conversationEntity.isRequest(),
        item: {
          click: () => this.clickToCancelRequest(),
          icon: 'close-icon',
          identifier: 'do-cancel-request',
          label: t('conversationDetailsActionCancelRequest'),
        },
      },
      {
        condition: () => conversationEntity.isClearable(),
        item: {
          click: () => this.clickToClear(),
          icon: 'eraser-icon',
          identifier: 'do-clear',
          label: t('conversationDetailsActionClear'),
        },
      },
      {
        condition: () => {
          const firstUser = conversationEntity.firstUserEntity();
          return isSingleUserMode && firstUser && (firstUser.isConnected() || firstUser.isRequest());
        },
        item: {
          click: () => this.clickToBlock(),
          icon: 'block-icon',
          identifier: 'do-block',
          label: t('conversationDetailsActionBlock'),
        },
      },
      {
        condition: () => conversationEntity.isLeavable(),
        item: {
          click: () => this.clickToLeave(),
          icon: 'leave-icon',
          identifier: 'do-leave',
          label: t('conversationDetailsActionLeave'),
        },
      },
      {
        condition: () => !isSingleUserMode && this.isTeam() && conversationEntity.isCreatedBySelf(),
        item: {
          click: () => this.clickToDelete(),
          icon: 'delete-icon',
          identifier: 'do-delete',
          label: t('conversationDetailsActionDelete'),
        },
      },
    ];

    return allMenuElements.filter(menuElement => menuElement.condition()).map(menuElement => menuElement.item);
  }

  getElementId() {
    return 'conversation-details';
  }

  clickOnAddParticipants() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.ADD_PARTICIPANTS);
  }

  clickOnShowAll() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.CONVERSATION_PARTICIPANTS);
  }

  clickManager() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.CONVERSATION_MANAGER);
  }

  clickOnCreateGroup() {
    amplify.publish(WebAppEvents.CONVERSATION.CREATE_GROUP, 'conversation_details', this.firstParticipant());
  }

  clickOnDevices() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.PARTICIPANT_DEVICES, {entity: this.firstParticipant()});
  }

  clickOnGuestOptions() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.GUEST_OPTIONS);
  }

  clickOnTimedMessages() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.TIMED_MESSAGES);
  }

  clickOnNotifications() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.NOTIFICATIONS);
  }

  clickOnShowUser(userEntity) {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.GROUP_PARTICIPANT_USER, {entity: userEntity});
  }

  clickOnShowService(serviceEntity) {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.GROUP_PARTICIPANT_SERVICE, {entity: serviceEntity});
  }

  clickToArchive() {
    this.actionsViewModel.archiveConversation(this.activeConversation());
  }

  clickToBlock() {
    if (this.activeConversation()) {
      const userEntity = this.activeConversation().firstUserEntity();
      const nextConversationEntity = this.conversationRepository.get_next_conversation(this.activeConversation());

      this.actionsViewModel.blockUser(userEntity, true, nextConversationEntity);
    }
  }

  clickToCancelRequest() {
    if (this.activeConversation()) {
      const userEntity = this.activeConversation().firstUserEntity();
      const nextConversationEntity = this.conversationRepository.get_next_conversation(this.activeConversation());

      this.actionsViewModel.cancelConnectionRequest(userEntity, true, nextConversationEntity);
    }
  }
  clickToClear() {
    this.actionsViewModel.clearConversation(this.activeConversation());
  }
  onAnnounceSubmit(data, event) {
    let advisory = $('.conversation-details__announcement').val();
    advisory = advisory.trim();
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      advisory: advisory,
    });
    this.activeConversation().advisory(advisory);
    this.isEditingAnnouncement(false);
  }
  onAnnounceCancel() {
    const isEditing = this.isEditingAnnouncement();
    if (!isEditing) {
      $('.conversation-details__announcement').focus();
      this.preAnnouncementText = this.activeConversation().advisory();
    } else {
      this.activeConversation().advisory(this.preAnnouncementText);
    }
    this.isEditingAnnouncement(!isEditing);
  }
  clickToEditGroupName() {
    if (this.isActiveGroupParticipant()) {
      this.isEditingName(true);
    }
  }

  clickOnChangePicture(files) {
    const [newUserPicture] = Array.from(files);
    this.setPicture(newUserPicture).catch(error => {
      const isInvalidUpdate = error.type === z.error.UserError.TYPE.INVALID_UPDATE;
      if (!isInvalidUpdate) {
        throw error;
      }
    });
  }

  setPicture(newUserPicture) {
    const isTooLarge = newUserPicture.size > z.config.MAXIMUM_IMAGE_FILE_SIZE;
    if (isTooLarge) {
      const maximumSizeInMB = z.config.MAXIMUM_IMAGE_FILE_SIZE / 1024 / 1024;
      const messageString = t('modalPictureTooLargeMessage', maximumSizeInMB);
      const titleString = t('modalPictureTooLargeHeadline');

      return this._showUploadWarning(titleString, messageString);
    }

    const isWrongFormat = !ConversationDetailsViewModel.CONFIG.AVATAR_IMG_TYPES.includes(newUserPicture.type);
    if (isWrongFormat) {
      const titleString = t('modalPictureFileFormatHeadline');
      const messageString = t('modalPictureFileFormatMessage');

      return this._showUploadWarning(titleString, messageString);
    }

    const minHeight = ConversationDetailsViewModel.CONFIG.AVATAR_IMG_SIZE;
    const minWidth = ConversationDetailsViewModel.CONFIG.AVATAR_IMG_SIZE;

    return validateProfileImageResolution(newUserPicture, minWidth, minHeight).then(isValid => {
      if (isValid) {
        return this.conversationRepository.change_picture(this.activeConversation(), newUserPicture);
      }

      const messageString = t('modalPictureTooSmallMessage');
      const titleString = t('modalPictureTooSmallHeadline');
      return this._showUploadWarning(titleString, messageString);
    });
  }

  _showUploadWarning(title, message) {
    const modalOptions = {text: {message, title}};
    modals.showModal(ModalsViewModel.TYPE.ACKNOWLEDGE, modalOptions);

    return Promise.reject(new z.error.UserError(z.error.UserError.TYPE.INVALID_UPDATE));
  }

  clickToLeave() {
    this.actionsViewModel.leaveConversation(this.activeConversation());
  }

  clickToDelete() {
    this.actionsViewModel.deleteConversation(this.activeConversation());
  }

  clickToToggleMute() {
    this.actionsViewModel.toggleMuteConversation(this.activeConversation());
  }

  renameConversation(data, event) {
    if (this.activeConversation()) {
      const currentConversationName = this.activeConversation()
        .display_name()
        .trim();

      const newConversationName = removeLineBreaks(event.target.value.trim());

      this.isEditingName(false);
      const hasNameChanged = newConversationName.length && newConversationName !== currentConversationName;
      if (hasNameChanged) {
        event.target.value = currentConversationName;
        this.conversationRepository.renameConversation(this.activeConversation(), newConversationName);
      }
    }
  }

  updateConversationReceiptMode(conversationEntity, receiptMode) {
    this.conversationRepository.updateConversationReceiptMode(conversationEntity, receiptMode);
  }
  initView() {
    if (this.activeConversation()) {
      this.serviceParticipants.removeAll();
      this.userParticipants.removeAll();
      let userParticipants = [];
      let groupCreatorEntity = undefined;
      if (this.activeConversation().type() === ConversationType.SUPER_GROUP) {
        this.conversationRepository.getBigGroupUser(this.activeConversation(), 4).then(users => {
          userParticipants = userParticipants.concat(users);
          userParticipants.unshift(this.activeConversation().selfUser());
          userParticipants.map(userEntity => {
            userEntity.is_creator = userEntity.id === this.activeConversation().creator;
          });
          koArrayPushAll(this.userParticipants, userParticipants);
          this.showAllUsersCount(this.activeConversation().memsum());
        });
      } else {
        this.activeConversation()
          .participating_user_ets()
          .map(userEntity => {
            if (userEntity.isService) {
              return this.serviceParticipants.push(userEntity);
            }
            if (userEntity.id !== this.activeConversation().creator) {
              userParticipants.push(userEntity);
            } else {
              groupCreatorEntity = userEntity;
            }
          });
        if (groupCreatorEntity) {
          userParticipants.unshift(groupCreatorEntity);
        }
        userParticipants.unshift(this.activeConversation().selfUser());
        userParticipants.map(userEntity => {
          userEntity.is_creator = userEntity.id === this.activeConversation().creator;
        });
        const userCount = userParticipants.length;
        const exceedsMaxUserCount = userCount > ConversationDetailsViewModel.CONFIG.MAX_USERS_VISIBLE;
        if (exceedsMaxUserCount) {
          userParticipants.splice(ConversationDetailsViewModel.CONFIG.REDUCED_USERS_COUNT);
        }
        koArrayPushAll(this.userParticipants, userParticipants);
        this.showAllUsersCount(this.activeConversation().memsum());
      }
    }
  }
}
