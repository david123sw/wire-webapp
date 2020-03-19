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

import moment from 'moment';
import {amplify} from 'amplify';

import {t} from 'Util/LocalizerUtil';
import {includesOnlyEmojis} from 'Util/EmojiUtil';

import {EphemeralStatusType} from '../message/EphemeralStatusType';
import {WebAppEvents} from '../event/WebApp';
import {Context} from '../ui/ContextMenu';

import {SystemMessageType} from '../message/SystemMessageType';
import {StatusType} from '../message/StatusType';
import {ParticipantAvatar} from 'Components/participantAvatar';

import './asset/audioAsset';
import './asset/fileAsset';
import './asset/imageAsset';
import './asset/linkPreviewAsset';
import './asset/locationAsset';
import './asset/videoAsset';
import {SHOW_LEGAL_HOLD_MODAL} from '../view_model/content/LegalHoldModalViewModel';

import {mapProfileAssets, updateUserEntityAssets} from '../assets/AssetMapper';
import {User} from '../entity/User';
import {createRandomUuid} from 'Util/util';

import {ConversationType} from '../conversation/ConversationType';
import {BackendEvent} from '../event/Backend';
import {formatDuration} from 'Util/TimeUtil';

class Message {
  static PREVIOUS_MSG_FROM_USER = '';
  constructor(
    {
      message,
      conversation,
      selfId,
      isSelfTemporaryGuest,
      isLastDeliveredMessage,
      isMarked,
      shouldShowAvatar,
      shouldShowInvitePeople,
      onContentUpdated,
      onClickAvatar,
      onClickImage,
      onClickInvitePeople,
      onClickLikes,
      onClickMessage,
      onClickTimestamp,
      onClickParticipants,
      onClickReceipts,
      onClickResetSession,
      onClickCancelRequest,
      onLike,
      onMessageMarked,
      conversationRepository,
      actionsViewModel,
    },
    componentInfo,
  ) {
    this.message = message;
    this.conversation = conversation;
    this.hasSameSenderWithPreviousMessage =
      '' === Message.PREVIOUS_MSG_FROM_USER ? false : this.message.from === Message.PREVIOUS_MSG_FROM_USER;
    this.shouldShowAvatar = selfId() !== this.message.from;
    Message.PREVIOUS_MSG_FROM_USER =
      SystemMessageType.CONVERSATION_CREATE === message.memberMessageType ? '' : this.message.from;
    this.shouldShowInvitePeople = shouldShowInvitePeople;
    this.selfId = selfId;
    this.isSelfTemporaryGuest = isSelfTemporaryGuest;
    this.isLastDeliveredMessage = isLastDeliveredMessage;
    this.accentColor = ko.pureComputed(() => message.user().accent_color());
    this.showGroupAvatar = ko.pureComputed(
      () =>
        message.memberMessageType === SystemMessageType.CONVERSATION_CREATE &&
        message.type === BackendEvent.CONVERSATION.GROUP_CREATION,
    );
    this.one2one = ko.pureComputed(
      () =>
        ConversationType.ONE2ONE === ('function' === typeof conversation ? conversation().type() : conversation.type()),
    );
    this.fakeUser = ko.computed(() => {
      const conversation_ref = 'function' === typeof conversation ? conversation() : conversation;
      const previous =
        typeof this.fakeUser === 'function' && typeof this.fakeUser() === 'object'
          ? [this.fakeUser().previewPictureResource(), this.fakeUser().mediumPictureResource()]
          : [{identifier: ''}, {identifier: ''}];
      const preview = conversation_ref.previewPictureResource();
      const complete = conversation_ref.mediumPictureResource();
      if (preview && complete && preview.key !== previous[0].identifier && complete.key !== previous[1].identifier) {
        const user = new User(createRandomUuid());
        user.isFakeUser = true;
        const assets = [JSON.parse(JSON.stringify(preview)), JSON.parse(JSON.stringify(complete))];
        const mappedAssets = mapProfileAssets(user.id, assets);
        updateUserEntityAssets(user, mappedAssets);
        return user;
      }
      return false;
    });

    this.is_last_ephemeral_message = ko.pureComputed(() => {
      const conversation_ref = 'function' === typeof this.conversation ? this.conversation() : this.conversation;
      const messages = conversation_ref.visible_timed_messages();
      return 0 === messages.length ? false : this.message.id === messages[messages.length - 1].id;
    });

    this.onClickImage = onClickImage;
    this.onClickInvitePeople = onClickInvitePeople;
    this.onClickAvatar = onClickAvatar;
    this.onClickMessage = onClickMessage;
    this.onClickTimestamp = onClickTimestamp;
    this.onClickParticipants = onClickParticipants;
    this.onClickReceipts = onClickReceipts;
    this.onClickLikes = onClickLikes;
    this.onClickResetSession = onClickResetSession;
    this.onClickCancelRequest = onClickCancelRequest;
    this.onLike = onLike;
    this.includesOnlyEmojis = includesOnlyEmojis;
    this.ParticipantAvatar = ParticipantAvatar;

    ko.computed(
      () => {
        if (isMarked()) {
          setTimeout(() => onMessageMarked(componentInfo.element));
        }
      },
      {disposeWhenNodeIsRemoved: componentInfo.element},
    );

    this.conversationRepository = conversationRepository;
    this.EphemeralStatusType = EphemeralStatusType;
    this.StatusType = StatusType;

    if (message.has_asset_text()) {
      // add a listener to any changes to the assets. This will warn the parent that the message has changed
      this.assetSubscription = message.assets.subscribe(onContentUpdated);
      // also listen for link previews on a single Text entity
      this.previewSubscription = message.get_first_asset().previews.subscribe(onContentUpdated);
    }

    this.actionsViewModel = actionsViewModel;

    this.hasReadReceiptsTurnedOn = this.conversationRepository.expectReadReceipt(this.conversation());

    this.bindShowMore = this.bindShowMore.bind(this);

    this.readReceiptTooltip = ko.pureComputed(() => {
      const receipts = this.message.readReceipts();
      if (!receipts.length || !this.conversation().is1to1()) {
        return '';
      }
      return moment(receipts[0].time).format('L');
    });

    this.readReceiptText = ko.pureComputed(() => {
      const receipts = this.message.readReceipts();
      if (!receipts.length) {
        return '';
      }
      const is1to1 = this.conversation().is1to1();
      return is1to1 ? moment(receipts[0].time).format('LT') : receipts.length.toString(10);
    });

    this.dispose = () => {
      if (this.assetSubscription) {
        this.assetSubscription.dispose();
        this.previewSubscription.dispose();
      }
    };
  }

