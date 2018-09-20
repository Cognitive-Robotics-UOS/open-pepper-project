"""
A sample showing how to have a NAOqi service as a Python app.
"""

__version__ = "0.0.3"

__copyright__ = "Copyright 2015, Aldebaran Robotics"
__author__ = 'ekroeger'
__email__ = 'ekroeger@aldebaran.com'

import threading

import qi

import stk.runner
import stk.events
import stk.services
import stk.logging

import topicdisplay

VOLUME_STEP = 20 # must divide 100

@qi.multiThreaded()
class ALVolumeSlider(object):
    "Service for setting the volume visually."
    APP_ID = "com.aldebaran.ALVolumeSlider"
    TOPIC = "dlg_adjust_volume"
    def __init__(self, qiapp):
        # generic activity boilerplate
        self.events = stk.events.EventHelper(qiapp.session)
        self.s = stk.services.ServiceCache(qiapp.session)
        self.logger = stk.logging.get_logger(qiapp.session, self.APP_ID)
        self.display = topicdisplay.TopicDisplay(qiapp.session, self.TOPIC)
        # lock for speech
        self.speaking_lock = threading.Lock()
        self.speaking = False

    @qi.bind(returnType=qi.Void, paramsType=[qi.Int32, qi.Int32])
    def showTablet(self, fromval, toval):
        url = "apps/dialog_adjust_volume/?from={}&to={}"\
              .format(fromval, toval)
        self.display.show(url)

    @qi.bind(returnType=qi.Void, paramsType=[])
    def hideTablet(self):
        print "hiding"
        self.display.hide()

    @qi.bind(returnType=qi.Bool, paramsType=[])
    def increaseVolume(self):
        "Increase volume to next multiple of 20%."
        volume = self.s.ALAudioDevice.getOutputVolume() #integer 0-100
        if volume >= 100:
            # Already at max
            return False
        level = volume // VOLUME_STEP # integer 0-N
        new_volume = VOLUME_STEP * (level + 1) # always go to next level
        self.showTablet(volume, new_volume)
        self._setVolume(new_volume)
        return True

    @qi.bind(returnType=qi.Bool, paramsType=[])
    def decreaseVolume(self):
        "Decrease volume to next multiple of 20%."
        volume = self.s.ALAudioDevice.getOutputVolume() #integer 0-100
        if volume <= 20:
            # Already at min
            return False
        level = volume // VOLUME_STEP # integer 0-N
        if (VOLUME_STEP * level) == volume:
            # We're on an exact level - go to the one below.
            new_volume = VOLUME_STEP * (level - 1)
        else:
            # round to exact level.
            new_volume = VOLUME_STEP * level
        self.showTablet(volume, new_volume)
        self._setVolume(new_volume)
        return True

    @qi.nobind
    def _setVolume(self, volume):
        self.s.ALAudioDevice.setOutputVolume(volume)
        # (we might want a lock here)
        # reset timer
        self.display.hide_in(15)

    @qi.bind(returnType=qi.Void, paramsType=[qi.Float])
    def setVolume(self, volume):
        self._setVolume(volume)
        # Here we use a lock to make sure the feedback is only given once.
        with self.speaking_lock:
            if self.speaking:
                return
            self.speaking = True
        # Only one thread at a time can be here
        self.s.ALMemory.insertData("dialog_adjust_volume/currentVolume",volume)
        self.s.ALDialog.gotoTag("SAYVOLUME", "dlg_adjust_volume")
        with self.speaking_lock:
            self.speaking = False

        
####################
# Setup and Run
####################

if __name__ == "__main__":
    stk.runner.run_service(ALVolumeSlider)

