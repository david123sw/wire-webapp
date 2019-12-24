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

window.z = window.z || {};
//TODODAV
const dotenv = require('dotenv-extended');
// const fs = require('fs-extra');
const logdown = require('logdown');
// const path = require('path');
const nodeEnvironment = process.env.NODE_ENV || 'production';
const COMMIT_FILE = ''; //path.join(__dirname, 'commit');
// const ROBOTS_DIR = ''; //path.join(__dirname, 'robots');
const ROBOTS_ALLOW_FILE = 'User-agent: *\nDisallow: /'; //path.join(ROBOTS_DIR, 'robots.txt');
const ROBOTS_DISALLOW_FILE = 'User-agent: *\nDisallow: /'; //path.join(ROBOTS_DIR, 'robots-disallow.txt');
const VERSION_FILE = '1.0.0'; //path.join(__dirname, 'version');
dotenv.load();
const defaultCSP = {
  connectSrc: [
    "'self'",
    'blob:',
    'data:',
    'https://isecret.com',
    'https://www.google.com',
    'https://*.giphy.com',
    'https://*.unsplash.com',
    'https://apis.google.com',
  ],
  defaultSrc: ["'self'"],
  fontSrc: ["'self'", 'data:'],
  frameSrc: [
    'https://*.soundcloud.com',
    'https://*.spotify.com',
    'https://*.vimeo.com',
    'https://*.youtube-nocookie.com',
    'https://accounts.google.com',
  ],
  imgSrc: [
    "'self'",
    'blob:',
    'data:',
    'https://*.cloudfront.net',
    'https://*.giphy.com',
    'https://1-ps.googleusercontent.com',
    'https://csi.gstatic.com',
  ],
  manifestSrc: ["'self'"],
  mediaSrc: ["'self'", 'blob:', 'data:', '*'],
  objectSrc: ["'self'", 'https://*.youtube-nocookie.com', 'https://1-ps.googleusercontent.com'],
  prefetchSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://apis.google.com'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://*.googleusercontent.com'],
  workerSrc: ["'self'"],
};
const logger = logdown('config', {
  logger: console,
  markdown: false,
});
function readFile(file_path, fallback) {
  try {
    return file_path;
    // return fs.readFileSync(file_path, {encoding: 'utf8', flag: 'r'});
  } catch (error) {
    logger.warn(`Cannot access "${file_path}": ${error.message}`);
    return fallback;
  }
}
function parseCommaSeparatedList(list = '') {
  const cleanedList = list.replace(/\s/g, '');
  if (!cleanedList) {
    return [];
  }
  return cleanedList.split(',');
}
function mergedCSP() {
  const csp = {
    connectSrc: [
      ...defaultCSP.connectSrc,
      process.env.BACKEND_REST,
      process.env.BACKEND_WS,
      ...parseCommaSeparatedList(process.env.CSP_EXTRA_CONNECT_SRC),
    ],
    defaultSrc: [...defaultCSP.defaultSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_DEFAULT_SRC)],
    fontSrc: [...defaultCSP.fontSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_FONT_SRC)],
    frameSrc: [...defaultCSP.frameSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_FRAME_SRC)],
    imgSrc: [...defaultCSP.imgSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_IMG_SRC)],
    manifestSrc: [...defaultCSP.manifestSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_MANIFEST_SRC)],
    mediaSrc: [...defaultCSP.mediaSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_MEDIA_SRC)],
    objectSrc: [...defaultCSP.objectSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_OBJECT_SRC)],
    prefetchSrc: [...defaultCSP.prefetchSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_PREFETCH_SRC)],
    scriptSrc: [...defaultCSP.scriptSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_SCRIPT_SRC)],
    styleSrc: [...defaultCSP.styleSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_STYLE_SRC)],
    workerSrc: [...defaultCSP.workerSrc, ...parseCommaSeparatedList(process.env.CSP_EXTRA_WORKER_SRC)],
  };
  return Object.entries(csp)
    .filter(([key, value]) => !!value.length)
    .reduce((accumulator, [key, value]) => Object.assign(Object.assign({}, accumulator), {[key]: value}), {});
}
const configurations = {
  CLIENT: {
    ANALYTICS_API_KEY: process.env.ANALYTICS_API_KEY,
    APP_NAME: process.env.APP_NAME,
    BACKEND_REST: process.env.BACKEND_REST,
    BACKEND_WS: process.env.BACKEND_WS,
    BRAND_NAME: process.env.BRAND_NAME,
    ENVIRONMENT: nodeEnvironment,
    FEATURE: {
      ALLOWED_FILE_UPLOAD_EXTENSIONS: (process.env.FEATURE_ALLOWED_FILE_UPLOAD_EXTENSIONS || '*')
        .split(',')
        .map(extension => extension.trim()),
      APPLOCK_SCHEDULED_TIMEOUT: process.env.FEATURE_APPLOCK_SCHEDULED_TIMEOUT
        ? Number(process.env.FEATURE_APPLOCK_SCHEDULED_TIMEOUT)
        : null,
      APPLOCK_UNFOCUS_TIMEOUT: process.env.FEATURE_APPLOCK_UNFOCUS_TIMEOUT
        ? Number(process.env.FEATURE_APPLOCK_UNFOCUS_TIMEOUT)
        : null,
      CHECK_CONSENT: process.env.FEATURE_CHECK_CONSENT != 'false',
      DEFAULT_LOGIN_TEMPORARY_CLIENT: process.env.FEATURE_DEFAULT_LOGIN_TEMPORARY_CLIENT == 'true',
      ENABLE_ACCOUNT_REGISTRATION: process.env.FEATURE_ENABLE_ACCOUNT_REGISTRATION != 'false',
      ENABLE_COMPANY_LOGIN: process.env.FEATURE_ENABLE_COMPANY_LOGIN != 'false',
      ENABLE_DEBUG: process.env.FEATURE_ENABLE_DEBUG == 'true',
      ENABLE_PHONE_LOGIN: process.env.FEATURE_ENABLE_PHONE_LOGIN != 'false',
      ENABLE_SSO: process.env.FEATURE_ENABLE_SSO == 'true',
      PERSIST_TEMPORARY_CLIENTS: process.env.FEATURE_PERSIST_TEMPORARY_CLIENTS != 'false',
      SHOW_LOADING_INFORMATION: process.env.FEATURE_SHOW_LOADING_INFORMATION == 'true',
    },
    MAX_GROUP_PARTICIPANTS: (process.env.MAX_GROUP_PARTICIPANTS && Number(process.env.MAX_GROUP_PARTICIPANTS)) || 10000,
    MAX_VIDEO_PARTICIPANTS: (process.env.MAX_VIDEO_PARTICIPANTS && Number(process.env.MAX_VIDEO_PARTICIPANTS)) || 4,
    NEW_PASSWORD_MINIMUM_LENGTH:
      (process.env.NEW_PASSWORD_MINIMUM_LENGTH && Number(process.env.NEW_PASSWORD_MINIMUM_LENGTH)) || 8,
    RAYGUN_API_KEY: process.env.RAYGUN_API_KEY,
    URL: {
      ACCOUNT_BASE: process.env.URL_ACCOUNT_BASE,
      MOBILE_BASE: process.env.URL_MOBILE_BASE,
      PRIVACY_POLICY: process.env.URL_PRIVACY_POLICY,
      SUPPORT_BASE: process.env.URL_SUPPORT_BASE,
      TEAMS_BASE: process.env.URL_TEAMS_BASE,
      TERMS_OF_USE_PERSONAL: process.env.URL_TERMS_OF_USE_PERSONAL,
      TERMS_OF_USE_TEAMS: process.env.URL_TERMS_OF_USE_TEAMS,
      WEBSITE_BASE: process.env.URL_WEBSITE_BASE,
    },
    VERSION: readFile(VERSION_FILE, '0.0.0'),
  },
  COMMIT: readFile(COMMIT_FILE, ''),
  SERVER: {
    APP_BASE: process.env.APP_BASE,
    CACHE_DURATION_SECONDS: 300,
    CSP: mergedCSP(),
    DEVELOPMENT: nodeEnvironment === 'development',
    ENFORCE_HTTPS: process.env.ENFORCE_HTTPS != 'false',
    ENVIRONMENT: nodeEnvironment,
    GOOGLE_WEBMASTER_ID: process.env.GOOGLE_WEBMASTER_ID,
    PORT_HTTP: Number(process.env.PORT) || 21080,
    ROBOTS: {
      ALLOW: readFile(ROBOTS_ALLOW_FILE, 'User-agent: *\r\nDisallow: /'),
      ALLOWED_HOSTS: ['webapp.isecret.im'],
      DISALLOW: readFile(ROBOTS_DISALLOW_FILE, 'User-agent: *\r\nDisallow: /'),
    },
  },
};
window.wire = window.wire || {};
window.wire.env = Object.assign(Object.assign({}, configurations.CLIENT), {APP_BASE: configurations.SERVER.APP_BASE});
//TODODAV
const env = window.wire.env;