  getSystemMessageIconComponent(message) {
    const iconComponents = {
      [SystemMessageType.CONVERSATION_RENAME]: 'edit-icon',
      [SystemMessageType.CONVERSATION_MESSAGE_TIMER_UPDATE]: 'timer-icon',
      [SystemMessageType.CONVERSATION_RECEIPT_MODE_UPDATE]: 'read-icon',
    };
    return iconComponents[message.system_message_type];
  }

  isSystemMessageForTimerUpdate(message) {
    return SystemMessageType.CONVERSATION_MESSAGE_TIMER_UPDATE === message.system_message_type;
  }

  getSystemMessageForTimerNow(message) {
    return !message.message_timer ? '' : formatDuration(message.message_timer).text;
  }

  showDevice(messageEntity) {
    const topic = messageEntity.isSelfClient() ? WebAppEvents.PREFERENCES.MANAGE_DEVICES : WebAppEvents.SHORTCUT.PEOPLE;
    amplify.publish(topic);
  }

  showLegalHold = () => {
    amplify.publish(SHOW_LEGAL_HOLD_MODAL, this.conversationRepository.active_conversation());
  };

  showContextMenu(messageEntity, event) {
    const entries = [];

    if (messageEntity.is_downloadable()) {
      entries.push({
        click: () => messageEntity.download(),
        label: t('conversationContextMenuDownload'),
      });
    }

    if (messageEntity.isReactable() && !this.conversation().removed_from_conversation()) {
      const label = messageEntity.is_liked() ? t('conversationContextMenuUnlike') : t('conversationContextMenuLike');

      entries.push({
        click: () => this.onLike(messageEntity, false),
        label,
      });
    }

    if (messageEntity.is_editable() && !this.conversation().removed_from_conversation()) {
      entries.push({
        click: () => amplify.publish(WebAppEvents.CONVERSATION.MESSAGE.EDIT, messageEntity),
        label: t('conversationContextMenuEdit'),
      });
    }

    if (messageEntity.isReplyable() && !this.conversation().removed_from_conversation()) {
      entries.push({
        click: () => amplify.publish(WebAppEvents.CONVERSATION.MESSAGE.REPLY, messageEntity),
        label: t('conversationContextMenuReply'),
      });
    }

    if (messageEntity.isCopyable()) {
      entries.push({
        click: () => messageEntity.copy(),
        label: t('conversationContextMenuCopy'),
      });
    }

    if (
      !this.conversation().is1to1() &&
      !messageEntity.is_ephemeral() &&
      !this.conversation().removed_from_conversation()
    ) {
      entries.push({
        click: () => this.onClickReceipts(this),
        label: t('conversationContextMenuDetails'),
      });
    }

    if (messageEntity.is_deletable()) {
      entries.push({
        click: () => this.actionsViewModel.deleteMessage(this.conversation(), messageEntity),
        label: t('conversationContextMenuDelete'),
      });
    }

    const isSendingMessage = messageEntity.status() === StatusType.SENDING;
    const canDelete =
      messageEntity.user().is_me && !this.conversation().removed_from_conversation() && !isSendingMessage;
    if (canDelete) {
      entries.push({
        click: () => this.actionsViewModel.deleteMessageEveryone(this.conversation(), messageEntity),
        label: t('conversationContextMenuDeleteEveryone'),
      });
    }

    Context.from(event, entries, 'message-options-menu');
  }

  bindShowMore(elements, scope) {
    const label = elements.find(element => element.className === 'message-header-label');
    if (!label) {
      return;
    }
    const link = label.querySelector('.message-header-show-more');
    if (link) {
      link.addEventListener('click', () => this.onClickParticipants(scope.message.highlightedUsers()));
    }
  }
}

const receiptStatusTemplate = `
  <!-- ko if: isLastDeliveredMessage() && readReceiptText() === '' -->
    <span class="message-status" data-bind="text: t('conversationMessageDelivered')"></span>
  <!-- /ko -->
  <!-- ko if: readReceiptText() -->
    <span class="message-status-read" data-bind="
        css: {'message-status-read--visible': isLastDeliveredMessage(),
          'with-tooltip with-tooltip--receipt': readReceiptTooltip(),
          'message-status-read--clickable': !conversation().is1to1()},
        attr: {'data-tooltip': readReceiptTooltip()},
        click: conversation().is1to1() ? null : onClickReceipts
        "
        data-uie-name="status-message-read-receipts">
      <read-icon></read-icon>
      <span class="message-status-read__count" data-bind="text: readReceiptText()" data-uie-name="status-message-read-receipt-count"></span>
    </span>
  <!-- /ko -->
`;

