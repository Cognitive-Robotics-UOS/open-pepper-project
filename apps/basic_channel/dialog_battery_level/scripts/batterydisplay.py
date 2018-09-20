"""
A NAOqi service to help display the battery level on the tablet.
"""

__version__ = "0.0.4"

__copyright__ = "Copyright 2015, Aldebaran Robotics"
__author__ = 'ekroeger'
__email__ = 'ekroeger@aldebaran.com'

import qi

import stk.runner
import stk.events
import stk.services
import stk.logging

import topicdisplay

BATTERY_LEVEL_KEY = "Device/SubDeviceList/Battery/Charge/Sensor/Value"
BATTERY_CHARGING_KEY = "BatteryChargingFlagChanged"

class ALBatteryDisplay(object):
    "Helper NAOqi service, intended to be called from dialog."
    APP_ID = "com.aldebaran.ALBatteryDisplay"
    TOPIC = "dlg_battery_level"
    def __init__(self, qiapp):
        self.logger = stk.logging.get_logger(qiapp.session, self.APP_ID)
        self.events = stk.events.EventHelper(qiapp.session)
        self.display = topicdisplay.TopicDisplay(qiapp.session, self.TOPIC)

    @qi.bind(returnType=qi.Void, paramsType=[])
    def hide(self):
        "Hides the tablet."
        self.logger.info("Hiding.")
        self.display.hide()

    @qi.bind(returnType=qi.Void, paramsType=[])
    def show(self):
        "Shows battery level on tablet, for 10 seconds."
        level = int(100 * self.events.get(BATTERY_LEVEL_KEY))
        charging = int(self.events.get(BATTERY_CHARGING_KEY))
        url = "apps/dialog_battery_level/?level={}&charging={}"\
              .format(level, charging)
        if self.display.show(url):
            # And hide the tablet in 10 seconds.
            self.display.hide_in(10)
            self.logger.info("Succesfully showed. level={}".format(level))
        else:
            self.logger.info("Failed to show.")


####################
# Setup and Run
####################

if __name__ == "__main__":
    stk.runner.run_service(ALBatteryDisplay)
