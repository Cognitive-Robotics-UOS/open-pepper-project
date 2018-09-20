import time
import sys
import qi
import subprocess
import threading


class ALGoToSleepALD():
    APP_ID = "com.aldebaran.ALGoToSleepALD"
    def __init__(self,app):
       
        self.qiapp = app
        self.session = app.session
        self.session.waitForService('ALMemory')
        self.session.waitForService('ALAutonomousLife')
        self.session.waitForService('ALDialog')
  
        self.memory = self.session.service('ALMemory')
        self.life = self.session.service('ALAutonomousLife')
        self.light = self.session.service('ALDarknessDetection')
        self.audio = self.session.service('ALAudioPlayer')
        self.tablet = self.session.service('ALTabletService')
        self.dialog = self.session.service('ALDialog')
        
        self.loop_task = qi.PeriodicTask()
        self.loop_task.setCallback(self.check_if_can_sleep)
        self.loop_task.setUsPeriod(long(1 *1000 *1000))

        self.previousDarkness = 0
        self.sleep_count = 0

        self.memory.subscribeToEvent("go_to_sleep", "ALGoToSleepALD", "check_start_sleep")
        self.memory.subscribeToEvent("go_to_sleep_now", "ALGoToSleepALD", "sleep_mode")

        #put initialization code here
        pass

    def check_start_sleep(self, key, value, message):
        self.light.subscribe("Light")
        self.light.updatePeriod("Light", 200) #ms faster update
        self.sleep_count = 0
        self.loop_task.start(True)        


    def check_if_can_sleep(self):
        Darkness = self.memory.getData("DarknessDetection/DarknessValue")
        print"Darkness:",Darkness
        print"self.previousDarkness:",self.previousDarkness

        #calculate the difference of the darkness, if the darkness is >= 50 so we deduce that the light was turning off and let the robot sleep.
        if(int(Darkness) - self.previousDarkness  >= 50):
            self.loop_task.stop()
            self.sleep_mode()

        #if the darkness doesn't change, we wait 10 sec and then let the robot sleep.
        elif(int(Darkness)< 90):
            self.sleep_count = self.sleep_count + 1
            if(self.sleep_count == 10):
                self.loop_task.stop()
                self.sleep_mode()


        self.previousDarkness = int(Darkness)


    def sleep_mode(self):
        current_language = self.dialog.getLanguage()
        if (current_language == "Japanese"):
            self.tablet.showImage("http://198.18.0.1/apps/dialog_goodbye/sleep_mode_tablet_jpj.jpg")
        elif (current_language == "French"):
            self.tablet.showImage("http://198.18.0.1/apps/dialog_goodbye/sleep_mode_tablet_frf.jpg")
        elif (current_language == "English"):
            self.tablet.showImage("http://198.18.0.1/apps/dialog_goodbye/sleep_mode_tablet_enu.jpg")
        else:
            self.tablet.showImage("http://198.18.0.1/apps/dialog_goodbye/sleep_mode_tablet_enu.jpg")
        
        time.sleep(5)
        self.life._sleep()

def main():
    # Create and Start the Application
    app = qi.ApplicationSession()
    app.start()
    # Get the Session
    session = app.session
    # Create the ALGenerateKnowledge Service
    ps = ALGoToSleepALD(app)
    # Register It
    session.registerService("ALGoToSleepALD", ps)
    # Run the Application
    app.run()

if __name__ == "__main__":
    main()


