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
}
