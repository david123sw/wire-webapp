import {BasePanelViewModel} from './BasePanelViewModel';

export class ConversationManagerViewModel extends BasePanelViewModel {
  constructor(params) {
    super(params);

    const repositories = params.repositories;
    this.conversationRepository = repositories.conversation;
  }

  getElementId() {
    return 'conversation-manager';
  }
  onInviteEvt() {
    const confirm = this.activeConversation().confirm();
    this.activeConversation().confirm(!confirm);
  }
  onInvitedEvt() {
    const confirm = this.activeConversation().member_join_confirm();
    this.activeConversation().member_join_confirm(!confirm);
  }
  onUrlInviteEvt() {
    const url_invite = this.activeConversation().url_invite();
    this.activeConversation().url_invite(!url_invite);
  }
  onAddRightEvt() {
    const checked = this.activeConversation().add_right();
    this.activeConversation().add_right(!checked);
  }
  onViewMemEvt() {
    const checked = this.activeConversation().view_mem();
    this.activeConversation().view_mem(!checked);
  }
  onViewChgMemNotifyEvt() {
    const checked = this.activeConversation().view_chg_mem_notify();
    this.activeConversation().view_chg_mem_notify(!checked);
  }
  onAddFriendEvt() {
    const checked = this.activeConversation().add_friend();
    this.activeConversation().add_friend(!checked);
  }
}
