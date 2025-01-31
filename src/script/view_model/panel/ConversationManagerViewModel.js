import {BasePanelViewModel} from './BasePanelViewModel';
import {ConversationParticipantsViewModel} from './ConversationParticipantsViewModel';

export class ConversationManagerViewModel extends BasePanelViewModel {
  constructor(params) {
    super(params);

    const repositories = params.repositories;
    this.conversationRepository = repositories.conversation;
    this.conversation_service = repositories.conversation_service;
    this.navigateTo = params.navigateTo;

    this.memberJoinConfirm = ko.pureComputed(() => {
      return this.activeConversation().confirm() || this.activeConversation().member_join_confirm();
    });
    this.urlInvite = ko.pureComputed(() => {
      return (
        this.activeConversation().confirm() ||
        this.activeConversation().add_right() ||
        this.activeConversation().url_invite()
      );
    });
  }

  getElementId() {
    return 'conversation-manager';
  }
  onTransfer() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.CONVERSATION_PARTICIPANTS, {
      exist: [this.activeConversation().selfUser().id],
      highlightedUsers: [],
      mode: ConversationParticipantsViewModel.STATE.MODIFY_MANAGER,
    });
  }
  onManagerEvt() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.CONVERSATION_ADMIN);
  }
  onOratorEvt() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.CONVERSATION_ORATOR);
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
  onMsgOnlyToManagerEvt() {
    const checked = this.activeConversation().msg_only_to_manager();
    this.activeConversation().msg_only_to_manager(!checked);
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      msg_only_to_manager: !checked,
    });
  }
  onForbiddenEvt() {
    const checked = this.activeConversation().block_time() ? 0 : -1;
    this.activeConversation().block_time(checked);
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      block_time: checked,
    });
  }
  onShowInvitorListEvt() {
    const checked = this.activeConversation().show_invitor_list();
    this.activeConversation().show_invitor_list(!checked);
    this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
      show_invitor_list: !checked,
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
    if (this.activeConversation().confirm() || this.activeConversation().add_right()) {
      this.activeConversation().url_invite(false);
    } else {
      const checked = this.activeConversation().url_invite();
      this.activeConversation().url_invite(!checked);
      this.conversationRepository.conversation_service.postModifyGroupInfo(this.activeConversation().id, {
        url_invite: !checked,
      });
    }
  }
  onAddRightEvt() {
    const checked = this.activeConversation().add_right();
    this.activeConversation().add_right(!checked);
    if (!checked) {
      this.activeConversation().url_invite(false);
    }
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
