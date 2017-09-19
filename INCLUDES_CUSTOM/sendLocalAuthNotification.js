function sendLocalAuthNotification() {
	try{
		editAppSpecific("Local Authority Notification Sent", jsDateToASIDate(new Date()));
		editAppSpecific("Local Authority Notification Expires", dateAdd(jsDateToASIDate(new Date()),60,"Y"));
		updateAppStatus("Pending - Local Authorization");
		deactivateTask("Administrative Review");
		deactivateTask("Owner Application Reviews");
		if(AInfo["Local Authority Type"] == "County")
			var locAuth = AInfo["Local Authority County"];
		if(AInfo["Local Authority Type"] == "City")
			var locAuth = AInfo["Local Authority City"];
		if(AInfo["Local Authority Type"] == "City and County")
			var locAuth = AInfo["Local Authority City"] + "-" + AInfo["Local Authority County"];
		var locEmail = lookup("LIC_CC_LOCAL_AUTH_CONTACTS", locAuth);
		if(!matches(locEmail, null, "", undefined)) {
			var eParams = aa.util.newHashtable();
			rFiles = []				
			addParameter(eParams, "$$altID$$", capId.getCustomID());
			var priContact = getContactObj(capId,"Business");
			if(priContact)
				addParameter(eParams, "$$businessName$$", priContact.capContact.middleName);
			sendNotification(sysFromEmail,locEmail,"","LIC_CC_NOTIFY_LOC_AUTH",eParams, rFiles,capId);
		}
		else {
			showmessage = true;
			comment("Local Authority Notification not sent.  No email address found for the local authority " + locAuth)
		}
	}catch(err){
		logDebug("An error has occurred in function sendLocAuthNotifications: " + err.message);
		logDebug(err.stack);
	}
}