const normalTemplate = `
  <!-- ko if: shouldShowAvatar && !hasSameSenderWithPreviousMessage -->
    <div class="message-header">
      <div class="message-header-icon">
        <participant-avatar class="sender-avatar" params="participant: message.user, click: onClickAvatar, size: ParticipantAvatar.SIZE.X_SMALL"></participant-avatar>
      </div>
      <div class="message-header-label">
        <span class="message-header-label-sender" data-bind='css: message.accent_color(), text: message.headerSenderName()' data-uie-name="sender-name"></span>
        <!-- ko if: message.user().isService -->
          <service-icon class="message-header-icon-service"></service-icon>
        <!-- /ko -->
        <!-- ko if: message.was_edited() -->
          <span class="message-header-label-icon icon-edit" data-bind="attr: {title: message.display_edited_timestamp()}"></span>
        <!-- /ko -->
      </div>
    </div>
  <!-- /ko -->
  
  <div class="message-body" data-bind="attr: {'title': ''}, css: {'message-body-self-special': !shouldShowAvatar}">
    <!-- ko if: message.ephemeral_status() === EphemeralStatusType.ACTIVE -->
      <ephemeral-timer class="message-ephemeral-timer" data-bind="css: {'message-ephemeral-timer-self': !shouldShowAvatar}" params="message: message"></ephemeral-timer>
    <!-- /ko -->

    <!-- ko foreach: {data: message.assets, as: 'asset', noChildContext: true} -->
      <!-- ko if: asset.is_image() -->
        <div class="text_content_background image_content_background" data-bind="css: {'text_content_background_right':!shouldShowAvatar, 'text_content_background_left':shouldShowAvatar}">
          <image-asset params="asset: asset, message: message, onClick: onClickImage"></image-asset>
        </div>
      <!-- /ko -->
      <!-- ko if: asset.is_text() -->
        <!-- ko if: asset.should_render_text -->
          <!-- ko if: shouldShowAvatar -->
            <div class="text_content_background text_content_background_left" data-bind="css: {'text_content_background_preview_down':asset.previews().length, 'message_with_quotes':message.quote()}">
              <!-- ko if: message.quote() -->
                <message-quote params="
                    conversation: conversation,
                    quote: message.quote(),
                    selfId: selfId,
                    conversationRepository: conversationRepository,
                    showDetail: onClickImage,
                    focusMessage: onClickTimestamp,
                    handleClickOnMessage: onClickMessage,
                    showUserDetails: onClickAvatar,
                    shouldShowAvatar: shouldShowAvatar,
                  "></message-quote>
              <!-- /ko -->
              <div class="text" data-bind="html: asset.render(selfId(), accentColor()), event: {click: (data, event) => onClickMessage(asset, event)}, css: {'text-large': includesOnlyEmojis(asset.text), 'text-foreground': message.status() === StatusType.SENDING, 'ephemeral-message-obfuscated': message.isObfuscated()}" dir="auto"></div>
            </div>
          <!-- /ko -->
          <!-- ko ifnot: shouldShowAvatar -->
            <div class="text_content_background text_content_background_right" data-bind="css: {'text_content_background_preview_down':asset.previews().length, 'message_with_quotes':message.quote()}">
              <!-- ko if: message.quote() -->
                <message-quote params="
                    conversation: conversation,
                    quote: message.quote(),
                    selfId: selfId,
                    conversationRepository: conversationRepository,
                    showDetail: onClickImage,
                    focusMessage: onClickTimestamp,
                    handleClickOnMessage: onClickMessage,
                    showUserDetails: onClickAvatar,
                    shouldShowAvatar: shouldShowAvatar,
                  "></message-quote>
              <!-- /ko -->
              <div class="text2nd" data-bind="html: asset.render(selfId(), accentColor()), event: {click: (data, event) => onClickMessage(asset, event)}, css: {'message_with_quotes_right': message.quote(), 'text-large': includesOnlyEmojis(asset.text), 'text-foreground': message.status() === StatusType.SENDING, 'ephemeral-message-obfuscated': message.isObfuscated()}" dir="auto"></div>
            </div>
          <!-- /ko -->
        <!-- /ko -->
        <!-- ko foreach: asset.previews() -->
          <div class="text_content_background file_content_background" data-bind="css: {'text_content_background_right':!$parent.shouldShowAvatar, 'text_content_background_left':$parent.shouldShowAvatar, 'text_content_background_preview_up':asset.text.indexOf('http') !== 0}">
            <link-preview-asset data-bind="css: {'ephemeral-asset-expired': $parent.message.isObfuscated()}" params="message: $parent.message"></link-preview-asset>
          </div>
        <!-- /ko -->
      <!-- /ko -->
      <!-- ko if: asset.is_video() -->
        <div class="video_content_background" data-bind="css: {'text_content_background_right':!shouldShowAvatar, 'text_content_background_left':shouldShowAvatar}">
          <video-asset data-bind="css: {'ephemeral-asset-expired icon-movie': message.isObfuscated()}" params="message: message"></video-asset>
        </div>
      <!-- /ko -->
      <!-- ko if: asset.is_audio() -->
        <div class="audio_content_background" data-bind="css: {'text_content_background_right':!shouldShowAvatar, 'text_content_background_left':shouldShowAvatar}">
          <audio-asset data-bind="css: {'ephemeral-asset-expired icon-microphone': message.isObfuscated()}" params="message: message, is_myself: !shouldShowAvatar"></audio-asset>
        </div>
      <!-- /ko -->
      <!-- ko if: asset.is_file() -->
        <div class="text_content_background file_content_background" data-bind="css: {'text_content_background_right':!shouldShowAvatar, 'text_content_background_left':shouldShowAvatar}">
          <file-asset data-bind="css: {'ephemeral-asset-expired icon-file': message.isObfuscated(), 'file-asset-left': shouldShowAvatar, 'file-asset-right': !shouldShowAvatar}" params="message: message"></file-asset>
        </div>
      <!-- /ko -->
      <!-- ko if: asset.is_location() -->
        <div class="text_content_background" data-bind="css: {'text_content_background_right':!shouldShowAvatar, 'text_content_background_left':shouldShowAvatar}">
          <location-asset params="asset: asset"></location-asset>
        </div>
        <div class="icon-location" data-bind="css: {'location-icon-display-right':!shouldShowAvatar, 'location-icon-display-left':shouldShowAvatar}">
        </div>
      <!-- /ko -->
      
      <!-- ko if: !message.other_likes().length && message.isReactable() -->
        <div class="message-body-like" data-bind="css: {'message-body-like-self-special': !shouldShowAvatar}">
          <span class="message-body-like-icon like-button message-show-on-hover" data-bind="attr: {'data-ui-value': message.is_liked()}, css: {'like-button-liked': message.is_liked()}, style: {opacity: message.is_liked() ? 1 : ''}, click: () => onLike(message)">
            <span class="icon-like-small"></span>
            <span class="icon-liked-small"></span>
          </span>
          <!-- ko if: shouldShowAvatar -->
            <div class="text_content_bubble_left">
              <img class="text_content_bubble_left" width="12px" height="18px" src="data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAeCAQAAAAIwb+cAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAAHdElNRQfiCQ8QKQcEL8s2AAACVElEQVQ4y52VS2vUUBTHfye5ed0k9mEfjE5fKm2tMNbC2IJ1obSdoogoFYuKogiuDAgiiH6EWc3aD+HGbyL4BVwIiuBWOxMXuZmO7TTNeC6BkJzzO4+b3L80+S8TIM1uVbFncuhJS5AuIiU9FtEXYGMhQJsOHVJrYIDCxUfj4bxYe7kDAyAMwCMkJkLvXvY+cXGARlqChcJDE+IiNxYnPjDEbGmEAfhoImKczZWzTTRIWURLsA0gJkY3rs+/FRegVBVmDxwDiAjvPqo+Q8zrSuKqEgCFQ0BIROTG91+PNHocrPZUMSIfYYAmJpypbr7XtQMup1RBeDaBbA8iwvV67Z06echtUh0JsLDNRxQSWuGdx6efYPfx7FtFnt8lyABz1WtvovoRySZUn/Asv2cAenv7XGLFRzb8TxUCWNg4uPgEhOiF2SuvotXCiXeryLJbKJM/QA8NNx5O7kpAsY2qnuIVDl4GUGHjxsxzNcHxNqy6w3Pw8AkI3HBja/qpO10i3CDy/n0Cgsr4+s74PVUpGQ6g1X4bt6+O7wYb4g0QDoC9hRmk/eO7/7X9pfNN/lix+Q/LmCfN/VFmy0ahVmaqS/F5veDO25PHIH5JU7qt9F42KoOdGVtcHqnpmnfBCvsifkoTMMd6DsuBOUqhUI5bX6jUTlzyl5y57mkB8FkOSFEvrBdlasLBmRpdXh1b03U72/aPUqBmvai8wQyjENo3p6duuQ/SRIoFMQFaeWUWgm2WkLLHb/Zolzh+k5RMP9stYc/MSoBOpmYDCWKSktJp5ZpqhPkvjptXLfZHihwAAAAASUVORK5CYII=">
            </div>
          <!-- /ko -->
          <!-- ko ifnot: shouldShowAvatar -->
            <div class="text_content_bubble_right">
              <img class="text_content_bubble_right" width="12px" height="18px" src="data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAeCAMAAACVFoclAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABwlBMVEWMjIzm9tCMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIzg78zl9M+MjIyMjIyMjIzk9M/h8MyMjIyMjIyMjIzl9c/m9tDa6MeMjIyMjIyMjIyMjIzl9c/W48SMjIyMjIyMjIyMjIzl9c/W48SNjo2MjIyMjIyMjIzm9tDa6MeVlpOMjIyMjIyMjIyMjIyMjIzm9tDe7MqfopqMjIyMjIyMjIyMjIzm9tDi8c2xuKiMjIyMjIyMjIyMjIyMjIzm9tDm9tDl9M/H0bmMjIyMjIyMjIzi8c3V4sOTlJGMjIyMjIzk9M7f7suts6WMjIyMjIzl9M/l9M/L1ryNjo3l9c/e7Mqus6WMjIzl9c/S38GXmZSMjIzl9M/i8c3H0bmNjo2MjIzl9c/g78zEzraMjIzl9c/h8MzN2b2WmJPl9c/k9M/b6cjDzLWMjIzl9c/m9tDi8s3c68nW48TM17y1vKvl9c/m9tDh8c3b6sjT4MLDzbafoprj887c68nT38HByrSanZeMjIyMjIzl9c/l9c/g78zY5sbM17ywtqeMjIzl9c/h8c3X5cXCy7WYmpXi8s3m9tDl9M/b6sivtabR3cDm9tAAAAB3Zje+AAAAlHRSTlMAAAECAwQHCQgFEH0NERAwdxYdF07+figqJRtukjYzKRyOpUA3Egqsvkg4Kx8UC8zTUDotIQbm42M7MCMYDwH694U9MicWr0QVDC3WXDkuRfaNPl7NWRn3nkIgf+WAOh6N2ncOl9yDNpruokoapv3eto9iNZ7727OJXjTouotbMyQTf/rSpXVEJlzUnGM1GfXJcC8NPlJ8fwAAAAFiS0dElQhgeoMAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAAHdElNRQfiCQ8QJQuhLMgRAAABw0lEQVQoz3WT51fTYBjFs5NCEmmKpGW1QFtA2jpoQWkrIivsPUQBpSqgZToAF6CAAwSF5w/mTZpDafrmfr2/Z55zCQKJoijCXiRJ0QzD0BSZEY6gWY4XHAxlSxQUCqIki4KJYIgbUORUFJdsIhiiGG6WqG5PqSywFJ4oA4DyikqvT+J1BENUIQKqa/xuJRB00DiiViegrv5WQygccdD5nyFvGwTcuXuvMeoUY0weQjZlCGi+/6AlnkiifS3Ew1aTgEdtj9s7SqWgdVInZNXVXeEOaT1c7qTeawT09Q8MxhMyn9Nm6DoBwyOj7aoSFjk2y4xBrsYn/I3xSSmSParMQsDU9JNK74wrGUSMAT2FPD2bnWvpmHcixpj1HDB6seAf9Chaylj5JWD16vWiOq+l9MOXwEbLb96m9fcRK1h7dW19Y/OdK8mzNPHean74uLW980mNh9KabNycs8fnL1+/7ap7M75J576civDGMd9N88fB4dFP96+oktbNnqAQc7C08djf+tQ/xyd/vag0oUkZE+Xn6uunZ//+n+95or5EWO/LoUpLAskLTgxo4UAqIsRYhsbkk6SYmMCjWjOYdrlFtXa5vQQm18+Kam2pUgAAAABJRU5ErkJggg==">
            </div>
          <!-- /ko -->
        </div>
      <!-- /ko -->
    <!-- /ko -->
    
    <div id="message-body-like-preview" class="message-body-like" data-bind="css: {'message-body-like-self-special': !shouldShowAvatar}, click: () => onLike(message)">
      <!-- ko if: shouldShowAvatar -->
        <div class="text_content_bubble_left">
          <img class="text_content_bubble_left" width="12px" height="18px" src="data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAeCAQAAAAIwb+cAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAAHdElNRQfiCQ8QKQcEL8s2AAACVElEQVQ4y52VS2vUUBTHfye5ed0k9mEfjE5fKm2tMNbC2IJ1obSdoogoFYuKogiuDAgiiH6EWc3aD+HGbyL4BVwIiuBWOxMXuZmO7TTNeC6BkJzzO4+b3L80+S8TIM1uVbFncuhJS5AuIiU9FtEXYGMhQJsOHVJrYIDCxUfj4bxYe7kDAyAMwCMkJkLvXvY+cXGARlqChcJDE+IiNxYnPjDEbGmEAfhoImKczZWzTTRIWURLsA0gJkY3rs+/FRegVBVmDxwDiAjvPqo+Q8zrSuKqEgCFQ0BIROTG91+PNHocrPZUMSIfYYAmJpypbr7XtQMup1RBeDaBbA8iwvV67Z06echtUh0JsLDNRxQSWuGdx6efYPfx7FtFnt8lyABz1WtvovoRySZUn/Asv2cAenv7XGLFRzb8TxUCWNg4uPgEhOiF2SuvotXCiXeryLJbKJM/QA8NNx5O7kpAsY2qnuIVDl4GUGHjxsxzNcHxNqy6w3Pw8AkI3HBja/qpO10i3CDy/n0Cgsr4+s74PVUpGQ6g1X4bt6+O7wYb4g0QDoC9hRmk/eO7/7X9pfNN/lix+Q/LmCfN/VFmy0ahVmaqS/F5veDO25PHIH5JU7qt9F42KoOdGVtcHqnpmnfBCvsifkoTMMd6DsuBOUqhUI5bX6jUTlzyl5y57mkB8FkOSFEvrBdlasLBmRpdXh1b03U72/aPUqBmvai8wQyjENo3p6duuQ/SRIoFMQFaeWUWgm2WkLLHb/Zolzh+k5RMP9stYc/MSoBOpmYDCWKSktJp5ZpqhPkvjptXLfZHihwAAAAASUVORK5CYII=">
        </div>
      <!-- /ko -->
      <!-- ko ifnot: shouldShowAvatar -->
        <div class="text_content_bubble_right">
          <img class="text_content_bubble_right" width="12px" height="18px" src="data:img/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAeCAMAAACVFoclAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABwlBMVEWMjIzm9tCMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIzg78zl9M+MjIyMjIyMjIzk9M/h8MyMjIyMjIyMjIzl9c/m9tDa6MeMjIyMjIyMjIyMjIzl9c/W48SMjIyMjIyMjIyMjIzl9c/W48SNjo2MjIyMjIyMjIzm9tDa6MeVlpOMjIyMjIyMjIyMjIyMjIzm9tDe7MqfopqMjIyMjIyMjIyMjIzm9tDi8c2xuKiMjIyMjIyMjIyMjIyMjIzm9tDm9tDl9M/H0bmMjIyMjIyMjIzi8c3V4sOTlJGMjIyMjIzk9M7f7suts6WMjIyMjIzl9M/l9M/L1ryNjo3l9c/e7Mqus6WMjIzl9c/S38GXmZSMjIzl9M/i8c3H0bmNjo2MjIzl9c/g78zEzraMjIzl9c/h8MzN2b2WmJPl9c/k9M/b6cjDzLWMjIzl9c/m9tDi8s3c68nW48TM17y1vKvl9c/m9tDh8c3b6sjT4MLDzbafoprj887c68nT38HByrSanZeMjIyMjIzl9c/l9c/g78zY5sbM17ywtqeMjIzl9c/h8c3X5cXCy7WYmpXi8s3m9tDl9M/b6sivtabR3cDm9tAAAAB3Zje+AAAAlHRSTlMAAAECAwQHCQgFEH0NERAwdxYdF07+figqJRtukjYzKRyOpUA3Egqsvkg4Kx8UC8zTUDotIQbm42M7MCMYDwH694U9MicWr0QVDC3WXDkuRfaNPl7NWRn3nkIgf+WAOh6N2ncOl9yDNpruokoapv3eto9iNZ7727OJXjTouotbMyQTf/rSpXVEJlzUnGM1GfXJcC8NPlJ8fwAAAAFiS0dElQhgeoMAAAAJcEhZcwAAFiUAABYlAUlSJPAAAAAHdElNRQfiCQ8QJQuhLMgRAAABw0lEQVQoz3WT51fTYBjFs5NCEmmKpGW1QFtA2jpoQWkrIivsPUQBpSqgZToAF6CAAwSF5w/mTZpDafrmfr2/Z55zCQKJoijCXiRJ0QzD0BSZEY6gWY4XHAxlSxQUCqIki4KJYIgbUORUFJdsIhiiGG6WqG5PqSywFJ4oA4DyikqvT+J1BENUIQKqa/xuJRB00DiiViegrv5WQygccdD5nyFvGwTcuXuvMeoUY0weQjZlCGi+/6AlnkiifS3Ew1aTgEdtj9s7SqWgdVInZNXVXeEOaT1c7qTeawT09Q8MxhMyn9Nm6DoBwyOj7aoSFjk2y4xBrsYn/I3xSSmSParMQsDU9JNK74wrGUSMAT2FPD2bnWvpmHcixpj1HDB6seAf9Chaylj5JWD16vWiOq+l9MOXwEbLb96m9fcRK1h7dW19Y/OdK8mzNPHean74uLW980mNh9KabNycs8fnL1+/7ap7M75J576civDGMd9N88fB4dFP96+oktbNnqAQc7C08djf+tQ/xyd/vag0oUkZE+Xn6uunZ//+n+95or5EWO/LoUpLAskLTgxo4UAqIsRYhsbkk6SYmMCjWjOYdrlFtXa5vQQm18+Kam2pUgAAAABJRU5ErkJggg==">
        </div>
      <!-- /ko -->
    </div>

    <div class="message-body-actions" data-bind="css: {'message-body-actions-self-special': !shouldShowAvatar}">
      <span class="context-menu icon-more font-size-xs" data-bind="click: (data, event) => showContextMenu(message, event)"></span>
      <!-- ko if: message.ephemeral_status() === EphemeralStatusType.ACTIVE -->
        <time class="time" data-bind="text: message.display_timestamp_short(), attr: {'data-timestamp': message.timestamp, 'data-uie-uid': message.id, 'title': message.ephemeral_caption()}, showAllTimestamps"></time>
      <!-- /ko -->
      <!-- ko ifnot: message.ephemeral_status() === EphemeralStatusType.ACTIVE -->
        <time class="time" data-bind="text: message.display_timestamp_short(), attr: {'data-timestamp': message.timestamp, 'data-uie-uid': message.id}, showAllTimestamps"></time>
      <!-- /ko -->
      ${receiptStatusTemplate}
    </div>
    
  </div>
  
  <!-- ko if: message.ephemeral_status() === EphemeralStatusType.ACTIVE -->
    <!-- ko if: is_last_ephemeral_message() -->
      <div class="timed-message-remaining-background-for-last" data-bind="css: {'timed-message-remaining-background-for-last--left': shouldShowAvatar, 'timed-message-remaining-background-for-last--right': !shouldShowAvatar}">
        <span data-bind="text: message.ephemeral_caption(), css: {'timed-message-remaining-left': shouldShowAvatar, 'timed-message-remaining-right': !shouldShowAvatar}"></span>
      </div>
    <!-- /ko -->
    
    <!-- ko ifnot: is_last_ephemeral_message() -->
      <div class="timed-message-remaining-background" data-bind="css: {'timed-message-remaining-background--left': shouldShowAvatar, 'timed-message-remaining-background--right': !shouldShowAvatar}">
        <span data-bind="text: message.ephemeral_caption(), css: {'timed-message-remaining-left': shouldShowAvatar, 'timed-message-remaining-right': !shouldShowAvatar}"></span>
      </div>
    <!-- /ko -->
  <!-- /ko -->
    
  <!-- ko if: message.other_likes().length -->
    <div class="message-footer">
      <div class="message-footer-icon">
        <span class="like-button" data-bind="attr: {'data-ui-value': message.is_liked()}, css: {'like-button-liked': message.is_liked()}, style: {opacity: message.is_liked() ? 1 : ''}, click: () => onLike(message)">
          <span class="icon-like-small"></span>
          <span class="icon-liked-small"></span>
        </span>
      </div>
      <div class="message-footer-label " data-bind="css: {'cursor-pointer': !conversation().is1to1()}, click: !conversation().is1to1() ? onClickLikes : null ">
        <span class="font-size-xs text-foreground" data-bind="text: message.like_caption(), attr: {'data-uie-value': message.reactions_user_ids()}"  data-uie-name="message-liked-names"></span>
      </div>
    </div>
  <!-- /ko -->
  

  `;

