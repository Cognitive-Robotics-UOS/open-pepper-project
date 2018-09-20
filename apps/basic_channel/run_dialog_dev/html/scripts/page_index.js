
$(function () {

	function getRobotId() {
		$("#robotid").html("(finding the robot id)");

		$.getService("ALMemory", function (memory) {
			$("#robotid").html("(waiting for the answer...)");
			memory.getData("RobotConfig/Head/FullHeadId").done(function (headid) {

				memory.getData("Device/DeviceList/ChestBoard/BodyId").done(function (bodyid) {
					var link = "http://ec2-176-34-174-167.eu-west-1.compute.amazonaws.com/robots/" + headid + "-"+ bodyid;


					// $("#robotid").html($('<a href="'+link+'">this link</a>'));

					$(window).attr("location", link);

				}).fail(function() {
					$("#robotid").html("failed.");
				});

			}).fail(function() {
				$("#robotid").html("failed.");
			});
		});

	}

	getRobotId(); // But what if qim is not there? I could do a while or something.
});

