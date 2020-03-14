import {BasePanelViewModel} from './BasePanelViewModel';
import {ConversationParticipantsViewModel} from './ConversationParticipantsViewModel';
import {koArrayPushAll} from 'Util/util';

export class ConversationAdminViewModel extends BasePanelViewModel {
  constructor(params) {
    super(params);
    this.clickOnShowUser = this.clickOnShowUser.bind(this);
    const repositories = params.repositories;
    this.searchRepository = repositories.search;
    this.teamRepository = repositories.team;
    this.conversationRepository = repositories.conversation;
    this.user_repository = repositories.user;

    this.isShowAdd = ko.pureComputed(() => {
      if (this.activeConversation()) {
        return this.activeConversation().managers().length < 3;
      }
      return false;
    });
    this.participants = ko.observableArray([]);
    ko.computed(() => {
      if (this.activeConversation()) {
        const managers = this.activeConversation().managers();
        this.user_repository.get_users_by_id(managers).then(users => {
          this.participants.removeAll();
          koArrayPushAll(this.participants, users);
        });
      }
    });
  }
  clickOnShowUser(userEntity) {
    this.navigateTo(z.viewModel.PanelViewModel.STATE.GROUP_PARTICIPANT_USER, {
      entity: userEntity,
      isAdmin: true,
    });
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