const missedTemplate = `
  <div class="message-header">
    <div class="message-header-icon">
      <span class="icon-sysmsg-error text-red"></span>
    </div>
    <div class="message-header-label" data-bind="text: t('conversationMissedMessages')"></div>
  </div>
  `;

const unableToDecryptTemplate = `
  <div class="message-header">
    <div class="message-header-icon">
      <span class="icon-sysmsg-error text-red"></span>
    </div>
    <div class="message-header-label ellipsis">
      <span data-bind="html: message.htmlCaption()"></span>
      <span>&nbsp;</span>
      <a class="accent-text" data-bind="text: t('conversationUnableToDecryptLink'), attr: {'href': message.link}" rel="nofollow noopener noreferrer" target="_blank"></a>
      <hr class="message-header-line" />
    </div>
  </div>
  <div class="message-body message-body-decrypt-error">
    <div class="message-header-decrypt-error-label" data-bind="html: message.htmlErrorMessage()"></div>
    <!-- ko if: message.is_recoverable -->
      <div class="message-header-decrypt-reset-session">
        <loading-icon class="accent-fill" data-bind="style : {visibility : message.is_resetting_session() ? 'visible' : 'hidden'}" data-uie-name="status-loading"></loading-icon>
        <span class="message-header-decrypt-reset-session-action button-label accent-text"
              data-bind="click: () => onClickResetSession(message), text: t('conversationUnableToDecryptResetSession'), style : {visibility : !message.is_resetting_session() ? 'visible' : 'hidden'}"></span>
      </div>
    <!-- /ko -->
  </div>
  `;

