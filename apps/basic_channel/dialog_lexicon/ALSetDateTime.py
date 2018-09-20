import datetime
from datetime import date, time, datetime, timedelta
from dateutil.relativedelta import *
import qi

class ALSetDateTime():
    APP_ID = "com.aldebaran.ALSetDateTime"
    def __init__(self,app):

        self.qiapp = app
        self.session = app.session
        self.session.waitForService('ALMemory')
        self.session.waitForService('ALKnowledge')
        self.memory=self.session.service('ALMemory')
        self.learn=self.session.service('ALKnowledge')
        
#        self.currentDate=datetime.now()
        self.domain="com.aldebaran.learning"
        
#        self.memory.declareEvent("timeSetStatus")
#        #put initialization code here

#        self.memory.subscribeToEvent("set_date", "ALSetDateTime", "setDateTime")
#        self.memory.subscribeToEvent("ask_date", "ALSetDateTime", "askDateTime")
#        pass



    def getData(self, key):
        try:
            return self.memory.getData(key)
        except Exception:
            return None


            
            
            
    ###########################################################        
    ##CALCULATE THE DATE AND TIME ACCORDING TO USER'S REQUEST##        
    ###########################################################        

    def setDateTime(self):
        try:
            print "I've entered in setDateTime"
            self.memory.insertData("timeSetStatus","Started")
    
            #CHECK SPECIAL MINUTE, IF SPECIAL MINUTE EXIST, 
            #THEN SUBSTRACT 1 HOUR TO THE HOUR DATA#
            if self.getData("time_lexicon/special_min"):
                print "special minute has a value"
                true_hour=(int(self.getData("time_lexicon/hour")) - 1)%24
                self.memory.insertData("time_lexicon/hour", true_hour)
                true_minute=(int(self.getData("time_lexicon/special_min")))
                self.memory.insertData("time_lexicon/minute", true_minute)
    
            else:
                print "special minute was empty"
                pass
    
    
    
            #CHECK WEEK, IF WEEK EXIST, THEN CONVERT IT TO DAYS#
            if self.getData("time_lexicon/in_week"):
                print "in_week has a value"
                week_in_day = int(self.getData("time_lexicon/in_week"))*7
                requested_weekday_in_day = relativedelta(days=+week_in_day)
                print "requested_weekday_in_day", requested_weekday_in_day
    
            else:
                print "in_week was empty"
                requested_weekday_in_day = relativedelta(days=+0)
                pass
    
    
    
            #YEAR#
            if self.getData("time_lexicon/year"):
                print "year has a value"
                year=int(self.getData("time_lexicon/year"))
                requested_year = relativedelta(year=year)
    
            elif self.getData("time_lexicon/in_year"):
                print "in_year has a value"
                year_number = int(self.getData("time_lexicon/in_year"))
                requested_year= relativedelta(years=+year_number)
    
            else:
                print "year and in_year were empty"
                requested_year = relativedelta(years=0)
    
    
            #MONTH#
            if self.getData("time_lexicon/month"):
                print "month has a value"
                month=int(self.getData("time_lexicon/month"))
                requested_month = relativedelta(month=month)
    
            elif self.getData("time_lexicon/in_month"):
                print "in_month has a value"
                month_number = int(self.getData("time_lexicon/in_month"))
                requested_month = relativedelta(months=+month_number)
    
            else:
                print "month and in_month were empty"
                requested_month = relativedelta(months=0)
    
    
    
            #DAY#
            if self.getData("time_lexicon/day"):
                print "day has a value"
                day=int(self.getData("time_lexicon/day"))
                requested_day = relativedelta(day=day)
    
            elif self.getData("time_lexicon/in_day"):
                print "in_day has a value"
                day_number = int(self.getData("time_lexicon/in_day"))
                in_day = datetime.now() + relativedelta(days=+day_number)
                requested_day = relativedelta(days=+day_number)
    
            else:
                print "day and in_day were empty"
                requested_day = relativedelta(days=0)
    
    
            #HOUR#
            if self.getData("time_lexicon/hour"):
                print "hour has a value"
                hour= int(self.getData("time_lexicon/hour"))
                requested_hour = relativedelta(hour=hour)
    
            elif self.getData("time_lexicon/in_hour"):
                print "in_hour has a value"
                hour_number = int(self.getData("time_lexicon/in_hour"))
                requested_hour = relativedelta(hours=+hour_number)
    
            else:
                print "hour and in_hour were empty"
                requested_hour = relativedelta(hours=+0)
    
    
            #MINUTE#
            if self.getData("time_lexicon/minute"):
                print "minute has a value"
                minute=int(self.getData("time_lexicon/minute"))
                requested_minute = relativedelta(minute=minute)
    
            elif self.getData("time_lexicon/in_minute"):
                print "in_minute has a value"
                minute_number = int(self.getData("time_lexicon/in_minute"))
                requested_minute = relativedelta(minutes=+minute_number)
    
            else:
                print "minute and in_minute were empty"
                requested_minute = relativedelta(minutes=+0)
    
    
            #WEEKDAY#
            if self.getData("time_lexicon/weekday"):
                print "weekday has a value"
                today_weekday = datetime.now().weekday()
                weekday = int(self.getData("time_lexicon/weekday"))
                if(weekday==0):
                    weekday=MO
                    weekday_num=0
                elif(weekday==1):
                    weekday=TU
                    weekday_num=1
                elif(weekday==2):
                    weekday=WE
                    weekday_num=2
                elif(weekday==3):
                    weekday=TH
                    weekday_num=3
                elif(weekday==4):
                    weekday=FR
                    weekday_num=4
                elif(weekday==5):
                    weekday=SA
                    weekday_num=5
                elif(weekday==6):
                    weekday=SU
                    weekday_num=6
    
                if (today_weekday == self.getData("time_lexicon/weekday")) and (self.getData("time_lexicon/in_week")=="" or self.getData("time_lexicon/in_week")==None):
                    print "requested weekday is the same than today and in_week has no value"
                    requested_weekday_in_day = relativedelta(days=+1, weekday=weekday)
                    print "requested_weekday_in_day:", requested_weekday_in_day
    
    
                elif(today_weekday == self.getData("time_lexicon/weekday")) and (self.getData("time_lexicon/in_week")!="" or self.getData("time_lexicon/in_week")!=None):
                    print "requested weekday is the same than today and in_week has a value"
                    week_in_day = int(self.getData("time_lexicon/in_week"))*7
                    week_number = week_in_day - 7
                    requested_weekday_in_day = relativedelta(days=+1, weekday=weekday) + relativedelta(days=+week_number)
    
                    print "requested_weekday_in_day:", requested_weekday_in_day
    
                elif(weekday_num - today_weekday < 0) and (self.getData("time_lexicon/in_week")!=None or self.getData("time_lexicon/in_week")!=""):
                    print "requested weekday is not the same than today but it's posterior to today and in_week has a value"
                    requested_weekday_in_day = relativedelta(weekday=weekday)
    
                    print "requested_weekday_in_day:", requested_weekday_in_day
    
                #the requested weekday is not today's weekday and we want to set an in X week.
                elif(self.getData("time_lexicon/in_week")!=None or self.getData("time_lexicon/in_week")!=""):
                    print "requested weekday is not the same than today and in_week has a value"
                    in_week = int(self.getData("time_lexicon/in_week"))*7
                    requested_weekday_in_day = relativedelta(weekday=weekday) + relativedelta(days=+in_week)
    
                else:
                    print "requested weekday has a value and in_week has no value"
                    requested_weekday_in_day = relativedelta(weekday=self.getData("time_lexicon/weekdayUtil"))
                    print "requested_weekday_in_day:", requested_weekday_in_day
    
            else:
                print "weekday has no value"
                requested_month = requested_month
                requested_day = requested_day
    
    
            #SET REQUESTED DATE#
            requestedDate=datetime.now() + requested_weekday_in_day + requested_year + requested_month + requested_day + requested_hour + requested_minute
            requestedDate_str=str(requestedDate)
            
            year = requestedDate.year
            month = requestedDate.month
            day = requestedDate.day
            hour = requestedDate.hour
            minute = requestedDate.minute
            weekday = requestedDate.weekday()
    
            self.memory.insertData("time_lexicon/setYear", year)
            self.memory.insertData("time_lexicon/setMonth", month)
            self.memory.insertData("time_lexicon/setDay", day)
            self.memory.insertData("time_lexicon/setHour", hour)
            self.memory.insertData("time_lexicon/setMinute", minute)
            self.memory.insertData("time_lexicon/setWeekday", weekday)
    
            self.requestedDate = requestedDate
    
            print "requestedDate:", requestedDate
            print "requestedDate has now a value"
    
    
            #CHECK IF REQUESTED DATE IS TIMEDOUT#
            check_timeout=relativedelta(requestedDate, datetime.now())
            check_timeout_day=check_timeout.days
            check_timeout_hour=check_timeout.hours
            check_timeout_minute=check_timeout.minutes
    
            print "check_timeout_day :", check_timeout_day
            
            
            ########################################
            #user has setted a past date           #
            #I automaticaly adjust it to next year.#
            ########################################        
            
            
            if (check_timeout_day <= -1):
                print "requested time is older than today's. I'll set it for next year."
                newRequestedDate = self.requestedDate + relativedelta(years=+1)
                year = newRequestedDate.year
                month = newRequestedDate.month
                day = newRequestedDate.day
                hour = newRequestedDate.hour
                minute = newRequestedDate.minute
                weekday = newRequestedDate.weekday()
                self.memory.insertData("time_lexicon/setYear", year)
                self.memory.insertData("time_lexicon/setMonth", month)
                self.memory.insertData("time_lexicon/setDay", day)
                self.memory.insertData("time_lexicon/setHour", hour)
                self.memory.insertData("time_lexicon/setMinute", minute)
                self.memory.insertData("time_lexicon/setWeekday", weekday)
    
                newRequestedDateIso=newRequestedDate.isoformat()
                self.memory.insertData("requestedDateISO",newRequestedDateIso)
                self.memory.insertData("requestedDate", str(newRequestedDate))
