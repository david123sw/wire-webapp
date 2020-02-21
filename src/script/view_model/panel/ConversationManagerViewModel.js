import {BasePanelViewModel} from './BasePanelViewModel';

export class ConversationManagerViewModel extends BasePanelViewModel {
  constructor(params) {
    super(params);

    const repositories = params.repositories;
    this.conversationRepository = repositories.conversation;
    this.conversation_service = repositories.conversation_service;
  }

  getElementId() {
    return 'conversation-manager';
  }
  onInviteEvt() {
    const confirm = this.activeConversation().confirm();
    this.activeConversation().confirm(!confirm);
    if (!confirm) {
      this.activeConversation().member_join_confirm(false);
    }
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      confirm: !confirm,
    });
  }
  onInvitedEvt() {
    if (this.activeConversation().confirm()) {
      this.activeConversation().member_join_confirm(false);
    } else {
      const confirm = this.activeConversation().member_join_confirm();
      this.activeConversation().member_join_confirm(!confirm);
      this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
        memberjoin_confirm: !confirm,
      });
    }
  }
  onUrlInviteEvt() {
    const checked = this.activeConversation().url_invite();
    this.activeConversation().url_invite(!checked);
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      url_invite: !checked,
    });
  }
  onAddRightEvt() {
    const checked = this.activeConversation().add_right();
    this.activeConversation().add_right(!checked);
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      addright: !checked,
    });
  }
  onViewMemEvt() {
    const checked = this.activeConversation().view_mem();
    this.activeConversation().view_mem(!checked);
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      viewmem: !checked,
    });
  }
  onViewChgMemNotifyEvt() {
    const checked = this.activeConversation().view_chg_mem_notify();
    this.activeConversation().view_chg_mem_notify(!checked);
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      view_chg_mem_notify: !checked,
    });
  }
  onAddFriendEvt() {
    const checked = this.activeConversation().add_friend();
    this.activeConversation().add_friend(!checked);
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      add_friend: !checked,
    });
  }
}