const systemTemplate = `
  <div class="message-header">
    <div class="message-header-icon message-header-icon--svg text-foreground">
      <span data-bind="component: getSystemMessageIconComponent(message)"></span>
    </div>
    <div class="message-header-label">
      <span class="message-header-sender-name" data-bind='text: message.unsafeSenderName()'></span>
      <!-- ko if: isSystemMessageForTimerUpdate(message) -->
        <span class="ellipsis" data-bind="text: message.caption()"></span>
        <span class="system-message-timer" data-bind='text: getSystemMessageForTimerNow(message)'></span>
      <!-- /ko -->
      
      <!-- ko ifnot: isSystemMessageForTimerUpdate(message) -->
        <span class="ellipsis" data-bind="text: message.caption()"></span>
      <!-- /ko -->
      <hr class="message-header-line" />
    </div>
    <div class="message-body-actions">
      <time class="time" data-bind="text: message.display_timestamp_short(), attr: {'data-timestamp': message.timestamp}, showAllTimestamps"></time>
    </div>
  </div>
  <div class="message-body font-weight-bold" data-bind="text: message.name"></div>
  `;

const pingTemplate = `
  <div class="message-header">
    <div class="message-header-icon">
      <div class="icon-ping" data-bind="css: message.get_icon_classes"></div>
    </div>
    <div class="message-header-label" data-bind="attr: {title: message.ephemeral_caption()}, css: {'ephemeral-message-obfuscated': message.isObfuscated()}">
      <span class="message-header-sender-name" data-bind='text: message.unsafeSenderName()'></span>
      <span class="ellipsis" data-bind="text: message.caption"></span>
    </div>
    <div class="message-body-actions">
      <time class="time" data-bind="text: message.display_timestamp_short(), attr: {'data-timestamp': message.timestamp}, showAllTimestamps"></time>
      ${receiptStatusTemplate}
    </div>
  </div>
  `;

