import time
import traceback
import qi
import sys
import httplib
import os
import logging
import subprocess
import re
import datetime

from contextlib import closing
from socket import socket, AF_INET, SOCK_DGRAM
import struct

NTP_PACKET_FORMAT = "!12I"
_SYSTEM_EPOCH = datetime.date(*time.gmtime(0)[0:3])
_NTP_EPOCH = datetime.date(1900, 1, 1)
NTP_DELTA = (_SYSTEM_EPOCH - _NTP_EPOCH).days * 24 * 3600
NTP_QUERY = '\x1b' + 47 * '\0'
def ntp_time(host="pool.ntp.org", port=123):
        with closing(socket( AF_INET, SOCK_DGRAM)) as s:
            s.sendto(NTP_QUERY, (host, port))
            msg, address = s.recvfrom(1024)
        unpacked = struct.unpack(NTP_PACKET_FORMAT,
                       msg[0:struct.calcsize(NTP_PACKET_FORMAT)])
        return unpacked[10] + float(unpacked[11]) / 2**32 - NTP_DELTA


@qi.multiThreaded()
class ALBootConfig:

    __VERSION__ = "2.0.1"

    PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    LOG_FILE = os.path.join(PATH, "logs", "ALBootConfig.log")
    AAPT_PATH = os.path.join(PATH, "bin", "aapt")

    APP_IDENTIFIER = "naoqi.core.ALBootconfig"

    JAPANESE_KEYBOARD = "jp.co.omronsoft.iwnnime.ml/.standardcommon.IWnnLanguageSwitcher"
    JAPANESE_KEYBOARD_APK_PATH =  "http://%s/apps/boot-config/JapaneseKeyboard.apk"

    JAPANESE_KEYBOARD_HACKED_APK_PATH = os.path.join(PATH, "html", "JapaneseKeyboard_settings_hacked.apk")
    JAPANESE_KEYBOARD_HACKED_APK_URL = "http://%s/apps/boot-config/JapaneseKeyboard_settings_hacked.apk"

    LATIN_KEYBOARD_HACKED_APK_PATH = os.path.join(PATH, "html", "LatinIME_settings_hacked.apk")
    LATIN_KEYBOARD_HACKED_APK_URL = "http://%s/apps/boot-config/LatinIME_settings_hacked.apk"

    SETTINGS_KEYBOARD_HACKED_APK_PATH = os.path.join(PATH, "html", "Settings_keyboard_hacked.apk")
    SETTINGS_KEYBOARD_HACKED_APK_URL = "http://%s/apps/boot-config/Settings_keyboard_hacked.apk"

    QML_BOOT_CONFIG_APK_NAME = "com.aldebaran.bootconfig"
    QML_BOOT_CONFIG_APK_PATH =  "http://%s/apps/boot-config/bootconfig.apk"

    DISABLELIFEANDDIALOG = "com.aldebaran.debug", "DisableLifeAndDialog"
    WIZARDSTATE = "com.aldebaran.wizard", "state"
    WIZARDSTATE_SYSTEM_UPDATING = "updating"
    WIZARDSTATE_SYSTEM_UPDATING_WITH_OTA = "updatingWithOta"
    WIZARDSTATE_SYSTEM_UPDATED = "updated"

    CONFIGMODALITY = "com.aldebaran.settings", "InteractiveConfigModality"
    CONFIGMODALITY_TABLETONLY = "TabletOnly"
    CONFIGMODALITY_TABLETORDIALOG = "TabletOrDialog"
    CONFIGMODALITY_DIALOG = "Dialog"
    CONFIGMODALITY_OFF = "NoInteractive"

    UPDATEPOLICY = "com.aldebaran.settings", "UpdatePolicy"
    UPDATEPOLICY_AUTOMATIC = "Automatic"
    UPDATEPOLICY_INTERACTIVE = "Interactive"
    UPDATEPOLICY_COMPULSORY = "Compulsory"
    UPDATEPOLICY_IGNORE = "Ignore"

    TABLETDEBUGALLOWED = "com.aldebaran.system", "TabletDebugAllowed"
    TABLETDEBUGALLOWED_NO = "0"
    TABLETDEBUGALLOWED_YES = "1"

    AUTOSTARTINTERACTIVECONFIG = "com.aldebaran.settings", "AutostartInteractiveConfig"
    AUTOSTARTINTERACTIVECONFIG_NO = "0"
    AUTOSTARTINTERACTIVECONFIG_YES = "1"

    MOVEMENTDEACTIVATED = "com.aldebaran.debug", "MovementDeactivated"
    MOVEMENTDEACTIVATED_NO = "0"
    MOVEMENTDEACTIVATED_YES = "1"

    DEFAULT_PREFERENCES = {
        CONFIGMODALITY: CONFIGMODALITY_TABLETONLY,
        UPDATEPOLICY: UPDATEPOLICY_IGNORE,
        TABLETDEBUGALLOWED: TABLETDEBUGALLOWED_NO,
        AUTOSTARTINTERACTIVECONFIG: AUTOSTARTINTERACTIVECONFIG_NO,
        MOVEMENTDEACTIVATED: MOVEMENTDEACTIVATED_NO,
        DISABLELIFEANDDIALOG: "0",
        WIZARDSTATE: ""
    }

    def __init__(self, session):
        """ ALBootConfig is a service to handle the boot of the robot

        """
        self.session = session
        self.finishing = False
        self.movement_deactivated = False
        self.is_online = False
        self.apkStarted = False
        self.aboutToReboot = False
        self.isGmsTablet = False

        #logger
        self.logger = qi.logging.Logger(ALBootConfig.APP_IDENTIFIER)
        self.module = qi.module("qicore")
        self.logManager = self.session.service("LogManager")
        self.provider = self.module.createObject("LogProvider", self.logManager)
        self.providerId = self.logManager.addProvider(self.provider)

        #subsribe to itself to put log in file
        self.listener = self.logManager.createListener()
        self.listener.clearFilters()
        self.listener.addFilter("ALMemory", qi.logging.SILENT)
        self.listener.addFilter("ALMotion", qi.logging.SILENT)
        self.listener.onLogMessage.connect(self._onLogMessage)

        if os.path.exists(ALBootConfig.LOG_FILE):
            os.remove(ALBootConfig.LOG_FILE)

        logging.basicConfig(filename=ALBootConfig.LOG_FILE, level=logging.DEBUG, format='%(asctime)s %(message)s')

        self.logger.info("Starting ...")


        #services
        self.serviceDirectory = self._get_service("ServiceDirectory")
        if not self.serviceDirectory:
            self.logger.error("ServiceDirectory not found, finishing boot config .....")
            return self.finish()

        self.altabletservice = self._get_service("ALTabletService")

        self.alconnectionmanager = self._get_service("ALConnectionManager")
        self.alrobotmodel = self._get_service("ALRobotModel")
        self.almemory = self._get_service("ALMemory")
        self.packagemanager = self._get_service("PackageManager")
        self.albehaviormanager = self._get_service("ALBehaviorManager")
        self.alpreferencemanager = self._get_service("ALPreferenceManager")
        self.almotion = self._get_service("ALMotion")
        self.alautonomousmove = self._get_service("ALAutonomousMoves")
        self.alstore = self._get_service("ALStore")

        self.alautonomouslife = self._get_service("ALAutonomousLife")
        if self.alautonomouslife:
            self.alautonomouslife._forbidStopCommands(True,)  # deactivate the stop app
            self.alautonomouslife.setSafeguardEnabled("RobotPushed", False)
            self.alautonomouslife.setSafeguardEnabled("RobotFell", False)
            self.alautonomouslife.setSafeguardEnabled("RobotMoved", False)
            self.alautonomouslife.setSafeguardEnabled("CriticalDiagnosis", False)
            self.alautonomouslife.setSafeguardEnabled("CriticalTemperature", False)

        # subscribe to events/signals
        self.serviceSignal = self.serviceDirectory.serviceAdded.connect(self._handleServiceAdded)
        self.serviceSignalR = self.serviceDirectory.serviceRemoved.connect(self._handleServiceRemoved)

        self.firstLaunch = self._check_and_set_first_launch()

        if self.alrobotmodel._getRobotType() != 1:
            self.logger.info("The robot is not a Pepper, skip interactive config ....")
            return self.finish()

        self.hasStarted = False
        if self.altabletservice:
            self._check_is_gms_tablet()
            self.hasStarted = True
            self.robotIp = self.altabletservice.robotIp()
            self.altabletservice.onApkInstalled.connect(self._onApkInstalled)
            self.startbootconfig()
        else:
            state = self._get_state()
            if (state == ALBootConfig.WIZARDSTATE_SYSTEM_UPDATING or state == ALBootConfig.WIZARDSTATE_SYSTEM_UPDATED) and self._isBCApkRunning():
                self.logger.info("Finishing system update with ALTabletService missing")
                self.hasStarted = True
                self.apkStarted = True
                self.runInit()
                self._finishUpdate()
            elif state == ALBootConfig.WIZARDSTATE_SYSTEM_UPDATING_WITH_OTA:
                self.logger.info("Finishing system and tablet update with ALTabletService missing")
                if self.almotion:
                    try:
                        self.almotion.wakeUp()
                    except Exception as e:
                        self.logger.error("Error playing wake up: %s " % e)
                if not self.movement_deactivated and self.albehaviormanager:
                    try:
                        self.albehaviormanager.startBehavior("boot-config/animations/inviteTablet")
                    except Exception as e:
                        self.logger.error("Error playing animation: %s" % e)
                guessTimeForTabletUpdate = 20 # TODO value ?
                self._waitForTabletReconnection(guessTimeForTabletUpdate * 60)
                if not self.altabletservice:
                    self.logger.info("ALTabletService missing, finishing boot-config.")
                    self.finish()
            else:
                self._waitForTabletReconnection(8 * 60)
                if not self.altabletservice:
                    self.logger.info("ALTabletService missing, finishing boot-config.")
                    self.finish()

    @qi.nobind
    def startbootconfig(self):
        self._start_working_feedback()
        self._install_apks_if_needed()
        self.run()

    #
    # Logs
    #
    @qi.nobind
    def _onLogMessage(self, log):
        try:
            logging.debug("%s - %s" % (log["category"], log["message"]))
        except Exception:
            pass

    #
    # Helpers
    #
    @qi.nobind
    def _is_18_tablet(self):
        try:
            model = self.altabletservice._getTabletModelName()
            if model == "LPT_200AR" or model == "LPT_201AR":
                return True
        except Exception as e:
            self.logger.error("Error while getting tablet model: %s" % e)
        return False

    @qi.bind(returnType=qi.Bool, paramsType=[], methodName="isClockWebSynchro")
    def is_clock_web_synchro(self):
      """ isClockWebSynchro
        Compare UTC time according to the robot and to NTP server
        Return False if (NTP time - robot time) > 2 minutes, otherwise return True
        This function must be called while having an internet connection
      """
      sysdate = datetime.datetime.utcnow()
      webdate = datetime.datetime.utcfromtimestamp(ntp_time())
      diff = webdate - sysdate
      refdiff = datetime.timedelta(minutes=2)
      self.logger.info("Check clock web synchro: system(%s), web(%s), diff(%s) " % (sysdate, webdate, diff))
      return (diff < refdiff)

    @qi.nobind
    def _system_version(self):
        alsystem = self._get_service("ALSystem")
        if alsystem:
          try:
              return alsystem.systemVersion()
          except Exception as e:
              self.logger.error("Error while getting system version: %s" % e)
        return ""

    @qi.nobind
    def _read_apk_version(self, fileName):
        try:
          res = subprocess.check_output([self.AAPT_PATH, "d", "badging", fileName])
          m = re.search("versionName='(.*?)'", res)
          return m.group(1)
        except Exception as e:
            self.logger.error("Error while reading %s version: %s" % (fileName, e))
        return ""

    @qi.nobind
    def _read_apk_name(self, fileName):
        try:
          res = subprocess.check_output([self.AAPT_PATH, "d", "badging", fileName])
          m = re.search("package: name='(.*?)'", res)
          return m.group(1)
        except Exception as e:
            self.logger.error("Error while reading %s name: %s" % (fileName, e))
        return ""

    @qi.nobind
    def _check_is_gms_tablet(self):
        gms = False
        if self.altabletservice:
            try:
                version = self.altabletservice._getApkVersion("com.google.android.gms")
                if not version == None:
                    gms = True
            except Exception:
                pass
        if gms:
            self.logger.info("Tablet is GMS")
        else:
            self.logger.info("Tablet is not GMS")
        self.isGmsTablet = gms

    @qi.nobind
    def _update_apk_if_needed(self, name, path, url):
        apk_version = self._read_apk_version(path)
        apk_name = self._read_apk_name(path)
        apk_installed_version = self._get_apk_version(apk_name)
        if str(apk_version) != str(apk_installed_version):
            self.logger.info("[UpdateApk] Updating %s from version %s to %s" % (apk_name, str(apk_installed_version), str(apk_version)))
            success = False
            try:
                success = self.altabletservice._installApk(url % self.robotIp)
            except Exception as e:
                self.logger.error("[UpdateApk] Unable to install %s: %s" % (name, e))
                return
            if success:
                self.logger.info("[UpdateApk] Install of %s succeded" % apk_name)
            else:
                self.logger.error("[UpdateApk] Install of %s failed" % apk_name)

    @qi.nobind
    def _get_service(self, serviceName):
        """ Retrieve a service.
            Parameters:
                (String) serviceName - the name of the service
            Return:
                (Object) The service if it's available, None otherwise
        """
        try:
            return self.session.service(serviceName)
        except Exception as e:
            self.logger.error("error during getting the service %s : %s " % (serviceName, e))
            return None

    @qi.nobind
    def _iter_needed_upgrades(self):
        for pkginfo in self.alstore.getPackagesInfo():
            pkgdict = dict(pkginfo)
            if pkgdict["status"] == 3:
                yield pkgdict

    @qi.nobind
    def _is_update_needed(self):
        try:
            for item in self._iter_needed_upgrades():
                return True
            return False
        except Exception as e:
            self.logger.error("Exception while checking packages: %s" % e)
            return False

    @qi.nobind
    def _get_state(self):
        try:
            return self.alpreferencemanager.getValue("com.aldebaran.wizard", "state")
        except Exception as e:
            self.logger.error("Unable to get state, error : %s" % e)
            return None

    @qi.nobind
    def _isBCApkRunning(self):
        try:
            service = self.session.service("QmlBootConfig")
        except Exception as e:
            return False
        if service:
            return True
        return False

    @qi.bind(returnType=qi.Void, paramsType=[qi.Bool])
    def _setAboutToReboot(self, value):
        self.aboutToReboot = value
        self.logger.info("About to reboot set to: %s" % value)

    @qi.nobind
    def _start_working_feedback(self):
        if self.altabletservice:
            try:
                self.altabletservice.loadUrl("http://%s/apps/boot-config/preloading_dialog.html" % self.robotIp)
                self.altabletservice.showWebview()
            except Exception as e:
                self.logger.error("Error while showing loading gif : %s" % e)

        if not self.movement_deactivated and self.albehaviormanager:
            try:
                if self.almotion:
                    self.almotion.setBreathEnabled("Arms", False)
                self.albehaviormanager.startBehavior("boot-config/animations/networkLoop")
            except Exception as e:
                self.logger.error("Error during starting loop : %s" % e)

    @qi.nobind
    def _stop_working_feedback(self):
        if self.altabletservice:
            try:
                self.altabletservice.hideWebview()
            except Exception as e:
                self.logger.error("Error while hidding loading gif : %s" % e)

        if not self.movement_deactivated and self.albehaviormanager:
            time.sleep(1)
            try:
                self.albehaviormanager.stopBehavior("boot-config/animations/networkLoop")
                if self.almotion:
                    self.almotion.setBreathEnabled("Arms", True)
            except Exception as e:
                self.logger.error("Error during stoping loop : %s" % e)

    #
    # Services management
    #
    @qi.nobind
    def _handleServiceAdded(self, serviceId, serviceName):
        if serviceName == "ALTabletService":
            self.altabletservice = self._get_service("ALTabletService")
            self.logger.info("Tablet reconnected!")
            self._check_is_gms_tablet()
            self.robotIp = self.altabletservice.robotIp()
            self.altabletservice.onApkInstalled.connect(self._onApkInstalled)

            if not self.hasStarted:
                self.hasStarted = True
                self.startbootconfig()

            if getattr(self, "promiseWaitingTabletReconnection", None): # waiting for tablet reconnection
                self.promiseWaitingTabletReconnection.setValue(True)
                return

    @qi.nobind
    def _handleServiceRemoved(self, serviceId, serviceName):
        if serviceName == "ALTabletService":
            self.logger.info("ALTabletService unregistered")
            self.altabletservice = None
        elif serviceName == "QmlBootConfig":
            self.logger.info("QmlBootConfig unregistered")
            if self.apkStarted and self._get_state() != ALBootConfig.WIZARDSTATE_SYSTEM_UPDATING_WITH_OTA:
                self._exit()
                return
            self.hasStarted = False
            self.apkStarted = False
            self.logger.info("Waiting while tablet is updating")

    #
    # Network management
    #
    @qi.nobind
    def _checkConnectivity(self):
        """ Check if the robot is online
            If a internet connection is available, it starts the preference update
            Otherwise, it will wait for an event from ALConnectionManager
        """
        is_online = False

        try:
            is_online = (self.alconnectionmanager.state() == "online")
        except Exception as e:
            self.logger.warning("ALConnectionManager not present, acting as if offline. (error : %s)" % e)

        if is_online:
            self._onOnline()
        else:
            self.logger.info("No connection, continuing without synchronizing prefs but wait for network")
            networkStateChangedEvent = self.almemory.subscriber("NetworkStateChanged")
            networkStateChangedEvent.signal.connect(self._onNetworkStateChanged)

    @qi.nobind
    def _onOnline(self):
        if self.is_online:
            return

        self.is_online = True
        self.logger.info("The robot is online, synchronizing prefs...")
        self._onPreferencesSynchronizedEvent = self.almemory.subscriber("preferenceSynchronized")
        self._onPreferencesSynchronizedEvent.signal.connect(self._onPreferenceSychronized)
        self.alpreferencemanager.update()

    @qi.nobind
    def _onNetworkStateChanged(self, state):
        """ Callback to handle the change of the network """
        self.logger.info("New network state: " + state)
        if state == "online":
            self._onOnline()
        if state == "offline":
            self.is_online = False

    def _onPreferenceSychronized(self, value):
        """ Callback to handle the preference when they just synchronized """
        self.logger.info("Preferences synchronized.")
        self._update_from_preferences()

    @qi.nobind
    def _update_from_preferences(self):
        # 1) Update tablet debug state
        if self.altabletservice:
            try:
                if (self._get_preference(ALBootConfig.TABLETDEBUGALLOWED) == ALBootConfig.TABLETDEBUGALLOWED_YES):
                    self.logger.info("Enable the debug tablet")
                    self.altabletservice._setDebugEnabled(True)
                else:
                    self.logger.info("Disable the debug tablet")
                    self.altabletservice._setDebugEnabled(False)
            except Exception as e:
                self.logger.error("Error while setting tablet service debug mode: %s" % e)

        # 2) Movement deactivated
        movement_deactivated = self._get_preference(ALBootConfig.MOVEMENTDEACTIVATED)
        if movement_deactivated == ALBootConfig.MOVEMENTDEACTIVATED_YES:
            self.movement_deactivated = True
        else:
            self.movement_deactivated = False

    @qi.nobind
    def _onPackagesUpdated(self, result):
        self.logger.info("Packages update ended.")

    @qi.nobind
    def _check_almemory(self, key):
        try:
            return self.almemory.getData(key)
        except Exception as e:
            # The key doesn't seem to be there: treat as False
            return False

    @qi.nobind
    def _check_and_set_first_launch(self):
        key = "BootConfig/HasStartedAtBoot"
        if self._check_almemory(key):
            return False
        else:  # The key doesn't seem to be there: first launch
            self.almemory.raiseEvent(key, True)
            return True


    @qi.nobind
    def _cancelWaitForTabletReconnection(self):
        self.logger.warning("Canceling wait for tablet reconnection")
        if self.promiseWaitingTabletReconnection:
            self.promiseWaitingTabletReconnection.setValue(False)

    def getReleaseNotes(self, version, lang):
        """ Retrieve a release notes for Naoqi version.
            Parameters:
                version : the version of Naoqi
                lang : the lang to retrieve the release notes
        """
        self.logger.info("Retrieve release notes from aldebaran.com (version:%s, lang:%s)" % (version, lang))

        try:
            conn = httplib.HTTPConnection("doc.aldebaran.com", timeout=30)
            conn.request("GET", "/releasenotes/%s/%s.html" % (version, lang))
            res = conn.getresponse()
            if res.status != 200:
                raise Exception("Release notes not found !")
        except Exception as e:
            self.logger.error("Unable to retrieve the releasenotes : %s" % e)
            return None

        return res.read()

    #
    # Tablet functions
    #
    @qi.nobind
    def _waitForTabletReconnection(self, t):
        """ Wait for the ALTabletService reconnection for x secunds
            Parameters:
                t (int) - the time to wait the reconnection in sec
        """
        self.logger.info("ALTabletService not found, wait %ss for reconnection ..." % t)
        self.promiseWaitingTabletReconnection = qi.Promise()
        qi.async(self._cancelWaitForTabletReconnection, delay=t*1000000)
        self.promiseWaitingTabletReconnection.future().wait()
        self.promiseWaitingTabletReconnection = None

    @qi.nobind
    def _update_tablet_if_needed(self, waitForTabletReconnection):
        """ Uninstall previous version of j-tablet-browser if there is a previously installed and
            - version provided by NAOqi is different from the one install on the tablet
            - version installed on the tablet is lower than 3.3.12
            (From that version, j-tablet-browser is able to update by itself)
        """
        self.logger.info("[UpdateTablet] Check if tablet update is needed ...")
        packageVersion = self._get_package_version("j-tablet-browser")
        self.logger.info("package version %s" % str(packageVersion))

        if self.altabletservice:
            launcherVersion = self._get_tablet_launcher_version()
            if launcherVersion is None:
                self.logger.warning("[UpdateTablet] Unable to get the version of the tablet launcher, can't check if update is needed")
                return

            if (packageVersion != launcherVersion and str(launcherVersion) < "3.3.12"):
                self.logger.info("[UpdateTablet] Launcher uninstall needed: tablet has launcher %s, but package %s is downloaded" % (launcherVersion, packageVersion))
                try:
                    self.logger.info("[UpdateTablet] Start the uninstall apps")
                    self.altabletservice._uninstallApps()

                except Exception as e:
                    self.logger.error("[UpdateTablet] Uninstall tablet apps failed: %s" % e)

                if waitForTabletReconnection:
                    self._stop_working_feedback()
                    self._waitForTabletReconnection(180)
                    self._start_working_feedback()

            else:
                self.logger.info("[UpdateTablet] Update not needed: tablet has launcher %s, and package %s is downloaded" % (launcherVersion, packageVersion))
        else:
            self.logger.warning("UpdateTablet] Tablet Launcher update not possible: no ALTabletService.")

    @qi.nobind
    def _get_preference(self, valuedef):
        """ Helper to retrieve a preference
            Parameters:
                (tuple) valueDef - tuple with (domain, key)
            Return:
                (Object) The preference value if it exists, the default value
                          (defined in DEFAULT_PREFERENCES), None otherwise
        """
        if self.alpreferencemanager:
            try:
                value = self.alpreferencemanager.getValue(*valuedef)
                if value is not None:
                    return value
            except Exception as e:
                pass

        return self.DEFAULT_PREFERENCES.get(valuedef, None)

    @qi.nobind
    def _get_package_version(self, packageID):
        try:
            pkginfo = dict(self.packagemanager.package(packageID))
            if pkginfo:
                return pkginfo.get("version", None)
            else:
                self.logger.warning("No package info for %s: " % packageID)
                return None
        except Exception as e:
            self.logger.error("Couldn't get package info for %s: (error : %s)" % (packageID, e))
            return None

    @qi.nobind
    def _get_tablet_launcher_version(self):
        try:
            return self.altabletservice.version()
        except Exception as e:
            self.logger.error("Error during get the tablet launcher version : %s" % e)
            return None

    @qi.nobind
    def _get_apk_version(self, apk_name):
        try:
            return self.altabletservice._getApkVersion(apk_name)
        except Exception as e:
            self.logger.error("Couldn't get apk version for %s: (error : %s)" % (apk_name, e))
            return None

    @qi.nobind
    def _install_apks_if_needed(self):
        self.logger.info("[UpdateApk] Check if apks install/update is needed ...")

        if not self.altabletservice:
            self.logger.error("[UpdateApk] ALTabletService missing")
            return False

        is_tablet_18 = self._is_18_tablet()
        is_version_252 = self._system_version().startswith("2.5.2")

        if not is_tablet_18 or not is_version_252 or self.isGmsTablet:
            try:
                keyboards = self.altabletservice.getAvailableKeyboards()
                if self.JAPANESE_KEYBOARD not in keyboards:
                    self.logger.info("[UpdateApk] Installing keyboard")
                    success = self.altabletservice._installApk(self.JAPANESE_KEYBOARD_APK_PATH % self.robotIp)
                    if not success:
                        self.logger.error("Error while installing Japanese keyboard")
            except Exception as e:
                self.logger.error("Unable to get the available keyboard : %s" % e)

        if is_tablet_18 and is_version_252 and not self.isGmsTablet:
            self._update_apk_if_needed("japanese keyboard (v2)", self.JAPANESE_KEYBOARD_HACKED_APK_PATH, self.JAPANESE_KEYBOARD_HACKED_APK_URL)
            self._update_apk_if_needed("latin keyboard (v2)", self.LATIN_KEYBOARD_HACKED_APK_PATH, self.LATIN_KEYBOARD_HACKED_APK_URL)
            self._update_apk_if_needed("settings (v2)", self.SETTINGS_KEYBOARD_HACKED_APK_PATH, self.SETTINGS_KEYBOARD_HACKED_APK_URL)

        bc_package_version = self._get_package_version("boot-config")
        bc_apk_version = self._get_apk_version(self.QML_BOOT_CONFIG_APK_NAME)
        if not (bc_apk_version is None) and (str(bc_apk_version) != str(bc_package_version)):
            self.logger.info("[UpdateApk] Removing boot config %s" % bc_apk_version)
            try:
                self.altabletservice._removeApk(self.QML_BOOT_CONFIG_APK_NAME)
            except Exception as e:
                self.logger.warning("Unable to uninstall boot config %s: %s" % (bc_apk_version, e))

        if str(bc_apk_version) != str(bc_package_version):
            self._update_tablet_if_needed(True)

            self.logger.info("[UpdateApk] Installing boot config %s" % bc_package_version)
            success = True
            try:
                success = self.altabletservice._installApk(self.QML_BOOT_CONFIG_APK_PATH % self.robotIp)
            except Exception as e:
                self.logger.error("Unable to install boot config %s: %s" % (bc_package_version, e))
                success = False

            if not success:
                self.logger.error("Error while installing boot config")
                return False
            return True

    @qi.nobind
    def _onApkInstalled(self, data):
        if data == self.QML_BOOT_CONFIG_APK_NAME:
            self.logger.info("[UpdateApk] Boot Config Installed !")

    #
    # Run functions
    #
    def runInit(self):
        self._checkConnectivity()
        self._update_from_preferences()

        if self.altabletservice:
            try:
                self.logger.info("Enable the tablet wifi")
                self.altabletservice.enableWifi()
            except Exception as e:
                self.logger.error("Exception calling ALTabletService.enableWifi(): %s" % e)


    def run(self):
        """ main run function """
        try:
            self.logger.info("Running startup script ...")

            self.runInit()

            updatepolicy = self._get_preference(ALBootConfig.UPDATEPOLICY)

            inWizard = False
            page = self._get_preference(("com.aldebaran.robotwebpage", "CurrentPage"))
            if not page or (page.startswith("wizard") and not page.startswith("wizardupdate")):
                inWizard = True

            # Do we launch interactive mode?
            # The rules:
            #     1) When the robot boots, we may or may not show the interactive mode depending on the preferences
            #     2) If NaoQi crashed and restarts, don't show the interactive mode
            #     3) If the behavior has been launched manually (for example by choregraphe, bu runBehavior or switchFocus...),
            #        always show interactive mode
            #     4) If the robot is rebooting after an update, it starts by update applications and finish by launch robotsgate

            # case 4)
            state = self._get_state()
            if state == ALBootConfig.WIZARDSTATE_SYSTEM_UPDATING or state == ALBootConfig.WIZARDSTATE_SYSTEM_UPDATED:
                self.logger.info("Robot system udapted detected, finish by update applications")
                self._finishUpdate()
                return

            elif state == ALBootConfig.WIZARDSTATE_SYSTEM_UPDATING_WITH_OTA:
                self.logger.info("Finishing update with tablet update")
                self.run_interactive_config()
                return

            # case 3)
            elif not self.firstLaunch:
                # The behavior seems to have been manually triggered and not launched during boot.
                self.logger.info("Boot policy: This isn't naoqi-boot's launch (probably launched by runBehavioh or swithFocus), running interactive config.")
                self.run_interactive_config()
                return

            # case 2) set by command-line parameter during auto-reboot
            elif self._check_almemory("naoqi/crashrecovery"):
                if inWizard:
                    self.logger.info("naoqi reboot after crash, recover Wizard where it was.")
                    self.run_interactive_config()
                else:
                    self.logger.info("naoqi reboot after crash, don't run interactive config.")
                    self.finish()
                return

            # case 1) - check preferences
            elif self._get_preference(ALBootConfig.AUTOSTARTINTERACTIVECONFIG) != ALBootConfig.AUTOSTARTINTERACTIVECONFIG_NO:
                self.logger.info("Boot policy: always run interactive config.")
                self.run_interactive_config()
                return

            elif (updatepolicy == ALBootConfig.UPDATEPOLICY_INTERACTIVE or updatepolicy == ALBootConfig.UPDATEPOLICY_COMPULSORY) and self._is_update_needed():
                self.logger.info("Boot policy: running interactive config because updates are needed.")
                self.run_interactive_config()
                return

            elif inWizard:
                self.logger.info("Wizard seems to be not finished, start interactive config")
                self.run_interactive_config()
                return

            else:
                self.logger.info("Nothing to do in boot config, exit ....")
                self.finish()

        except Exception as e:
            self.logger.error("Unexpected exception, aborting: %s" % traceback.format_exc())
            self.finish()

    @qi.nobind
    def run_interactive_config(self):
        try:
            modality = self._get_preference(ALBootConfig.CONFIGMODALITY)
            self.logger.info("Config modality: %s " % modality)
            if modality == ALBootConfig.CONFIGMODALITY_OFF:
                self.logger.info("No interactive config, exiting.")
                self.finish()
            else:
                if (modality == ALBootConfig.CONFIGMODALITY_TABLETONLY):
                    if self.altabletservice:
                        self.logger.info("Switching to tablet config")
                        self.run_tablet_config()
                    else:
                        self.logger.info("Boot-config is in tablet mode, but tablet is not found, exiting ....")
                        self.finish()
                else:
                    self.logger.info("Switching to dialog config, but it's not supported yet .... so finish !")
                    self.finish()

        except Exception as e:
            self.logger.error("Unexpected exception in interactive, aborting: %s" % e)
            self.finish()

    @qi.nobind
    def _launchBootConfigApk(self):
        self.logger.info("Launching boot config Apk")
        try:
            self.altabletservice._setAutoDateTimeEnabled(False)
        except Exception as e:
            self.logger.error("Error while disabling tablet date time automatic synchronization: %s" % e)

        try:
            success = self.altabletservice._launchApk(self.QML_BOOT_CONFIG_APK_NAME)
            self.apkStarted = success
            if not success:
                self.logger.error("Error while launching boot config")
                self.finish()
            else:
                try:
                    self.altabletservice.hideWebview(_async=True)
                except Exception as e:
                    self.logger.info("Error while hidding webview: %s" % e)
        except Exception as e:
            self.logger.error("Error while launching boot config: %s" % e)
            self.finish()

    @qi.nobind
    def _finishUpdate(self):
        self.logger.info("Finish update ... ")

        if self.albehaviormanager:
            try:
                self.albehaviormanager.stopBehavior("boot-config/animations/networkLoop", _async=True)
            except Exception as e:
                self.logger.info("Error stopping animation: %s" % e)

        if self.almotion:
          self.almotion.wakeUp()

        if self.altabletservice:
            self._launchBootConfigApk()
        elif not self._isBCApkRunning():
            self.logger.error("Could not launch BootConfig Apk (ALTabletService missing)")
            self.finish()

    @qi.nobind
    def startLaunchingAnim(self):
        try:
            self.almotion.setBreathEnabled("Body", False)
            self.alautonomousmove.setBackgroundStrategy("none")
        except Exception as e:
            self.logger.error("%s" % e)

        if not self.movement_deactivated:
            try:
                self.almotion.wakeUp()
                self.almotion.setBreathEnabled("Arms", False)
                self.albehaviormanager.runBehavior("boot-config/animations/poseInitUp")
                if not self._isBCApkRunning():
                    future = qi.async(lambda: self.albehaviormanager.startBehavior("boot-config/animations/turnTabletOn_start"))
                    self.launchinAnimFuture = future
                else:
                    self.almotion.setBreathEnabled("Arms", True)
            except Exception as e:
                self.logger.error("Error while waking up: %s" % e)

    def stopLaunchingAnim(self):
        if getattr(self, "launchinAnimFuture" , None):
            if self.launchinAnimFuture.isRunning():
                self.launchinAnimFuture.cancel()

            try:
                self.albehaviormanager.stopBehavior("boot-config/animations/turnTabletOn_start")
                self.albehaviormanager.runBehavior("boot-config/animations/turnTabletOn_end")
                self.almotion.setBreathEnabled("Arms", True)
            except Exception as e:
                self.logger.error("Error while stopping animation: %s" % e)

    @qi.nobind
    def run_tablet_config(self):
        self.logger.info("Launching boot config")
        if self.albehaviormanager:
            try:
                self.albehaviormanager.stopBehavior("boot-config/animations/networkLoop", _async=True)
            except Exception as e:
                self.logger.info("Error stopping animation: %s" % e)
        self.startLaunchingAnim()
        self._launchBootConfigApk()

    @qi.nobind
    def _preload_dialog(self):
        """ Preload the dialog before start life """
        self.logger.info("Preloading dialog...")
        try:
          dialog = self.session.service("ALDialog")
          dialog._preloadMain()
        except Exception as e:
            self.logger.error("Error during preloading the dialog : %s" % e)

    def finish(self):
        """ Quit boot-config after preloading the Life """

        if (self._get_preference(self.WIZARDSTATE) != self.WIZARDSTATE_SYSTEM_UPDATING):
            if (self._get_preference(self.DISABLELIFEANDDIALOG) == "1"):
                self.logger.info("The life is disabled.")
            else:
                self._preload_dialog()

        self._stop_working_feedback()
        self._exit()

    def onBehaviorStopped(self, future):
        if future.hasError():
            self.logger.error("Error while stopping boot-config behavior : %s" % future.error())

    def onApkStopped(self, future):
         if future.hasError():
             self.logger.error("while stopping boot-config apk : %s" % future.error())

    @qi.nobind
    def _exit(self):
        self.logger.info("Stop boot config")

        if self.finishing:
            return

        self.finishing = True

        if (self._get_preference(self.WIZARDSTATE) != self.WIZARDSTATE_SYSTEM_UPDATING) and not self.aboutToReboot:
            if self.alautonomouslife:
                try:
                    self.alautonomouslife._forbidStopCommands(False, _async=True) # reactivate the stop app
                except Exception as e:
                    self.logger.error("Error during enable of stop commands: %s" % e)

            if self.altabletservice:
                try:
                    self.altabletservice._stopApk(self.QML_BOOT_CONFIG_APK_NAME, _async=True).then(self.onApkStopped)
                except Exception as e:
                    self.logger.error("Error while stopping boot config: %s" % e)
                try:
                    self.altabletservice._setAutoDateTimeEnabled(True, _async=True)
                except Exception as e:
                    self.logger.info("Error while disabling tablet date time automatic synchronization: %s" % e)
                try:
                    self.altabletservice.hideWebview(_async=True)
                except Exception as e:
                    self.logger.info("Error while hidding webview: %s" % e)

        self._update_tablet_if_needed(False)
        if self.albehaviormanager:
            try:
                self.albehaviormanager.stopBehavior("boot-config/.", _async=True).then(self.onBehaviorStopped)
            except Exception as e:
                    self.logger.error("Error while stopping boot-config behavior: %s" % e)

if __name__ == "__main__":
    # get & start application
    application = qi.Application(sys.argv)
    application.start()

    alboot = ALBootConfig(application.session)
    application.session.registerService("ALBootConfig", alboot)

    # block until the session die and/or application.stop() is called
    application.run()

    alboot._exit()