#                self.memory.raiseEvent("timeSetStatus","done")
    

            #############################################
            #user has asked or setted for a past TIME   # 
            #I will automatically adjust it for next day#
            #############################################
            
            elif (check_timeout_day==0 and check_timeout_hour<-1 or check_timeout_minute<-1):
                print "set time is anterior to now, I set it for tomorrow."
                newRequestedDate = self.requestedDate + relativedelta(days=+1)
                year = newRequestedDate.year
                month = newRequestedDate.month
                day = newRequestedDate.day
                hour = newRequestedDate.hour
                minute = newRequestedDate.minute
                weekday = newRequestedDate.weekday()
                self.memory.insertData("time_lexicon/setYear", year)
                self.memory.insertData("time_lexicon/setMonth", month)
                self.memory.insertData("time_lexicon/setDay", day)
                self.memory.insertData("time_lexicon/setHour", hour)
                self.memory.insertData("time_lexicon/setMinute", minute)
                self.memory.insertData("time_lexicon/setWeekday", weekday)
    
                newRequestedDateIso=newRequestedDate.isoformat()
                self.memory.insertData("requestedDateISO",str(newRequestedDateIso))
                self.memory.insertData("requestedDate", str(newRequestedDate))
#                self.memory.raiseEvent("timeSetStatus","done")
    
   
                
            #######################################    
            #user asked for a date that is coming.#
            #######################################
            else:
                print "I set the final date"
                requestedDateIso=requestedDate.isoformat()
                self.memory.insertData("requestedDateISO",str(requestedDateIso))
                self.memory.insertData("requestedDate", requestedDate_str)
