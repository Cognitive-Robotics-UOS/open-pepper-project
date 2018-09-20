import simple_encryption
import random
import qi
import sys
import time

import vision_definitions


class ALQRCodeWifiConfigurator:

    # QRCODE READER
    QRCODEREADER_RESOLUTION = 2
    QRCODEREADER_FPS = 1

    STATUS_READY = "Ready"
    STATUS_WAITINGFORQRCODE = "WaitingForQRCode"
    STATUS_QRCODEDETECTED = "QRCodeDetected"
    STATUS_CONNECTING = "Connecting"
    STATUS_CONNECTED = "Connected"
    STATUS_ERROR = "Error"

    def __init__(self, session):
        """ Helper to configure the network from a QRCode

            Properties:
                status : the current status of the module. Can be
                        Ready : the module is initialized.
                        WaitingForQRCode : The module is scanning for a QRCode.
                        QRCodeDetected : The module has detected a QRCode.
                        Connecting : The module is trying to connect to the network.
                        Connected : The network is connected.
                        Error : Something goes wrong.
        """
        self.session = session

        #logger
        self.logger = qi.logging.Logger("naoqi.core.ALQRCodeWifiConfigurator")
        self.module = qi.module("qicore")
        self.logManager = self.session.service("LogManager")
        self.provider = self.module.createObject("LogProvider", self.logManager)
        self.providerId = self.logManager.addProvider(self.provider)

        # init variables
        self.connectingToHiddenNetwork = False  # Setup wifi variable
        self.waitingForConnection = False
        self.cnonce = random.randint(1000, 9999)  # TODO: figure out if we want to use Head Id or what; for now Nonce is used nowhere in the process
        self.attemptedHiddenNetworks = None
        self.hiddenNetworkFailureReasons = None
        self.cam = 0
        self.status = qi.Signal("(s)")

        self.albarcodereader = self._get_service("ALBarcodeReader")
        if self.albarcodereader is None:
            self.logger.error("ALBarcodeReader is not available")
            return

        self.alconnectionmanager = self._get_service("ALConnectionManager")
        if self.alconnectionmanager is None:
            self.logger.error("ALConnectionManager is not available")
            return

        self.alvideodevice = self._get_service("ALVideoDevice")
        if self.alvideodevice is None:
            self.logger.error("ALVideoDevice is not available")
            return

        self.almemory = self._get_service("ALMemory")
        self.alaudioplayer = self._get_service("ALAudioPlayer")

        self.status(ALQRCodeWifiConfigurator.STATUS_READY)

    def __del__(self):
        """ cleaner """
        self._unsubscribeToQRCodeReader()

    #
    # Helpers
    #
    @qi.nobind
    def _get_service(self, serviceName):
        try:
            return self.session.service(serviceName)
        except Exception as e:
            self.logger.error("Error during getting the service %s : %s " % (serviceName, e))
            return None

    @qi.nobind
    def getExposureForQrCode(self, adaptedExposure):
        param_range = self.alvideodevice.getParameterRange(0, vision_definitions.kCameraExposureID)
        low = param_range[0]
        high = param_range[1]
        camera_model = self.alvideodevice.getCameraModel(0)
        if camera_model == vision_definitions.kMT9M114:
            exposure_for_phone = 80
        elif camera_model == vision_definitions.kOV5640:
            exposure_for_phone = 312
        else:
            exposure_for_phone = adaptedExposure
        delta = adaptedExposure - exposure_for_phone
        if delta <= 0:
            return exposure_for_phone
        else:
            return exposure_for_phone + int(delta/2)

    @qi.nobind
    def _configureVideoDevice(self):
        if not self.alvideodevice.getParameter(self.cam, vision_definitions.kCameraAutoExpositionID):
            return

        adaptedExposure = self.alvideodevice.getParameter(self.cam, vision_definitions.kCameraExposureID)
        exposure = self.getExposureForQrCode(adaptedExposure)
        self.logger.info("Turning auto-exposure off, exposure = %s" % exposure)
        self.alvideodevice.setParameter(self.cam, vision_definitions.kCameraAutoExpositionID, False)
        self.alvideodevice.setParameter(self.cam, vision_definitions.kCameraExposureID, exposure)  # This is causing an error:

    @qi.nobind
    def _restoreVideoDevice(self):
        self.logger.info("Restore video params: autoexposure on")
        self.alvideodevice.setParameter(self.cam, vision_definitions.kCameraAutoExpositionID, True)

    #
    # QRCode Network
    #
    def waitForQrCode(self):
        """ Subscribe to ALBarcodeReader and scan for a QRCode.
            Once a QRCode is detected, the connection to the network will start
        """
        self.logger.info("Subscribe to QRCode reader with a resolution %s" % ALQRCodeWifiConfigurator.QRCODEREADER_RESOLUTION)

        #self._configureVideoDevice()

        res = self.albarcodereader.setResolution(ALQRCodeWifiConfigurator.QRCODEREADER_RESOLUTION)

        self.albarcodereader.subscribe(self.__class__.__name__, ALQRCodeWifiConfigurator.QRCODEREADER_FPS*1000, 0)
        self.onQRCodeDetectedEvent = self.almemory.subscriber("BarcodeReader/BarcodeDetected")
        self.onQRCodeDetectedEventId = self.onQRCodeDetectedEvent.signal.connect(self._onQRCodeDetected)

        self.status(ALQRCodeWifiConfigurator.STATUS_WAITINGFORQRCODE)

    @qi.nobind
    def _playSound(self, filename):
        path = ""
        try:
            path = qi.path.findData("naoqi/wav", filename, True);
            self.alaudioplayer.playFile(path)
        except Exception as e:
            self.logger.error("Error while playing sound ({0}): {1}".format(path, repr(e)))

    @qi.nobind
    def _onQRCodeDetected(self, value):

        self.logger.info("QRCode detected : %s" % value)

        self._unsubscribeToQRCodeReader()

        try:
            barcodestr = value[0][0]
            decrypted = simple_encryption.decrypt(barcodestr, self.cnonce)
            if decrypted.count(';') >= 2:
                self.logger.info("QR code received, processing...")
                self.status(ALQRCodeWifiConfigurator.STATUS_QRCODEDETECTED)
                self._playSound("end_reco.wav")
                self._setup_wifi(decrypted)
            else:
                self.almemory.raiseEvent("BootConfig/QrState", "Error")
                self.status(ALQRCodeWifiConfigurator.STATUS_ERROR)
                self.logger.info("Invalid QR code, please show again; nonce = %i" % self.cnonce)
                self._playSound("bip_gentle.wav")

        except Exception as e:
            self.almemory.raiseEvent("BootConfig/QrState", "Error")
            self.status(ALQRCodeWifiConfigurator.STATUS_ERROR)
            self._playSound("bip_gentle.wav")
            self.logger.error("Unexpected QR code: (%s), please show again; nonce = %i" % (repr(value), self.cnonce))

    @qi.nobind
    def _unsubscribeToQRCodeReader(self):
        self.logger.info("Unsubscribe to QRCode reader")

        try:
            self.albarcodereader.unsubscribe(self.__class__.__name__)
        except Exception as e:
            self.logger.info("Error during unsubscribe to ALBarcodeReader")

        if self.onQRCodeDetectedEventId is not None:
            self.onQRCodeDetectedEvent.signal.disconnect(self.onQRCodeDetectedEventId)
            self.onQRCodeDetectedEventId = None

        #self._restoreVideoDevice()

    @qi.nobind
    def _setup_wifi(self, QRString):
        if not self.alconnectionmanager:
            self.logger.error("No ALConnectionManager, unable to setup the wifi")
            return

        self.attemptedHiddenNetworks = []  # Reset list of hidden networks.
        self.hiddenNetworkFailureReasons = []

        params = QRString.split(';', 3)
        if len(params) == 3:
            self.connection_step1(*params)
        else:
            self.almemory.raiseEvent("BootConfig/QrState", "Error")
            self.status(ALQRCodeWifiConfigurator.STATUS_ERROR)
            self.logger.error("QRCode incorrect format: " + repr(QRString))

    @qi.nobind
    def connection_step1(self, format, name, passphrase):
        self.wanted_name = name
        self.passphrase = passphrase
        self.logger.info("[1-1] Scanning network...")

        self.almemory.raiseEvent("BootConfig/QrState", "Connecting")
        self.status(ALQRCodeWifiConfigurator.STATUS_CONNECTING)

        if not self._scan():
            self.almemory.raiseEvent("BootConfig/QrState", "Error")
            self.status(ALQRCodeWifiConfigurator.STATUS_ERROR)
            return

        self.logger.info("[1-2] Scanned, Looking for service called %s ..." % name)

        self.onNetworkServiceInputRequiredEvent = self.almemory.subscriber("NetworkServiceInputRequired")
        self.onNetworkServiceInputRequiredEventId = self.onNetworkServiceInputRequiredEvent.signal.connect(self.connection_step2)

        self.onNetworkStateChangedEvent = self.almemory.subscriber("NetworkConnectStatus")
        self.onNetworkStateChangedEventId = self.onNetworkStateChangedEvent.signal.connect(self._handleNetworkStateChanged)

        serviceId, dic = self._find_service_by_name(name)
        if serviceId:
            self.connectingToHiddenNetwork = False
            state = dic["State"]
            if state in ("online", "ready"):
                self.logger.info("[1-3a] Found service (%s), but already connected..." % state)
                self.almemory.raiseEvent("BootConfig/QrState", "Connected")
                self.status(ALQRCodeWifiConfigurator.STATUS_CONNECTED)
                return

            self.logger.info("[1-3a] Found service (%s), connecting..." % state)
            self.wanted_serviceId = serviceId
            if self._connect(dic["ServiceId"]):
                self.security = dic["Security"]
            else:
                self.almemory.raiseEvent("BootConfig/QrState", "Error")
                self.status(ALQRCodeWifiConfigurator.STATUS_ERROR)
        else:
            self.connectingToHiddenNetwork = True
            self.logger.info("[1-3b] Couldn't find network called %s, trying hidden networks" % name)
            self.connect_to_next_hidden_network(None)

    @qi.nobind
    def _iter_servicedics(self):
        try:
            for service in self.alconnectionmanager.services():
                yield dict(service)
        except Exception as e:
            self.logger.error("Unexpected exception ALConnectionManager.services(): %s" % str(e))

    @qi.nobind
    def iter_servicedics_by_name(self, name):
        for dic in self._iter_servicedics():
            servicename = dic.get("Name", "")
            if servicename.lower() == name:
                yield dic

    @qi.nobind
    def find_service_by_id(self, wanted_id):
        for dic in self._iter_servicedics():
            if dic["ServiceId"] == wanted_id:
                return dic["Name"], dic
        self.logger.info("Could not find service with ID: " + repr(wanted_id))
        return None, {}

    @qi.nobind
    def find_next_hidden_network(self):
        for dic in self.iter_servicedics_by_name(""):
            serviceId = dic["ServiceId"]
            if serviceId not in self.attemptedHiddenNetworks:
                self.attemptedHiddenNetworks.append(serviceId)
                return dic
        return None

    @qi.nobind
    def connect_to_next_hidden_network(self, reason_prev_failed):
        if reason_prev_failed:
            self.hiddenNetworkFailureReasons.append(reason_prev_failed)

        dic = self.find_next_hidden_network()
        if dic and (dic["State"] != "ready"):
            serviceId = dic["ServiceId"]
            self.logger.info("[1.5] Trying a hidden network: %s" % serviceId)
            self.wanted_serviceId = serviceId

            if self._connect(serviceId):
                self.security = dic["Security"]
                #self.almemory.raiseEvent("BootConfig/QrState", "Connecting")
                #self.status(ALQRCodeWifiConfigurator.STATUS_CONNECTING)
            else:
                self.connect_to_next_hidden_network("Error in ALConnectionManager.connect()")

        else:
            self.logger.info("[1.5] No more hidden networks.")
            self.passphrase = None
            self.connectingToHiddenNetwork = False
            self.almemory.raiseEvent("BootConfig/QrState", "Error")
            self.status(ALQRCodeWifiConfigurator.STATUS_ERROR)
            explanation = "No visible network called %s, and " % self.wanted_name
            if self.hiddenNetworkFailureReasons:
                num_hidden = len(self.attemptedHiddenNetworks)
                if num_hidden == 1:
                    explanation += "connection to the only hidden network failed: %s" % str(reason_prev_failed)
                else:
                    explanation += "failed to connect to any of %i hidden networks: " % num_hidden
                    for k, reason in enumerate(self.hiddenNetworkFailureReasons):
                        explanation += "(%i) %s " % (k+1, reason)
            else:
                explanation += "no hidden networks found."

            self.passphrase = None  # Forget the passphrase

    @qi.nobind
    def connection_step2(self, inputRequest):
        self.logger.info("[2-1] Received request for info")
        if self.passphrase is not None:  # "" is an acceptable passphrase!
            self.logger.info("[2-2] Sending connection info...")
            reply = []
            reqDic = dict(inputRequest)
            self.logger.info("Got input request: " + repr(inputRequest))

            if "ServiceId" in reqDic:
                reply.append(("ServiceId", self.wanted_serviceId))  # Will fail if it's not what I'm asking for
            if "Name" in reqDic:
                reply.append(("Name", self.wanted_name))

            assert "Passphrase" in reqDic, "Surprising request!"
            reply.append(("Passphrase", self.passphrase))
            try:
                self.alconnectionmanager.setServiceInput(reply)
                self.logger.info("[2-3] Sent connection info, waiting for answer.")

                if self.connectingToHiddenNetwork:
                    self.waitingForConnection = True
                    TIMEOUT_SECONDS = 20
                    time.sleep(TIMEOUT_SECONDS)  # Wait before trying the next hidden network
                    if self.waitingForConnection:
                        self.logger.info("[2-4a] %i second timeout, preparing for next hidden network." % TIMEOUT_SECONDS)
                        self._scan()
                        self.connect_to_next_hidden_network("Timeout(%is)" % TIMEOUT_SECONDS)
                    else:
                        self.logger.info("[2-4b] Connection progressing, ignoring timeout.")

            except RuntimeError as e:
                self.logger.info("[2-e] Got RuntimeError (two instances of the behavior running?) " + repr(e))
                self.connect_to_next_hidden_network("Runtime error during service input")

            except Exception as e:
                self.logger.info("[2-e] Unexpected exception " + repr(e))
                self.connect_to_next_hidden_network("Exception during service input")

        else:
            self.logger.info("[2-e] Received unexpected NetworkServiceInputRequired (no passphrase!)")

    @qi.nobind
    def _scan(self):
        try:
            self.alconnectionmanager.scan()
            return True
        except Exception as e:
            self.logger.error("Unexpected exception ALConnectionManager.scan(): %s" % e)
            return False

    @qi.nobind
    def _find_service_by_name(self, name):
        for dic in self.iter_servicedics_by_name(name.lower()):
            return dic["ServiceId"], dic
        return None, {}

    @qi.nobind
    def _connect(self, serviceId):
        try:
            self.alconnectionmanager.connect(serviceId)
            return True
        except Exception as e:
            self.logger.error("Unexpected exception ALConnectionManager.connect(%s): %s" % (str(serviceId), str(e)))
            return False

    @qi.nobind
    def _handleNetworkStateChanged(self, param):
        serviceId, connected, error = param
        name, dic = self.find_service_by_id(serviceId)

        if (serviceId == self.wanted_serviceId) or self.connectingToHiddenNetwork:

            connect_type = "requested" if (serviceId == self.wanted_serviceId) else "was hidden"
            self.logger.info("Service %s (%s) new state: %s" % (name, connect_type, connected))

            if self.waitingForConnection:
                self.logger.info("canceled timeout")
                self.waitingForConnection = False

            if connected:
                security = "open"
                if ("psk" in self.security) or ("wpa" in self.security):
                    security = "wpa"
                elif "wep" in self.security:
                    security = "wep"
                #self.altabletutils.configure_wifi(security, self.wanted_name, self.passphrase)
                self.almemory.raiseEvent("BootConfig/QrState", "Connected")
                self.status(ALQRCodeWifiConfigurator.STATUS_CONNECTED)
                self.passphrase = None  # Forget the passphrase

            else:
                error = dic.get("Error", "?!?!")  # error might be invalid-key, connect-failed
                if self.connectingToHiddenNetwork:
                    # try to connect to next tone (timeout was cancelled)
                    self.logger.info("Connection to hidden failed with Error: " + repr(error))
                    self._scan()
                    self.connect_to_next_hidden_network("Error: " + repr(error))
                else:
                    self.almemory.raiseEvent("BootConfig/QrState", "Error")
                    self.status(ALQRCodeWifiConfigurator.STATUS_ERROR)
                    self.passphrase = None  # Forget the passphrase
                    self.logger.info("Connection to visible network failed with Error: " + repr(error))
        else:
            self.logger.info("Service %s (other) new state: %s" % (name, connected))

if __name__ == "__main__":
    # get & start application
    application = qi.Application(sys.argv)
    application.start()

    try:
        application.session.service("ALQRCodeWifiConfigurator")
        print "Module already registered, unregister it ..."
        serviceDirectory = application.session.service("ServiceDirectory")
        serviceInfos = serviceDirectory.service("ALQRCodeWifiConfigurator")
        if serviceInfos:
            application.session.unregisterService(serviceInfos["serviceId"])
    except Exception as e:
        print "Error : %s" % e
        pass

    alqrcode = ALQRCodeWifiConfigurator(application.session)
    application.session.registerService("ALQRCodeWifiConfigurator", alqrcode)

    # block until the session die and/or application.stop() is called
    application.run()
