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

// patch secret with configs by davidshen

const fs = require('fs-extra');
const path = require('path');
const {ROOT_PATH} = require('../locations');
const from_src = path.resolve(ROOT_PATH, 'patches');
const dest_to = path.resolve(ROOT_PATH, 'node_modules/@wireapp');

function CopyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }

  const dirs = fs.readdirSync(src);
  dirs.forEach(item => {
    const item_path = path.join(src, item);
    const temp = fs.statSync(item_path);
    if (temp.isFile()) {
      fs.copyFileSync(item_path, path.join(dest, item));
    } else if (temp.isDirectory()) {
      CopyDirectory(item_path, path.join(dest, item));
    }
  });
}

CopyDirectory(from_src, dest_to);