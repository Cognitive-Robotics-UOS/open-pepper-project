# -*- coding: utf-8 -*-
"""
Created on Fri Feb 12 16:27:42 2016

@author: ekroeger
"""

import stk.runner

if __name__ == "__main__":
    qiapp = stk.runner.init()
    #qiapp.session.service("ALAutonomousLife").setState("disabled")
    tablet = qiapp.session.service("ALTabletService")
    tablet.resetTablet()
    tablet.showWebview("http://10.0.132.30:8081/app/html/?robot=198.18.0.1&from=40&to=60")