const deleteTemplate = `
  <div class="message-header">
    <div class="message-header-icon">
      <participant-avatar class="sender-avatar" params="participant: message.user, click: onClickAvatar, size: ParticipantAvatar.SIZE.X_SMALL"></participant-avatar>
    </div>
    <div class="message-header-label">
      <span class="message-header-label-sender" data-bind='text: message.unsafeSenderName()'></span>
      <span class="message-header-label-icon icon-trash" data-bind="attr: {title: message.display_deleted_timestamp()}"></span>
    </div>
    <div class="message-body-actions message-body-actions-large">
      <time class="time" data-bind="text: message.display_deleted_timestamp(), attr: {'data-timestamp': message.deleted_timestamp, 'data-uie-uid': message.id}, showAllTimestamps" data-uie-name="item-message-delete-timestamp"></time>
    </div>
  </div>
  `;

const legalHoldTemplate = `
  <div class="message-header">
    <div class="message-header-icon">
      <legal-hold-dot></legal-hold-dot>
    </div>
    <div class="message-header-label">
      <!-- ko if: message.isActivationMessage -->
        <span data-bind="text: t('legalHoldActivated')"></span>
        <span class="message-header-label__learn-more" data-bind="click: showLegalHold, text: t('legalHoldActivatedLearnMore')"></span>
      <!-- /ko -->
      <!-- ko ifnot: message.isActivationMessage -->
        <span class="message-header-label" data-bind="text: t('legalHoldDeactivated')"></span>
      <!-- /ko -->
    </div>
  </div>
  `;

