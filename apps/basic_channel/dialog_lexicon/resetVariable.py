import qi

class resetVariable():
    APP_ID="com.aldebaran.setVariable"
    def __init__(self, app):
        self.qiapp= app
        self.session = app.session
        self.session.waitForService('ALMemory')
        self.memory=self.session.service('ALMemory')
        
        
    def resetVariable(self, variable):
        self.memory.insertData(variable, None)
        
        
def main():
    #create and start the application
    app = qi.Application()
    app.start()
    
    
    #create the ALuserDistanceToRobot
    gcp = resetVariable(app)
    
    #register service
    app.session.registerService("resetVariable", gcp)
    
    #run the application
    app.run()
        
if __name__ == "__main__":
    main()
