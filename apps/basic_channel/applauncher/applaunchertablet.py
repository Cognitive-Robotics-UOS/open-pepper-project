#!/usr/bin/python
# -*- encoding: UTF-8 -*-

"""applaunchertablet.py
Communicates with the tablet and installs the native android app launcher.
"""

import os
import qi
import subprocess
import json
import traceback
import errno
from arcsdk.auth import UserOAuth2Credentials
import xml.etree.ElementTree as ET

# Certificates used to get user oauth token
USER_CERT                  = "cert/alcloud_user.crt"
USER_KEY                   = "cert/alcloud_user.key"
USER_CLIENT_ID             = "alcloud_user"

ALDEBARAN_EMAILS           = [
    "@aldebaran.com",
    "@aldebaran-robotics.com",
    "@presta.aldebaran.com",
    "@presta.aldebaran-robotics.fr",
    "@presta.aldebaran-robotics.com"
]

class SBRAppLauncher(object):
    """Communicates with the tablet and installs the native android app
    launcher.
    """
    def __init__(self, session):
        currPath = os.path.dirname(os.path.realpath(__file__))
        subprocess.call(["chmod", "+x", currPath + "/adb"])
        pathToLink = "/home/nao/.local/share/PackageManager/apps/applauncher"
        try:
            os.symlink(currPath, pathToLink)
        except OSError, e:
            if e.errno == errno.EEXIST:
                os.remove(pathToLink)
                os.symlink(currPath, pathToLink)
        self.session = session
        self.name = 'jp.softbank.rb.rald'
        self.version = '2.1.4'
        self._activityRequestedByUser = qi.Signal('(s)')
        self.touch_expr_obj = None
        self.target_behavior = str()
        self.services_connected = None
        self.log_prefix = 'ApplicationLauncher'
        self.custom_launcher = str()
        try:
            qicore = qi.module("qicore")
            log_manager = self.session.service("LogManager")
            provider = qicore.createObject("LogProvider", log_manager)
            log_manager.addProvider(provider)
            self.logger = qi.Logger(self.log_prefix)
        except (RuntimeError, AttributeError):
            pass

        # Wait for all services to be available
        self.connect_services(90)
        self.mem.declareEvent('ALRALManagerModule/onTouchDown')
        self.alife.userRequestableActivitiesViolations.connect(self.on_permissions_changed)
        self.tts.languageTTS.connect(self.on_language_changed)
        self.packman.onPackageRemoved2.connect(self.on_package_custom_launcher_removed)

        tablet = self.get_tablet_service()
        self.change_applauncher()
        self.startService()
        try:
            tablet.onTouchDown.connect(self.onTabletTouched)
        except (AttributeError, RuntimeError) as err:
            self.logger.warning('Problem connecting the tablet touched event: {}'.format(err))

    @qi.nobind
    def get_tablet_service(self):
        """Get tablet service ans reset the tablet if not immediately
        available.
        returns: naoqi service reference"""
        try:
            tablet = self.session.service('ALTabletService')
        except RuntimeError as err:
            self.logger.warning('Error aquiring Tablet service: {}'.format(err))
            self.restartTablet()
            try:
                tablet = self.session.service('ALTabletService')
            except RuntimeError as err:
                self.logger.warning('Error acquiring Tablet service (defaulting to None): {}'
                                    .format(err))
                tablet = None
        finally:
            return tablet

    @qi.nobind
    def connect_services(self, timeout):
        """Connect to all services required.
        :param timeout: time in seconds after wich acquiring services is
                        abandonned."""
        self.services_connected = qi.Promise()
        services_connected_fut = self.services_connected.future()
        timeout = int(max([1, timeout]) * 1000)
        period = int(min([2, timeout / 2]) * 1000000)

        self.logger.info('Timeout: {} ms'.format(timeout))
        self.logger.info('Period: {} us'.format(period))

        get_services_task = qi.PeriodicTask()
        get_services_task.setCallback(self.get_services)
        get_services_task.setUsPeriod(period)
        get_services_task.start(True)

        try:
            services_connected_fut.value(timeout)
            get_services_task.stop()
        except RuntimeError:
            get_services_task.stop()
            raise RuntimeError(
                'Failed to reach all services after {} ms'.format(timeout))

    @qi.nobind
    def get_services(self):
        """Get required services."""
        try:
            self.packman = self.session.service('PackageManager')
            self.alife = self.session.service('ALAutonomousLife')
            self.mem = self.session.service('ALMemory')
            self.pref = self.session.service('ALPreferenceManager')
            self.dialog = self.session.service('ALDialog')
            self.tts = self.session.service('ALTextToSpeech')

            self.services_connected.setValue(True)
        except RuntimeError as err:
            self.logger.warning('Problem acquiring services: {}'.format(err))

    @qi.nobind
    def change_applauncher(self):
        """Connect to signal and getValue to override appLauncher"""
        #Connect to signal
        try:
            self.subscriber_override_launcher = self.mem.subscriber("AppLauncher/CustomLauncher")
            self.subscriber_override_launcher.signal.connect(self.on_launcher_overridden)
        except RuntimeError as err:
            self.logger.warning('Unable to connect on signal: {}', format(err))

        #Get value
        try:
            info = self.mem.getData("AppLauncher/CustomLauncher")
            if info is not None:
                self.on_launcher_overridden(info)
        except RuntimeError as err:
            self.logger.warning('Unable to getData from ALMemory: {}', format(err))

    @qi.nobind
    def on_launcher_overridden(self, val):
        self.logger.info('onOverrideLauncher val=' + str(val))

        if val is not None:
            self.custom_launcher = val

            tablet = self.get_tablet_service()

            appInfo = val.split("/")

            uuid = appInfo[0]
            path = appInfo[1]

            tablet._removeApk(self.name)
            self.logger.info('Install applauncher apk {}'.format(self.version))
            tablet._installApk(
                self._getAbsoluteUrl(uuid, '{}.apk'.format(self.name)))
            tablet.onApkInstalled.connect(self.onApkInstalled)

    @qi.nobind
    def on_list_changed(self, *unused):
        """Monitor ALAppInfo.appInfoList for changes; notify tablet."""
        self.updateApplications()

    @qi.nobind
    def on_permissions_changed(self, *unused):
        """Monitor ALAutonomousLife.userRequestableActivitiesViolations for changes;
        notify tablet.
        """
        self.updateApplications()

    @qi.nobind
    def on_language_changed(self, *unused):
        """Monitor ALTextToSpeech.languageTTS for changes; notify tablet"""
        self.updateApplications()

    @qi.nobind
    def on_package_custom_launcher_removed(self, packageInfo2):
        """Monitor PackageManager.onPackageRemoved"""
        self.logger.info('packageInfo2.uuid ' + packageInfo2['uuid'])

        tablet = self.get_tablet_service()
        if packageInfo2 is not None:
            if packageInfo2['uuid'] == self.custom_launcher.split('/')[0]:
                self.custom_launcher = None
                tablet._removeApk(self.name)
                self.install()

    def onTabletTouched(self, coord_x, coord_y):
        """Translate the ALTabletService.onTouchDown signal into an ALMemory
        event.
        """
        self.mem.raiseEvent('ALRALManagerModule/onTouchDown',
                            [coord_x, coord_y])

    def _getAbsoluteUrl(self, uuid, partial_url):
        """Returns the url of a file in the html directory."""
        subPath = os.path.join(uuid,
                               os.path.normpath(partial_url).lstrip("\\/"))
        # We create TabletService here in order to avoid
        # problems with connections and disconnections of the tablet during the
        # life of the application
        tablet = self.get_tablet_service()
        try:
            robot_ip = tablet.robotIp()
        except (AttributeError, RuntimeError) as err:
            self.logger.warning('Problem getting tablet IP: {}'.format(err))
            robot_ip = '198.18.0.1'

        return 'http://{}/apps/{}'.format(
            robot_ip,
            subPath.replace(os.path.sep, "/"))

    def onApkInstalled(self, pkg_id):
        """On apk installed on tablet."""
        self.logger.info('onApkInstalled')
        if pkg_id == self.name:
            self.logger.info('onApkInstalled pkg_id == self.name')
            self.startService()
            self.updateApplications()

    def display(self):
        """Display tablet app launcher."""
        tablet = self.get_tablet_service()
        self.logger.info('Display launcher')
        try:
            tablet._launchApk('jp.softbank.rb.rald')
        except (AttributeError, RuntimeError) as err:
            self.logger.warning('Problem launching APK: {}'.format(err))

    def restartTablet(self):
        """"Sometimes the tablet stops working and needs a restart."""
        self.logger.info("Restart tablet")
        command = [('/home/nao/.local/share/PackageManager' +
                    '/apps/applauncher/adb'),
                   'shell',
                   'am',
                   'force-stop',
                   'jp.softbank.tabletbrowser']
        subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         bufsize=-1)
        self.logger.info('End restart tablet')

    def emotion(self):
        """Display emotional bubble."""
        # dh : how to do it ?
        pass

    def webview(self):
        """Tbd."""
        pass

    def appLauncherClosed(self):
        """Raise signal when application launcher has been closed"""
        self.mem.raiseEvent("AppLauncher/Closed", 1)
        self.logger.info('App Launcher closed')

    def startService(self):
        """Start service"""

        self.logger.info('startService')
        command = [('/home/nao/.local/share/PackageManager' +
                    '/apps/applauncher/adb'),
                   'shell',
                   'am',
                   'broadcast',
                   '-a',
                   'jp.softbank.rb.rald.action.START_SERVICE',
                   '--include-stopped-packages']

        subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         bufsize=-1)

    def selectApp(self, apkName, appPath):
        """Show application selection screen"""

        command = [('/home/nao/.local/share/PackageManager' +
                    '/apps/applauncher/adb'),
                   'shell',
                   'am',
                   'broadcast',
                   '-a',
                   'jp.softbank.rb.rald.action.SELECT_APP',
                   '--es',
                   'pkg_name',
                   apkName]
        subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         bufsize=-1)

    def removeApp(self, appName):
        """Remove app by voice"""

        command = [('/home/nao/.local/share/PackageManager' +
                    '/apps/applauncher/adb'),
                   'shell',
                   'am',
                   'broadcast',
                   '-a',
                   'jp.softbank.rb.rald.action.REMOVE_APP',
                   '--es',
                   'app_name',
                   appName]
        subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         bufsize=-1)

    def defaultScreen(self):
        """Show default application screen (i.e. when apps have no
        tablet content of their own)
        """
        command = [('/home/nao/.local/share/PackageManager' +
                    '/apps/applauncher/adb'),
                   'shell',
                   'am',
                   'broadcast',
                   '-a',
                   'jp.softbank.rb.rald.action.DEFAULT_SCREEN']
        subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         bufsize=-1)

    def install(self):
        """Install tablet apk."""
        tablet = self.get_tablet_service()
        try:
            if not tablet._isApkExist(self.name):
                self.logger.info('Install applauncher apk {}'.format(self.version))
                tablet.onApkInstalled.connect(self.onApkInstalled)
                tablet._installApk(
                    self._getAbsoluteUrl('applauncher', '{}.apk'.format(self.name)))
            else:
                version = tablet._getApkVersion(self.name)
                if version != self.version:
                    self.logger.info('Update applauncher apk to {}'.format(self.version))
                    tablet._removeApk(self.name)
                    tablet.onApkInstalled.connect(self.onApkInstalled)
                    tablet._installApk(
                        self._getAbsoluteUrl('applauncher', '{}.apk'.format(self.name)))
                else:
                    self.updateApplications()
        except (AttributeError, RuntimeError):
            self.logger.warning('Problem installing APK')

    def updateApplications(self):
        """Update tablet application list."""
        self.update_applications_with_intent(None)

    @qi.bind(methodName='updateApplications')
    def update_applications_with_intent(self, intent):
        """Update tablet application list, with specific intent."""
        self.logger.info('Update applications')
        command = [('/home/nao/.local/share/PackageManager' +
                    '/apps/applauncher/adb'),
                   'shell',
                   'am',
                   'broadcast',
                   '-a',
                   'jp.softbank.rb.rald.action.UPDATE_APPLIST']
        if intent:
            command_intent = ['--es', intent, 'None']
            command += command_intent

        subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         bufsize=-1)
        self.logger.info('Update applications end')

    @qi.bind(
        methodName="_startFade",
        paramsType=[qi.Int32],
        returnType=qi.Void)
    def _startFade(self, time):
        """Start fade."""
        self.logger.info('Start fade')
        command = [('/home/nao/.local/share/PackageManager' +
                    '/apps/applauncher/adb'),
                   'shell',
                   'am',
                   'broadcast',
                   '-a',
                   'jp.softbank.rb.rald.action.START_FADE',
                   '--ei',
                   'time',
                   str(time)]
        subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         bufsize=-1)
        self.logger.info('Fade end')

    def _finishApk(self):
        """Finish activity."""
        self.logger.info('Finish activity')
        command = [('/home/nao/.local/share/PackageManager' +
                    '/apps/applauncher/adb'),
                   'shell',
                   'am',
                   'broadcast',
                   '-a',
                   'jp.softbank.rb.rald.action.ACTIVITY_FINISH']
        subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         bufsize=-1)
        self.logger.info('Finish activity end')

    def _showError(self, error):
        """Show error activity"""
        self.logger.info('Show error')
        command = [('/home/nao/.local/share/PackageManager' +
                    '/apps/applauncher/adb'),
                    'shell',
                    'am',
                    'broadcast',
                    '-a',
                    'jp.softbank.rb.rald.action.SHOW_ERROR',
                    '--es',
                    'error_message',
                    error]
        subprocess.Popen(command,
                         stdout=subprocess.PIPE,
                         stderr=subprocess.PIPE,
                         bufsize=-1)
        self.logger.info('Show error end')

    def _strip_aldebaran_mail(self, user):
        for email in ALDEBARAN_EMAILS:
            if user.endswith(email):
                user = user[:-len(email)]
                break
        return user

    def getUserOauthToken(self, login, password):
        if not login and not password:
            self.logger.error("Empty user or password")
            #raise.RuntimeError("Empty username or password, cannot authenticate.")

        user_cert_file = qi.path.findConf("", USER_CERT)
        user_key_file = qi.path.findConf("", USER_KEY)

        if not user_cert_file:
            self.logger.error("Could not find user certificate file")
            #raise.RuntimeError("Could not find user certificate file")

        if not user_key_file:
            self.logger.error("Could not find user key file")
            #raise.RuntimeError("Could not find user key file")

        login = self._strip_aldebaran_mail(login)
        user_credentials = UserOAuth2Credentials(
            client_id=USER_CLIENT_ID,
            cert=user_cert_file,
            key=user_key_file,
            login=login,
            password=password,
        )
        user_credentials.refresh()
        return user_credentials.access_token

    def getUserRequestableViolations(self):
        """Placeholder function until the permissions is updated."""
        return self.alife.userRequestableActivitiesViolations.value()

    def startRobotApp(self, uuid, behavior_path, app_name):
        self.logger.info('ALRALManagerModule',
                         ('startRobotApp uuid={} ' +
                          'behavior_path={} app_name={}').format(
                              uuid, behavior_path, app_name))

        try:
            targetbehavior = os.path.join(uuid, behavior_path)
            self.target_behavior = targetbehavior
            self._activityRequestedByUser(targetbehavior)
            # self.logger.info(targetbehavior)
            # self.alife.switchFocus(targetbehavior)
        except Exception, e:
            self.logger.error(e)

        return True

    def getAppNameByLocale(self, uuid, locale):
        try:
            locale_langs = self.packman.package(uuid)["langToName"]
            return locale_langs[locale]
        except KeyError:
            try:
                return locale_langs['en_US']
            except KeyError:
                return ''

    # 充電ステーション接続状態取得
    def isConnectedToChargingStation(self):
        # CA: The definition of this variable is missing in the RAL
        #     copy/paste.
        # Changes here to None for the sake of the code being valid.
        # if self.common.RAL_SUPPORT_CHARGING_STATION:
        if None:
            templist = self.mem.getEventHistory(
                'ALBattery/ConnectedToChargingStation')
            self.logger.info('ALRALManagerModule isConnectedToChargingStation list={}'
                             .format(templist))
            if isinstance(templist, list):
                if len(templist) > 0:
                    if templist[len(templist) - 1][0]:
                        return True
        return False

    def _setSubscribers(self):
        # Pereference変化監視登録
        self.subscriber_added = self.mem.subscriber('preferenceAdded')
        self.subscriber_added.signal.connect(self._onPreferenceAdded)

        self.subscriber_changed = self.mem.subscriber('preferenceChanged')
        self.subscriber_changed.signal.connect(self._onPreferenceChanged)

        self.subscriber_removed = self.mem.subscriber('preferenceRemoved')
        self.subscriber_removed.signal.connect(self._onPreferenceRemoved)

        self.subscriber_domainrm = self.mem.subscriber(
            'preferenceDomainRemoved')
        self.subscriber_domainrm.signal.connect(
            self._onPreferenceDomainRemoved)

        self.subscriber_sync = self.mem.subscriber(
            'preferenceSynchronized')
        self.subscriber_sync.signal.connect(self._onPreferenceSynchronized)

    def getIgnoredApps(self):
        if self.xmlparsed is False:
            prefxml = self.pref.getValue('jp.softbank.rb.rald', 'launchcond')
            if prefxml is not None:
                self.logger.info('launchcond=' + prefxml)
                self.ignoredapps = self._parseXML(prefxml)
            else:
                self.logger.info('launchcond is None.')
                self.ignoredapps = ""

            self.xmlparsed = True

        return self.ignoredapps

    def _onPreferenceAdded(self, val):
        self.logger.info('onPreferenceAdded val=' + str(val))
        if val[0] == 'jp.softbank.rb.rald' and val[1] == 'launchcond':
            self.logger.info('add launchcond pref.')
            self.ignoredapps = None
            self.xmlparsed = False

    def _onPreferenceChanged(self, val):
        self.logger.info('onPreferenceChanged val=' + str(val))
        if val[0] == 'jp.softbank.rb.rald' and val[1] == 'launchcond':
            self.logger.info('change launchcond pref.')
            self.ignoredapps = None
            self.xmlparsed = False

    def _onPreferenceRemoved(self, val):
        self.logger.info('onPreferenceRemoved val=' + str(val))
        if val[0] == 'jp.softbank.rb.rald' and val[1] == 'launchcond':
            self.logger.info('remove launchcond pref.')
            # 削除された場合は、空のリストで解析済みにしておく。
            self.ignoredapps = ""
            self.xmlparsed = True

    def _onPreferenceDomainRemoved(self, val):
        self.logger.info('onPreferenceDomainRemoved val=' + str(val))
        if val == 'jp.softbank.rb.rald':
            self.logger.info('remove ral domain.')
            # 削除された場合は、空のリストで解析済みにしておく。
            self.ignoredapps = ''
            self.xmlparsed = True

    def _onPreferenceSynchronized(self):
        self.logger.info('onPreferenceSynchronized')
        self.xmlparsed = False

    def _parseXML(self, val):
        ret = ''

        try:
            root = ET.fromstring(val)
        except:
            self.logger.info('parseXML parse error.')
            self.logger.info(traceback.format_exc())
            return ret

        hasroot = False
        hasversion = False
        hasdate = False

        templist = []

        self.logger.info('_parseXML root.tag=' + root.tag)

        if root.tag == 'IgnoredApps':
            hasroot = True

        for elem in root:
            if elem.tag == 'Version':
                hasversion = True

            if elem.tag == 'Date':
                hasdate = True

            if elem.tag == 'Apps':
                for app in elem:
                    if app.tag != 'app':
                        continue

                    invaliddata = False

                    attrkeylist = app.keys()

                    for attrkey in attrkeylist:
                        if attrkey == 'equal':
                            pass
                        elif attrkey == 'start':
                            pass
                        elif attrkey == 'end':
                            pass
                        else:
                            invaliddata = True

                    if invaliddata:
                        self.logger.info('invaliddata!! skip.')
                        self.logger.info('app.attrs=' + str(app.items()))
                        continue

                    equalattr = app.get('equal')
                    startattr = app.get('start')
                    endattr = app.get('end')

                    if equalattr is not None:
                        if (startattr is None) and (endattr is None):
                            # 完全一致のケース
                            equalattr = equalattr.strip()
                            if equalattr != "":
                                adddata = {'type': 'equal', 'val1': equalattr}
                                if adddata not in templist:
                                    templist.append(adddata)
                                else:
                                    self.logger.info('_parseXML attr duplicated1.')
                                    self.logger.info('app.attrs={}'.format(app.items()))
                        else:
                            # start、eng属性が存在した場合は無視
                            self.logger.info('_parseXML attr err1.')
                            self.logger.info('app.attrs={}'.format(app.items()))
                    else:
                        if (startattr is not None) and (endattr is not None):
                            # 前方＆後方一致
                            startattr = startattr.strip()
                            endattr = endattr.strip()
                            if startattr != ' and endattr != ':
                                adddata = {'type': 'start_end',
                                           'val1': startattr,
                                           'val2': endattr}
                                if adddata not in templist:
                                    templist.append(adddata)
                                else:
                                    self.logger.info('_parseXML attr duplicated2.')
                                    self.logger.info('app.attrs=' + str(app.items()))
                        elif (startattr is not None) and (endattr is None):
                            # 前方一致
                            startattr = startattr.strip()
                            if startattr != "":
                                adddata = {'type': 'start', 'val1': startattr}
                                if adddata not in templist:
                                    templist.append(adddata)
                                else:
                                    self.logger.info('_parseXML attr duplicated3.')
                                    self.logger.info('app.attrs={}'.format(app.items()))
                        elif (startattr is None) and (endattr is not None):
                            # 後方一致
                            endattr = endattr.strip()
                            if endattr != '':
                                adddata = {'type': 'end', 'val1': endattr}
                                if adddata not in templist:
                                    templist.append(adddata)
                                else:
                                    self.logger.info('_parseXML attr duplicated4.')
                                    self.logger.info('app.attrs='.format(app.items()))
                        else:
                            # 上記以外は無視
                            self.logger.info('_parseXML attr err2.')
                            self.logger.info('app.attrs='.format(app.items()))

        self.logger.info('hasroot={} hasversion={} hasdate='
                         .format(hasroot, hasversion, hasdate))

        if hasroot and hasversion and hasdate:
            # モジュールから取得した場合にディクショナリがリストに変わってしまったため
            # jsonで渡すことにする。
            ret = json.dumps(templist)

        self.logger.info('_parseXML ret=' + ret)

        return ret



def startService(session):
    sbral = SBRAppLauncher(session)
    session.registerService('ALRALManagerModule', sbral)
    sbral.install()


def main():
    """Register and start ALRALManagerModule service."""
    app = qi.Application()
    app.start()
    session = qi.Session()
    session.connect('tcp://127.0.0.1:9559')
    startService(session)
    app.run()


if __name__ == '__main__':
    main()
