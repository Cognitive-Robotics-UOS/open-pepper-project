"""
A helper class for binding dialog topics to tablet pages..
"""

__version__ = "0.0.1"

__copyright__ = "Copyright 2016, Aldebaran Robotics"
__author__ = 'ekroeger'
__email__ = 'ekroeger@aldebaran.com'

import threading

import qi

import stk.events
import stk.services

ONE_SECOND = 1000000 # in microseconds, for qi.async

FOCUS_PREFIX = "ALDialog/TopicDisplay/Focused/"

class TopicDisplay(object):
    "A generic helper for showing a tablet page during a dialog topic."
    def __init__(self, session, topic):
        # Internal variables
        self.tablet_lock = threading.Lock()
        self.hide_tablet_future = None
        self.s = stk.services.ServiceCache(session)
        self.events = stk.events.EventHelper(session)
        self.topic = topic
        self.showing = False

    def show(self, url):
        "Shows the url, and disabled the applauncher trigger."
        with self.tablet_lock:
            self.events.set(FOCUS_PREFIX + self.topic, 1)
            self.showing = True
        if not self.s.ALTabletService.showWebview("http://198.18.0.1/" + url):
            return False
        self.s._ALAutonomousTablet.setEnabled(False)
        self.events.connect_decorators(self)
        return True

    def hide_in(self, delay_s):
        "Hides the page in X seconds."
        with self.tablet_lock:
            if self.hide_tablet_future:
                self.hide_tablet_future.cancel()
            self.hide_tablet_future = qi.async(self.hide,
                                               delay=(delay_s*ONE_SECOND))

    def hide(self):
        "Hides the tablet, and re-enables the applauncher trigger."
        with self.tablet_lock:
            if not self.showing:
                return
            self.showing = False
            self.events.set(FOCUS_PREFIX + self.topic, 0)
            if self.hide_tablet_future:
                self.hide_tablet_future.cancel()
                self.hide_tablet_future = None
        self.s.ALTabletService.hideWebview()
        self.s._ALAutonomousTablet.setEnabled(True)

    @stk.events.on("Dialog/Focus")
    def on_focus_topic(self, topic):
        "Callback for when the topic changes"
        if topic != self.topic:
            self.events.clear() # disconnect this callback.
            if not self.events.get_int(FOCUS_PREFIX + topic):
                self.hide()
            # else, that's a topic that, like this one, shows stuff on the
            # tablet, so let's not hide it.
