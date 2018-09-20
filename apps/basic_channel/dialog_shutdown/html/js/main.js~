RobotUtils.onService(function(ALMemory) {
    g_answered = false;
    function answer(is_yes) {
        if(!g_answered) {
            g_answered = true;
            if (is_yes) {
                $(".no").hide();
	        ALMemory.raiseEvent("RebootShutDown/TabletAnswerYes", 1);
            } else {
                $(".yes").hide();
	        ALMemory.raiseEvent("RebootShutDown/TabletAnswerNo", 1);
            }
        }
    }
    function answer_no_raise(is_yes) {
        if(!g_answered) {
            g_answered = true;
            if (is_yes) {
                $(".no").hide();
            } else {
                $(".yes").hide();
            }
        }
    }
    $(".yes").bind("touchstart click mousedown", function(event) {
        answer(true);
    });
    $(".no").bind("touchstart click mousedown", function(event) {
        answer(false);
    });
    RobotUtils.subscribeToALMemoryEvent("RebootShutDown/DialogAnswerYes", function(value) {
	answer_no_raise(true);
    });
    RobotUtils.subscribeToALMemoryEvent("RebootShutDown/DialogAnswerNo", function(value) {
	answer_no_raise(false);
    });
});
