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

import {ValidationUtil} from '@wireapp/commons';
//PROD_SPEC
import * as dotenv from 'dotenv-extended';
// import * as fs from 'fs-extra';
import {IHelmetContentSecurityPolicyDirectives as HelmetCSP} from 'helmet';
import * as logdown from 'logdown';
// import * as path from 'path-browserify';
import * as UUID from 'uuid/v4';
import {ServerConfig} from './../../../server/ServerConfig';
function client_preview_init(): any {
  const nodeEnvironment = process.env.NODE_ENV || 'production';
  const COMMIT_FILE = ''; //path.join(__dirname, 'commit');
  // const ROBOTS_DIR = ''; //path.join(__dirname, 'robots');
  const ROBOTS_ALLOW_FILE = 'User-agent: *\nDisallow: /'; //path.join(ROBOTS_DIR, 'robots.txt');
  const ROBOTS_DISALLOW_FILE = 'User-agent: *\nDisallow: /'; //path.join(ROBOTS_DIR, 'robots-disallow.txt');
  const VERSION_FILE = '1.0.0'; //path.join(__dirname, 'version');

  dotenv.load();

  const defaultCSP: HelmetCSP = {
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

  function readFile(path: string, fallback?: string): string {
    try {
      return path;
      // return fs.readFileSync(path, {encoding: 'utf8', flag: 'r'});
    } catch (error) {
      logger.warn(`Cannot access "${path}": ${error.message}`);
      return fallback;
    }
  }

  function parseCommaSeparatedList(list: string = ''): string[] {
    const cleanedList = list.replace(/\s/g, '');
    if (!cleanedList) {
      return [];
    }
    return cleanedList.split(',');
  }

  function mergedCSP(): HelmetCSP {
    const csp: HelmetCSP = {
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
      .reduce((accumulator, [key, value]) => ({...accumulator, [key]: value}), {});
  }

  const config: ServerConfig = {
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
        CHECK_CONSENT: false,
        DEFAULT_LOGIN_TEMPORARY_CLIENT: false,
        ENABLE_ACCOUNT_REGISTRATION: false,
        ENABLE_COMPANY_LOGIN: false,
        ENABLE_COMPLEX_ACCOUNT_LOGIN: true,
        ENABLE_DEBUG: false,
        ENABLE_PHONE_LOGIN: false,
        ENABLE_SIMPLE_ACCOUNT_LOGIN: false,
        ENABLE_SSO: true,
        PERSIST_TEMPORARY_CLIENTS: true,
        SHOW_LOADING_INFORMATION: true,
      },
      MAX_GROUP_PARTICIPANTS: 10000,
      MAX_VIDEO_PARTICIPANTS: 4,
      NEW_PASSWORD_MINIMUM_LENGTH: 8,
      RAYGUN_API_KEY: '',
      URL: {
        ACCOUNT_BASE: process.env.URL_ACCOUNT_BASE,
        MOBILE_BASE: process.env.URL_MOBILE_BASE,
        PRIVACY_POLICY: 'https://isecret.im',
        SUPPORT_BASE: 'https://isecret.im',
        TEAMS_BASE: process.env.URL_TEAMS_BASE,
        TERMS_OF_USE_PERSONAL: 'https://isecret.im',
        TERMS_OF_USE_TEAMS: 'https://isecret.im',
        WEBSITE_BASE: 'https://isecret.im',
      },
      VERSION: VERSION_FILE, //readFile(VERSION_FILE, '1.0.0'),
    },
    COMMIT: readFile(COMMIT_FILE, ''),
    SERVER: {
      APP_BASE: process.env.APP_BASE,
      CACHE_DURATION_SECONDS: 300,
      CSP: mergedCSP(),
      DEVELOPMENT: false,
      ENFORCE_HTTPS: true,
      ENVIRONMENT: 'production',
      GOOGLE_WEBMASTER_ID: '',
      PORT_HTTP: 21080,
      ROBOTS: {
        ALLOW: readFile(ROBOTS_ALLOW_FILE, 'User-agent: *\r\nDisallow: /'),
        ALLOWED_HOSTS: ['webapp.secret.chat'],
        DISALLOW: readFile(ROBOTS_DISALLOW_FILE, 'User-agent: *\r\nDisallow: /'),
      },
    },
  };

  window.wire = window.wire || {};
  window.wire.env = window.wire.env || {...config.CLIENT, ...{APP_BASE: config.SERVER.APP_BASE}};
}
if ('production' === process.env.NODE_ENV) {
  client_preview_init();
}
const unique_app_entry = 'https://webapp.secret.chat';
const unique_connect_entry = 'https://account.isecret.im';
const unique_connect_entry_wss = 'wss://account.isecret.im';
//PROD_SPEC
export class Configuration {
  readonly APP_BASE = window.wire.env.APP_BASE || unique_app_entry;
  readonly APP_NAME = window.wire.env.APP_NAME || 'Webapp';
  readonly APP_INSTANCE_ID = UUID();
  readonly BACKEND_REST = window.wire.env.BACKEND_REST || unique_connect_entry;
  readonly BACKEND_WS = window.wire.env.BACKEND_WS || unique_connect_entry_wss;
  readonly BRAND_NAME = window.wire.env.BRAND_NAME || 'Secret';
  readonly ENVIRONMENT = window.wire.env.ENVIRONMENT || 'production';
  readonly FEATURE = window.wire.env.FEATURE;
  readonly MAX_GROUP_PARTICIPANTS = window.wire.env.MAX_GROUP_PARTICIPANTS || 10000;
  readonly MAX_VIDEO_PARTICIPANTS = window.wire.env.MAX_VIDEO_PARTICIPANTS || 4;
  readonly NEW_PASSWORD_MINIMUM_LENGTH =
    window.wire.env.NEW_PASSWORD_MINIMUM_LENGTH || ValidationUtil.DEFAULT_PASSWORD_MIN_LENGTH;
  readonly URL = window.wire.env.URL || {
    ACCOUNT_BASE: unique_connect_entry,
    MOBILE_BASE: unique_connect_entry,
    PRIVACY_POLICY: 'https://isecret.im',
    SUPPORT_BASE: 'https://isecret.im',
    TEAMS_BASE: unique_connect_entry,
    TERMS_OF_USE_PERSONAL: 'https://isecret.im',
    TERMS_OF_USE_TEAMS: 'https://isecret.im',
    WEBSITE_BASE: 'https://isecret.im',
  };
  readonly VERSION = window.wire.env.VERSION || '1.0.0';
}

const Config = new Configuration();

export {Config};
