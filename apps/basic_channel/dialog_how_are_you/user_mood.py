import qi

class user_mood():
    APP_ID="com.aldebaran.user_mood"
    def __init__(self, app):
        self.qiapp=app
        self.session=app.session
        self.session.waitForService('ALMemory')
        self.session.waitForService('ALMood')
        
        self.memory=self.session.service('ALMemory')
        
        self.memory.subscribeToEvent("MoodEvent/Mood", "user_mood", "user_mood")
        
    def user_mood(self):
        user_id=self.memory.getData("Dialog/ID")
        if user_id!=-1:
            user_mood=self.memory.getData("MoodEvent/Mood")
            self.memory.insertData("user_mood", user_mood)

        else:
            self.memory.insertData("user_mood", "unknown")        
        
def main():
    #create and start the application
    app = qi.Application()
    app.start()
    
    #create the ALuserDistanceToRobot
    gcp = user_mood(app)
    
    #register service
    app.session.registerService("user_mood", gcp)
    
    #run the application
    app.run()
        
if __name__ == "__main__":
    main()