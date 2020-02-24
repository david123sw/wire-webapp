import {BasePanelViewModel} from './BasePanelViewModel';
import {ConversationParticipantsViewModel} from './ConversationParticipantsViewModel';

export class ConversationAdminViewModel extends BasePanelViewModel {
  constructor(params) {
    super(params);
    this.clickOnShowUser = this.clickOnShowUser.bind(this);
    const repositories = params.repositories;
    this.searchRepository = repositories.search;
    this.teamRepository = repositories.team;
    this.conversationRepository = repositories.conversation;
    this.participants = ko.pureComputed(() => {
      if (this.activeConversation()) {
        const userParticipants = [];
        const managers = this.activeConversation().managers();
        for (let i = 0; i < managers.length; ++i) {
          const userId = managers[i];
          this.activeConversation()
            .participating_user_ets()
            .map(userEntity => {
              if (userEntity.id === userId) {
                userParticipants.push(userEntity);
              }
            });
        }
        return userParticipants;
      }
      return [];
    });
  }
  clickOnShowUser(userEntity) {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.GROUP_PARTICIPANT_USER, {entity: userEntity});
  }
  getElementId() {
    return 'conversation-admin';
  }
  onAddEvt() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.CONVERSATION_PARTICIPANTS, {
      exist: this.activeConversation().managers(),
      highlightedUsers: [],
      mode: ConversationParticipantsViewModel.STATE.MODIFY_ADMIN,
    });
  }
}