const verificationTemplate = `
  <div class="message-header">
    <div class="message-header-icon">
      <!-- ko if: message.isTypeVerified() -->
        <verified-icon></verified-icon>
      <!-- /ko -->
      <!-- ko ifnot: message.isTypeVerified() -->
        <not-verified-icon></not-verified-icon>
      <!-- /ko -->
    </div>
    <div class="message-header-label">
      <!-- ko if: message.isTypeVerified() -->
        <span data-bind="text: t('tooltipConversationAllVerified')"></span>
      <!-- /ko -->
      <!-- ko if: message.isTypeUnverified() -->
        <span class="message-header-sender-name" data-bind="text: message.unsafeSenderName()"></span>
        <span class="ellipsis" data-bind="text: t('conversationDeviceUnverified')"></span>
        <span class="message-verification-action accent-text" data-bind="click: () => showDevice(message), text: message.captionUnverifiedDevice" data-uie-name="go-devices"></span>
      <!-- /ko -->
      <!-- ko if: message.isTypeNewDevice() -->
        <span class="message-header-plain-sender-name" data-bind='text: message.captionUser'></span>
        <span class="ellipsis" data-bind="text: message.captionStartedUsing"></span>
        <span class="message-verification-action accent-text" data-bind="click: () => showDevice(message), text: message.captionNewDevice" data-uie-name="go-devices"></span>
      <!-- /ko -->
      <!-- ko if: message.isTypeNewMember() -->
        <span class="ellipsis" data-bind="text: t('conversationDeviceNewPeopleJoined')"></span>&nbsp;<span class="message-verification-action accent-text" data-bind="click: () => showDevice(message), text: t('conversationDeviceNewPeopleJoinedVerify')" data-uie-name="go-devices"></span>
      <!-- /ko -->
      <hr class="message-header-line" />
    </div>
  </div>
  `;

const callTemplate = `
  <div class="message-header">
    <div class="message-header-icon message-header-icon--svg">
      <!-- ko if: message.was_completed() -->
        <div class="svg-green"><pickup-icon></pickup-icon></div>
      <!-- /ko -->
      <!-- ko if: !message.was_completed() -->
        <div class="svg-red"><hangup-icon></hangup-icon></div>
      <!-- /ko -->
    </div>
    <div class="message-header-label">
      <span class="message-header-sender-name" data-bind='text: message.unsafeSenderName()'></span>
      <span class="ellipsis" data-bind="text: message.caption()"></span>
    </div>
    <div class="message-body-actions">
      <time class="time" data-bind="text: message.display_timestamp_short(), attr: {'data-timestamp': message.timestamp}, showAllTimestamps"></time>
    </div>
  </div>
  `;