export const ACCENT_ID = {
  BLUE: 1,
  GREEN: 2,
  ORANGE: 5,
  PINK: 6,
  PURPLE: 7,
  RED: 4,
  YELLOW: 3,
};

// TODO: Deprecated. Should be replaced with "src/script/auth/config.ts".
export const config = {
  FEATURE: {
    APPLOCK_SCHEDULED_TIMEOUT: env.FEATURE && env.FEATURE.APPLOCK_SCHEDULED_TIMEOUT,
    APPLOCK_UNFOCUS_TIMEOUT: env.FEATURE && env.FEATURE.APPLOCK_UNFOCUS_TIMEOUT,
    CHECK_CONSENT: env.FEATURE && env.FEATURE.CHECK_CONSENT,
    DEFAULT_LOGIN_TEMPORARY_CLIENT: env.FEATURE && env.FEATURE.DEFAULT_LOGIN_TEMPORARY_CLIENT,
    ENABLE_ACCOUNT_REGISTRATION: env.FEATURE && env.FEATURE.ENABLE_ACCOUNT_REGISTRATION,
    ENABLE_DEBUG: env.FEATURE && env.FEATURE.ENABLE_DEBUG,
    ENABLE_PHONE_LOGIN: env.FEATURE && env.FEATURE.ENABLE_PHONE_LOGIN,
    ENABLE_SSO: env.FEATURE && env.FEATURE.ENABLE_SSO,
    SHOW_LOADING_INFORMATION: env.FEATURE && env.FEATURE.SHOW_LOADING_INFORMATION,
  },

  // 10 seconds until phone code expires
  LOGIN_CODE_EXPIRATION: 10 * 60,

  // 25 megabyte upload limit for personal use (private users & guests)
  MAXIMUM_ASSET_FILE_SIZE_PERSONAL: 25 * 1024 * 1024,

  // 100 megabyte upload limit for organizations (team members)
  MAXIMUM_ASSET_FILE_SIZE_TEAM: 100 * 1024 * 1024,

  // 15 megabyte image upload limit
  MAXIMUM_IMAGE_FILE_SIZE: 15 * 1024 * 1024,

  // maximum chars for link preview titles and descriptions
  MAXIMUM_LINK_PREVIEW_CHARS: 200,

  // Maximum characters per sent message
  MAXIMUM_MESSAGE_LENGTH: 8000,

  // Maximum characters per received message
  // Encryption is approx. +40% of the original payload so let's round it at +50%
  MAXIMUM_MESSAGE_LENGTH_RECEIVING: 12000 * 1.5,

  // bigger requests will be split in chunks with a maximum size as defined
  MAXIMUM_USERS_PER_REQUEST: 200,

  // number of messages that will be pulled
  MESSAGES_FETCH_LIMIT: 30,

  MINIMUM_PASSWORD_LENGTH: 8,

  // measured in pixel
  SCROLL_TO_LAST_MESSAGE_THRESHOLD: 100,

  SUPPORT: {
    FORM: {
      BUG: 'new?ticket_form_id=101615',
      CONTACT: 'new',
    },
    ID: {
      CALLING: 202969412,
      CAMERA_ACCESS_DENIED: 202935412,
      DEVICE_ACCESS_DENIED: 213512545,
      DEVICE_NOT_FOUND: 202970662,
      HISTORY: 207834645,
      MICROPHONE_ACCESS_DENIED: 202590081,
      SCREEN_ACCESS_DENIED: 202935412,
    },
  },
};

window.z.config = config;
