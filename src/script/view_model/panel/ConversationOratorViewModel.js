import {BasePanelViewModel} from './BasePanelViewModel';
import {ConversationParticipantsViewModel} from './ConversationParticipantsViewModel';
import {koArrayPushAll} from 'Util/util';

export class ConversationOratorViewModel extends BasePanelViewModel {
  constructor(params) {
    super(params);
    this.clickOnShowUser = this.clickOnShowUser.bind(this);
    const repositories = params.repositories;
    this.searchRepository = repositories.search;
    this.teamRepository = repositories.team;
    this.conversationRepository = repositories.conversation;
    this.user_repository = repositories.user;

    this.participants = ko.observableArray([]);
    ko.computed(() => {
      if (this.activeConversation()) {
        const orators = this.activeConversation().orator();
        this.user_repository.get_users_by_id(orators).then(users => {
          this.participants.removeAll();
          koArrayPushAll(this.participants, users);
        });
      }
    });
  }
  clickOnShowUser(userEntity) {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.GROUP_PARTICIPANT_USER, {
      entity: userEntity,
      isOrator: true,
    });
  }
  getElementId() {
    return 'conversation-orator';
  }
  onAddEvt() {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.CONVERSATION_PARTICIPANTS, {
      exist: this.activeConversation().orator(),
      highlightedUsers: [],
      mode: ConversationParticipantsViewModel.STATE.MODIFY_ORATOR,
    });
  }
}