const memberTemplate = `
  <!-- ko if: !one2one() && showGroupAvatar() -->
    <div class="message-connected">
      <div class="avatar-halo-large">
        <!-- ko if: fakeUser() -->
          <participant-avatar params="participant: fakeUser(), size: ParticipantAvatar.SIZE.X_LARGE, conversation: conversation"></participant-avatar>
        <!-- /ko -->
        <!-- ko ifnot: fakeUser() -->
          <group-avatar-large params="conversation: conversation"></group-avatar-large>
        <!-- /ko -->
      </div>
    </div>
  <!-- /ko -->
  
  <!-- ko if: message.showLargeAvatar() -->
    <div class="message-connected">
      <span class="message-connected-header" data-bind='text: message.otherUser().name()'></span>
      <!-- ko if: message.otherUser().isService -->
        <span class="message-connected-provider-name" data-bind='text: message.otherUser().providerName()'></span>
      <!-- /ko -->
      <!-- ko ifnot: message.otherUser().isService -->
        <span class="message-connected-username label-username" data-bind='text: message.otherUser().username()'></span>
      <!-- /ko -->
      <participant-avatar class="message-connected-avatar avatar-no-badge cursor-default"
                   data-bind="css: {'avatar-no-badge': message.otherUser().isOutgoingRequest()}"
                   params="participant: message.otherUser, size: ParticipantAvatar.SIZE.X_LARGE"></participant-avatar>
      <!-- ko if: message.otherUser().isOutgoingRequest() -->
        <div class="message-connected-cancel accent-text"
             data-bind="click: () => onClickCancelRequest(message),
                        text: t('conversationConnectionCancelRequest')"
             data-uie-name="do-cancel-request"></div>
      <!-- /ko -->
      <!-- ko if: message.showServicesWarning -->
        <div class="message-services-warning" data-bind="text: t('conversationServicesWarning')" data-uie-name="label-services-warning"></div>
      <!-- /ko -->
    </div>
  <!-- /ko -->
  <!-- ko ifnot: message.showLargeAvatar() -->
    <!-- ko if: message.showNamedCreation() -->
      <div class="message-group-creation-header">
        <div class="message-group-creation-header-text" data-bind="html: message.htmlGroupCreationHeader()"></div>
        <div class="message-group-creation-header-name" data-bind="text: message.name()"></div>
      </div>
    <!-- /ko -->

    <!-- ko if: message.hasUsers() -->
      <div class="message-header" data-bind="template: {afterRender: bindShowMore}">
        <div class="message-header-icon message-header-icon--svg text-foreground">
          <message-icon data-bind="visible: message.isGroupCreation()"></message-icon>
          <span class="icon-minus" data-bind="visible: message.isMemberRemoval()"></span>
          <span class="icon-plus" data-bind="visible: message.isMemberJoin()"></span>
        </div>
        <div class="message-header-label">
          <span class="message-header-caption" data-bind="html: message.htmlCaption()"></span>
          <hr class="message-header-line" />
        </div>
        <!-- ko if: message.isMemberChange() -->
          <div class="message-body-actions">
            <time class="time" data-bind="text: message.display_timestamp_short(), attr: {'data-timestamp': message.timestamp}, showAllTimestamps"></time>
          </div>
        <!-- /ko -->
      </div>
      <!-- ko if: message.showServicesWarning -->
        <div class="message-services-warning" data-bind="text: t('conversationServicesWarning')" data-uie-name="label-services-warning"></div>
      <!-- /ko -->
    <!-- /ko -->

    <!-- ko if: message.isGroupCreation() -->
      <!-- ko if: shouldShowInvitePeople -->
        <div class="message-member-footer">
          <div data-bind="text: t('guestRoomConversationHead')"></div>
          <div class="message-member-footer-button" data-bind="click: onClickInvitePeople, text: t('guestRoomConversationButton')" data-uie-name="do-invite-people"></div>
        </div>
      <!-- /ko -->
      <!-- ko if: isSelfTemporaryGuest -->
        <div class="message-member-footer">
          <div class="message-member-footer-message" data-bind="text: t('temporaryGuestJoinMessage')"></div>
          <div class="message-member-footer-description" data-bind="text: t('temporaryGuestJoinDescription')"></div>
        </div>
      <!-- /ko -->
      <!-- ko if: hasReadReceiptsTurnedOn -->
        <div class="message-header" data-uie-name="label-group-creation-receipts">
          <div class="message-header-icon message-header-icon--svg text-foreground">
            <read-icon></read-icon>
          </div>
          <div class="message-header-label">
            <span class="ellipsis" data-bind="text: t('conversationCreateReceiptsEnabled')"></span>
            <hr class="message-header-line" />
          </div>
        </div>
      <!-- /ko -->
    <!-- /ko -->

    <!-- ko if: message.isMemberLeave() && message.user().is_me && isSelfTemporaryGuest -->
      <div class="message-member-footer">
        <div class="message-member-footer-description" data-bind="text: t('temporaryGuestLeaveDescription')"></div>
      </div>
    <!-- /ko -->
  <!-- /ko -->  `;

ko.components.register('message', {
  template: `
    <!-- ko if: message.super_type === 'normal' -->
      ${normalTemplate}
    <!-- /ko -->
    <!-- ko if: message.super_type === 'missed' -->
      ${missedTemplate}
    <!-- /ko -->
    <!-- ko if: message.super_type === 'unable-to-decrypt' -->
      ${unableToDecryptTemplate}
    <!-- /ko -->
    <!-- ko if: message.super_type === 'verification' -->
      ${verificationTemplate}
    <!-- /ko -->
    <!-- ko if: message.super_type === 'delete' -->
      ${deleteTemplate}
    <!-- /ko -->
    <!-- ko if: message.super_type === 'call' -->
      ${callTemplate}
    <!-- /ko -->
    <!-- ko if: message.super_type === 'system' -->
      ${systemTemplate}
    <!-- /ko -->
    <!-- ko if: message.super_type === 'member' -->
      ${memberTemplate}
    <!-- /ko -->
    <!-- ko if: message.super_type === 'ping' -->
      ${pingTemplate}
    <!-- /ko -->
    <!-- ko if: message.isLegalHold() -->
      ${legalHoldTemplate}
    <!-- /ko -->
    `,
  viewModel: {
    createViewModel: (params, componentInfo) => new Message(params, componentInfo),
  },
});
