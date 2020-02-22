import {BasePanelViewModel} from './BasePanelViewModel';

export class ConversationOratorViewModel extends BasePanelViewModel {
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
        const orators = this.activeConversation().orator();
        for (let i = 0; i < orators.length; ++i) {
          const userId = orators[i];
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
    return 'conversation-orator';
  }
  onAddEvt() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.CONVERSATION_PARTICIPANTS, {
      exist: this.activeConversation().orator(),
      highlightedUsers: [],
      mode: 1,
    });
  }
}
