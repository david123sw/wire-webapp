/*
 * RanJun
 */

import ko from 'knockout';

class UserExtra {
  constructor(id) {
    this.id = id;
    this.aliasname = ko.observable();
  }
}

export {UserExtra};