#                self.memory.raiseEvent("timeSetStatus","done")
                print "I've setted the final date"
                
    
            return True
    
        except:
            print "error in ALSetDateTime. Couldn't convert human input to datetime."
            return False
    



##############################################
##############################################
###CACULATE THE DATE AND TIME#################
###ACCORDING TO WHAT USER ASK#################
##############################################
##############################################


    def askDateTime(self, key, value, message):
        print "I've entered in askDateTime"


        #CHECK SPECIAL MINUTE, IF SPECIAL MINUTE EXIST, THEN SUBSTRACT 1 HOUR TO THE HOUR DATA#
        if self.getData("time_lexicon/special_min"):
            print "special minute has a value"
            true_hour=(int(self.getData("time_lexicon/hour")) - 1)%24
            true_minute=(int(self.getData("time_lexicon/special_min")))
            self.memory.insertData("time_lexicon/hour", true_hour)
            self.memory.insertData("time_lexicon/minute", true_minute)

        else:
            print "special minute was empty"
            pass



        #CHECK WEEK, IF WEEK EXIST, THEN CONVERT IT TO DAYS#
        if self.getData("time_lexicon/in_week"):
            print "in_week has a value"
            week_in_day = int(self.getData("time_lexicon/in_week"))*7
            asked_weekday_in_day = relativedelta(days=+week_in_day)
            print "requested_weekday_in_day", requested_weekday_in_day

        else:
            print "in_week was empty"
            asked_weekday_in_day = relativedelta(days=+0)
            pass



        #YEAR#
        if self.getData("time_lexicon/year"):
            print "year has a value"
            year=int(self.getData("time_lexicon/year"))
            asked_year = relativedelta(year=year)

        elif self.getData("time_lexicon/in_year"):
            print "in_year has a value"
            year_number = int(self.getData("time_lexicon/in_year"))
            asked_year= relativedelta(years=+year_number)

        else:
            print "year and in_year were empty"
            asked_year = relativedelta(year=0)


        #MONTH#
        if self.getData("time_lexicon/month"):
            print "month has a value"
            month=int(self.getData("time_lexicon/month"))
            asked_month = relativedelta(month=month)

        elif self.getData("time_lexicon/in_month"):
            print "in_month has a value"
            month_number = int(self.getData("time_lexicon/in_month"))
            asked_month = relativedelta(months=+month_number)

        else:
            print "month and in_month were empty"
            asked_month = relativedelta(month=0)



        #DAY#
        if self.getData("time_lexicon/day"):
            print "day has a value"
            day=int(self.getData("time_lexicon/day"))
            asked_day = relativedelta(day=day)

        elif self.getData("time_lexicon/in_day"):
            print "in_day has a value"
            day_number = int(self.getData("time_lexicon/in_day"))
            in_day = datetime.now() + relativedelta(days=+day_number)
            asked_day = relativedelta(days=+day_number)

        else:
            print "day and in_day were empty"
            asked_day = relativedelta(day=0)


        #HOUR#
        if self.getData("time_lexicon/hour"):
            print "hour has a value"
            hour= int(self.getData("time_lexicon/hour"))
            asked_hour = relativedelta(hours=hour)

        elif self.getData("time_lexicon/in_hour"):
            print "in_hour has a value"
            hour_number = int(self.getData("time_lexicon/in_hour"))
            asked_hour = relativedelta(hours=+hour_number)

        else:
            print "hour and in_hour were empty"
            asked_hour = relativedelta(hours=0)


        #MINUTE#
        if self.getData("time_lexicon/minute"):
            print "minute has a value"
            minute=int(self.getData("time_lexicon/minute"))
            asked_minute = relativedelta(minute=minute)

        elif self.getData("time_lexicon/in_minute"):
            print "in_minute has a value"
            minute_number = int(self.getData("time_lexicon/in_minute"))
            asked_minute = relativedelta(minutes=+minute_number)

        else:
            print "minute and in_minute were empty"
            asked_minute = relativedelta(0)


        #WEEKDAY#
        if self.getData("time_lexicon/weekday"):
            print "weekday has a value"
            today_weekday = datetime.now().weekday()
            weekday = int(self.getData("time_lexicon/weekday"))
            if(weekday==0):
                weekday=MO
                weekday_num=0
            elif(weekday==1):
                weekday=TU
                weekday_num=1
            elif(weekday==2):
                weekday=WE
                weekday_num=2
            elif(weekday==3):
                weekday=TH
                weekday_num=3
            elif(weekday==4):
                weekday=FR
                weekday_num=4
            elif(weekday==5):
                weekday=SA
                weekday_num=5
            elif(weekday==6):
                weekday=SU
                weekday_num=6

            if (today_weekday == self.getData("time_lexicon/weekday")) and (self.getData("time_lexicon/in_week")=="" or self.getData("time_lexicon/in_week")==None):
                print "asked weekday is the same than today and in_week has no value"
                asked_weekday_in_day = relativedelta(days=+1, weekday=weekday)
                print "asked_weekday_in_day:", asked_weekday_in_day


            elif(today_weekday == self.getData("time_lexicon/weekday")) and (self.getData("time_lexicon/in_week")!="" or self.getData("time_lexicon/in_week")!=None):
                print "asked weekday is the same than today and in_week has a value"
                week_in_day = int(self.getData("time_lexicon/in_week"))*7
                week_number = week_in_day - 7
                asked_weekday_in_day = relativedelta(days=+1, weekday=weekday) + relativedelta(days=+week_number)

                print "asked_weekday_in_day:", asked_weekday_in_day

            elif(weekday_num - today_weekday < 0) and (self.getData("time_lexicon/in_week")!=None or self.getData("time_lexicon/in_week")!=""):
                print "asked weekday is not the same than today but it's posterior to today and in_week has a value"
                asked_weekday_in_day = relativedelta(weekday=weekday)

                print "asked_weekday_in_day:", asked_weekday_in_day

            #the requested weekday is not today's weekday and we want to set an in X week.
            elif(self.getData("time_lexicon/in_week")!=None or self.getData("time_lexicon/in_week")!=""):
                print "asked weekday is not the same than today and in_week has a value"
                in_week = int(self.getData("time_lexicon/in_week"))*7
                asked_weekday_in_day = relativedelta(weekday=weekday) + relativedelta(days=+in_week)

            else:
                print "asked weekday has a value and in_week has no value"
                asked_weekday_in_day = relativedelta(weekday=self.getData("time_lexicon/weekdayUtil"))
                print "asked_weekday_in_day:", asked_weekday_in_day

        else:
            print "weekday has no value"
            asked_month = asked_month
            asked_day = asked_day


        #SET REQUESTED DATE#
        askedDate=datetime.now() + asked_weekday_in_day + asked_year + asked_month + asked_day + asked_hour + asked_minute

        year = askedDate.year
        month = askedDate.month
        day = askedDate.day
        hour = askedDate.hour
        minute = askedDate.minute
        weekday = askedDate.weekday()

        self.memory.insertData("time_lexicon/askedYear", year)
        self.memory.insertData("time_lexicon/askedMonth", month)
        self.memory.insertData("time_lexicon/askedDay", day)
        self.memory.insertData("time_lexicon/askedHour", hour)
        self.memory.insertData("time_lexicon/askedMinute", minute)
        self.memory.insertData("time_lexicon/askedWeekday", weekday)

        self.askedDate = askedDate

        print "askedDate:", askedDate
        
        self.memory.insertData("askedDateTime", str(askedDate))
        self.memory.raiseEvent("timeaskStatus","done")

        return True
        
        
        
#########################################
###REMOVE DATA###########################
#########################################



    def removeData(self, key):
        try:
            return self.memory.removeData(key)
        except Exception:
            return None

    def removeValues(self):
        self.removeData("time_lexicon/year")
        self.removeData("time_lexicon/in_year")
        self.removeData("time_lexicon/month")
        self.removeData("time_lexicon/in_month")
        self.removeData("time_lexicon/day")
        self.removeData("time_lexicon/in_day")
        self.removeData("time_lexicon/hour")
        self.removeData("time_lexicon/in_hour")
        self.removeData("time_lexicon/minute")
        self.removeData("time_lexicon/in_minute")
        self.removeData("time_lexicon/in_week")
        self.removeData("time_lexicon/weekday")
        self.removeData("time_lexicon/weekdayUtil")
        self.removeData("time_lexicon/special_min")
        
        print "all data of time_lexicon category were removed"

def main():
    # Create and Start the Application
    app = qi.Application()
    app.start()
    # Create the ALGenerateKnowledge Service
    ps = ALSetDateTime(app)
    # Register It
    app.session.registerService("ALSetDateTime", ps)
    # Run the Application
    app.run()

if __name__ == "__main__":
    main()
