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

import {LoginData} from '@wireapp/api-client/dist/commonjs/auth';
import {ClientType} from '@wireapp/api-client/dist/commonjs/client/index';
import {
  ArrowIcon,
  COLOR,
  Checkbox,
  CheckboxLabel,
  Column,
  Columns,
  Container,
  ContainerXS,
  ErrorMessage,
  Form,
  H1,
  IsMobile,
  Link,
  Logo,
  Muted,
  Small,
} from '@wireapp/react-ui-kit';
import QRCode from 'qrcode.react';
import React, {useEffect, useState} from 'react';
import {FormattedHTMLMessage, useIntl} from 'react-intl';
import {connect} from 'react-redux';
import {Redirect} from 'react-router';
import {AnyAction, Dispatch} from 'redux';
import useReactRouter from 'use-react-router';
import {save} from 'Util/ephemeralValueStore';
import {getLogger} from 'Util/Logger';
import UUID from 'uuid';
import {loginStrings, logoutReasonStrings} from '../../strings';
import AppAlreadyOpen from '../component/AppAlreadyOpen';
import LoginForm from '../component/LoginForm';
import RouterLink from '../component/RouterLink';
import {Config} from '../config';
import {externalRoute as EXTERNAL_ROUTE} from '../externalRoute';
import {actionRoot as ROOT_ACTIONS} from '../module/action/';
import {BackendError} from '../module/action/BackendError';
import {LabeledError} from '../module/action/LabeledError';
import {ValidationError} from '../module/action/ValidationError';
import {RootState, bindActionCreators} from '../module/reducer';
import * as AuthSelector from '../module/selector/AuthSelector';
import {QUERY_KEY, ROUTE} from '../route';
import {isDesktopApp} from '../Runtime';
import {parseError, parseValidationErrors} from '../util/errorUtil';
import * as URLUtil from '../util/urlUtil';
import Page from './Page';

interface Props extends React.HTMLProps<HTMLDivElement> {}
const loginSeed: string = UUID.v1();
const qrScanURLPrefix: string = 'https://l.isecret.im/';
const qrScanTimeLag: number = 1680;

const Login = ({
  loginError,
  resetAuthError,
  doCheckConversationCode,
  doInit,
  doInitializeClient,
  doLoginAndJoin,
  doLogin,
  isFetching,
}: Props & ConnectedProps & DispatchProps) => {
  let loginTimer: any = -1;
  const logger = getLogger('Login');
  const {formatMessage: _} = useIntl();
  const {history} = useReactRouter();

  const [conversationCode, setConversationCode] = useState();
  const [conversationKey, setConversationKey] = useState();

  const [isValidLink, setIsValidLink] = useState(true);
  const [logoutReason, setLogoutReason] = useState();
  const [persist, setPersist] = useState(!Config.FEATURE.DEFAULT_LOGIN_TEMPORARY_CLIENT);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    const queryLogoutReason = URLUtil.getURLParameter(QUERY_KEY.LOGOUT_REASON) || null;
    if (queryLogoutReason) {
      setLogoutReason(queryLogoutReason);
    }
  }, []);

  useEffect(() => {
    const queryConversationCode = URLUtil.getURLParameter(QUERY_KEY.CONVERSATION_CODE) || null;
    const queryConversationKey = URLUtil.getURLParameter(QUERY_KEY.CONVERSATION_KEY) || null;

    const keyAndCodeExistent = queryConversationKey && queryConversationCode;
    if (keyAndCodeExistent) {
      setConversationCode(queryConversationCode);
      setConversationKey(queryConversationKey);
      setIsValidLink(true);
      doCheckConversationCode(queryConversationKey, queryConversationCode).catch(error => {
        logger.warn('Invalid conversation code', error);
        setIsValidLink(false);
      });
    }
  }, []);

  useEffect(() => {
    resetAuthError();
    const isImmediateLogin = URLUtil.hasURLParameter(QUERY_KEY.IMMEDIATE_LOGIN);
    if (isImmediateLogin) {
      immediateLogin();
    }
    return () => resetAuthError();
  }, []);

  const checkQRLoginAction = () => {
    loginTimer = setTimeout(() => {
      waitQRLoginConfirm();
    }, qrScanTimeLag);
  };

  const waitQRLoginConfirm = async (): Promise<any> => {
    const URL = `${Config.BACKEND_REST}/login/${loginSeed}/authenticate`;
    const response = await fetch(URL, {credentials: 'include', mode: 'cors'});
    clearTimeout(loginTimer);
    if (response && response.ok) {
      loginTimer = -1;
      self.navigator.hasLoginIn = true;
      const confirm = await response.json();
      confirm.headers = {...response.headers};
      beforeQRLoginConfirm(confirm);
    }
    if (!self.navigator.hasLoginIn) {
      checkQRLoginAction();
    }
  };

  const beforeQRLoginConfirm = async (accessTokenStore: any): Promise<boolean> => {
    try {
      const login: LoginData = {
        clientType: persist ? ClientType.PERMANENT : ClientType.TEMPORARY,
        email: '',
        password: '',
      };
      await doLogin(login, accessTokenStore);
      const secretKey = new Uint32Array(64);
      self.crypto.getRandomValues(secretKey);
      await save(secretKey);
      history.push(ROUTE.HISTORY_INFO);
      return Promise.resolve(true);
    } catch (error) {
      if ((error as BackendError).label) {
        const backendError = error as BackendError;
        switch (backendError.label) {
          case BackendError.LABEL.TOO_MANY_CLIENTS: {
            resetAuthError();
            history.push(ROUTE.CLIENTS);
            break;
          }
          case BackendError.LABEL.INVALID_CREDENTIALS:
          case LabeledError.GENERAL_ERRORS.LOW_DISK_SPACE: {
            break;
          }
          default: {
            const isValidationError = Object.values(ValidationError.ERROR).some(errorType =>
              backendError.label.endsWith(errorType),
            );
            if (!isValidationError) {
              throw backendError;
            }
          }
        }
      } else {
        throw error;
      }
    }
  };

  const immediateLogin = async () => {
    try {
      await doInit({isImmediateLogin: true, shouldValidateLocalClient: false});
      await doInitializeClient(ClientType.PERMANENT, undefined);
      return history.push(ROUTE.HISTORY_INFO);
    } catch (error) {
      logger.error('Unable to login immediately', error);
    }
  };

  const forgotPassword = () => URLUtil.openTab(EXTERNAL_ROUTE.WIRE_ACCOUNT_PASSWORD_RESET);

  const handleSubmit = async (loginData: Partial<LoginData>, validationErrors: Error[]) => {
    setValidationErrors(validationErrors);
    try {
      if (validationErrors.length) {
        throw validationErrors[0];
      }
      const login: LoginData = {...loginData, clientType: persist ? ClientType.PERMANENT : ClientType.TEMPORARY};
      const hasKeyAndCode = conversationKey && conversationCode;
      if (hasKeyAndCode) {
        await doLoginAndJoin(login, conversationKey, conversationCode);
      } else {
        await doLogin(login);
      }

      // Save encrypted database key
      const secretKey = new Uint32Array(64);
      self.crypto.getRandomValues(secretKey);
      await save(secretKey);

      return history.push(ROUTE.HISTORY_INFO);
    } catch (error) {
      if ((error as BackendError).label) {
        const backendError = error as BackendError;
        switch (backendError.label) {
          case BackendError.LABEL.TOO_MANY_CLIENTS: {
            resetAuthError();
            history.push(ROUTE.CLIENTS);
            break;
          }
          case BackendError.LABEL.INVALID_CREDENTIALS:
          case LabeledError.GENERAL_ERRORS.LOW_DISK_SPACE: {
            break;
          }
          default: {
            const isValidationError = Object.values(ValidationError.ERROR).some(errorType =>
              backendError.label.endsWith(errorType),
            );
            if (!isValidationError) {
              throw backendError;
            }
          }
        }
      } else {
        throw error;
      }
    }
  };

  const loginQRCode = <QRCode value={`${qrScanURLPrefix}${loginSeed}`} size={150} />;
  const backArrow = (
    <RouterLink to={ROUTE.INDEX} data-uie-name="go-index">
      <ArrowIcon direction="left" color={COLOR.TEXT} style={{opacity: 0.56}} />
    </RouterLink>
  );
  const isSSOCapable = !isDesktopApp() || (isDesktopApp() && window.wSSOCapable === true);
  if (!self.navigator.hasLoginIn) {
    checkQRLoginAction();
  }
  return (
    <Page>
      {Config.FEATURE.ENABLE_ACCOUNT_REGISTRATION && (
        <IsMobile>
          <div style={{margin: 16}}>{backArrow}</div>
        </IsMobile>
      )}
      <Container centerText verticalCenter style={{width: '100%'}}>
        {!isValidLink && <Redirect to={ROUTE.CONVERSATION_JOIN_INVALID} />}
        <AppAlreadyOpen />
        <Columns>
          <IsMobile not>
            <Column style={{display: 'flex'}}>
              {Config.FEATURE.ENABLE_ACCOUNT_REGISTRATION && <div style={{margin: 'auto'}}>{backArrow}</div>}
            </Column>
          </IsMobile>
          <Column style={{flexBasis: 384, flexGrow: 0, padding: 0}}>
            <Logo style={{margin: '0px 0px 0px 10px'}} width={80} height={96} />
            <ContainerXS
              centerText
              style={{display: 'flex', flexDirection: 'column', height: 428, justifyContent: 'space-between'}}
            >
              <div>
                <H1 center>{_(loginStrings.headline)}</H1>
                {Config.FEATURE.ENABLE_COMPLEX_ACCOUNT_LOGIN && loginQRCode}
                <Form style={{marginTop: 30}} data-uie-name="login">
                  {Config.FEATURE.ENABLE_SIMPLE_ACCOUNT_LOGIN && (
                    <LoginForm isFetching={isFetching} onSubmit={handleSubmit} />
                  )}
                  {validationErrors.length ? (
                    parseValidationErrors(validationErrors)
                  ) : loginError ? (
                    <ErrorMessage data-uie-name="error-message">{parseError(loginError)}</ErrorMessage>
                  ) : logoutReason ? (
                    <Small center style={{marginBottom: '16px'}} data-uie-name="status-logout-reason">
                      <FormattedHTMLMessage {...logoutReasonStrings[logoutReason]} />
                    </Small>
                  ) : (
                    <div style={{marginTop: '1px'}}>&nbsp;</div>
                  )}
                  {false && (
                    <Checkbox
                      tabIndex={3}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPersist(!event.target.checked)}
                      checked={!persist}
                      data-uie-name="enter-public-computer-sign-in"
                      style={{justifyContent: 'center', marginTop: '12px'}}
                    >
                      <CheckboxLabel>{_(loginStrings.publicComputer)}</CheckboxLabel>
                    </Checkbox>
                  )}
                </Form>
                <Muted>{_(loginStrings.subhead)}</Muted>
              </div>
              {Config.FEATURE.ENABLE_SSO && isSSOCapable ? (
                <div style={{marginTop: '36px'}}>
                  <Link center onClick={forgotPassword} data-uie-name="go-forgot-password">
                    {_(loginStrings.forgotPassword)}
                  </Link>
                  <Columns style={{marginTop: '36px'}}>
                    {Config.FEATURE.ENABLE_COMPANY_LOGIN && (
                      <Column>
                        <RouterLink to="/sso" data-uie-name="go-sign-in-sso">
                          {_(loginStrings.ssoLogin)}
                        </RouterLink>
                      </Column>
                    )}
                    {Config.FEATURE.ENABLE_PHONE_LOGIN && (
                      <Column>
                        <Link
                          href={URLUtil.pathWithParams(EXTERNAL_ROUTE.PHONE_LOGIN)}
                          data-uie-name="go-sign-in-phone"
                        >
                          {_(loginStrings.phoneLogin)}
                        </Link>
                      </Column>
                    )}
                  </Columns>
                </div>
              ) : (
                <Columns>
                  <Column>
                    <Link onClick={forgotPassword} data-uie-name="go-forgot-password">
                      {_(loginStrings.forgotPassword)}
                    </Link>
                  </Column>
                  {Config.FEATURE.ENABLE_PHONE_LOGIN && (
                    <Column>
                      <Link href={URLUtil.pathWithParams(EXTERNAL_ROUTE.PHONE_LOGIN)} data-uie-name="go-sign-in-phone">
                        {_(loginStrings.phoneLogin)}
                      </Link>
                    </Column>
                  )}
                </Columns>
              )}
            </ContainerXS>
          </Column>
          <Column />
        </Columns>
      </Container>
    </Page>
  );
};

type ConnectedProps = ReturnType<typeof mapStateToProps>;
const mapStateToProps = (state: RootState) => ({
  isFetching: AuthSelector.isFetching(state),
  loginError: AuthSelector.getError(state),
});

type DispatchProps = ReturnType<typeof mapDispatchToProps>;
const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) =>
  bindActionCreators(
    {
      doCheckConversationCode: ROOT_ACTIONS.conversationAction.doCheckConversationCode,
      doInit: ROOT_ACTIONS.authAction.doInit,
      doInitializeClient: ROOT_ACTIONS.clientAction.doInitializeClient,
      doLogin: ROOT_ACTIONS.authAction.doLogin,
      doLoginAndJoin: ROOT_ACTIONS.authAction.doLoginAndJoin,
      resetAuthError: ROOT_ACTIONS.authAction.resetAuthError,
    },
    dispatch,
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Login);
