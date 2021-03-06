try{
	if(balanceDue<=0){
		if (!matches(getAppStatus(),"Deferral Approved","Deferral Unpaid")){
			if(!isTaskComplete("Annual Renewal Review") && !isTaskComplete("Provisional Renewal Review")){
				if (AInfo["License Issued Type"] == "Provisional") {
					activateTask("Provisional Renewal Review");
					updateTask("Provisional Renewal Review","In Progress","","");
					deactivateTask("Annual Renewal Review");
				}else{
					activateTask("Annual Renewal Review");
					updateTask("Annual Renewal Review","In Progress","","");
					deactivateTask("Provisional Renewal Review");
				}
			}
		
			if(getAppStatus() == "Renewal Fee Due") {
		// Check License Cases to see if renewal can be fast tracked
				var licenseId = AInfo["License Number"];
				var licId = aa.cap.getCapID(licenseId);
				licId = licId.getOutput();
				childIds  = getChildren("Licenses/Cultivator/License Case/*",licId);
				holdId = capId;
				capId = licId;
				var caseReview = false;
				if(appHasCondition("Owner History","Applied","DOJ LiveScan Match",null))
					caseReview = true;
				if(appHasCondition("Notice","Applied","Local Non-Compliance",null))
					caseReview = true;
				for(c in childIds) {
					capId = childIds[c];
					cCap = aa.cap.getCap(capId).getOutput();
					cStatus = cCap.getCapStatus();
					cInfo = new Array;
					loadAppSpecific(cInfo);
					logDebug(cInfo["Case Renewal Type"] + " - " + cStatus);
					if(matches(cInfo["Case Renewal Type"], "Renewal Review", "Renewal Hold")) {
						if(!matches(cStatus, "Resolved", "Closed")) {
							caseReview = true;
							break;
						}
					}
				}	
				capId = holdId;
		// Fast track license if qualified and fees paid
				if(!caseReview && balanceDue <= 0) {	
					var renewalCapProject;
					var vExpDate;
					var vNewExpDate;
					var vLicenseObj;
					licAltId = licId.getCustomID();
					altId = capId.getCustomID();
					if (licId != null) {
		// Get current expiration date.
						vLicenseObj = new licenseObject(null, licId);
						vExpDate = vLicenseObj.b1ExpDate;
						vExpDate = new Date(vExpDate);
		// Extend license expiration by 1 year
						vNewExpDate = new Date(vExpDate.getFullYear() + 1, vExpDate.getMonth(), vExpDate.getDate());
		// Update license expiration date
						logDebug("Updating Expiration Date to: " + vNewExpDate);
						vLicenseObj.setExpiration(dateAdd(vNewExpDate,0));
		// Set license record expiration and status to active
						vLicenseObj.setStatus("Active");
						updateAppStatus("Active","License Renewed",licId);
		// Update the Cultivation Type on the license record
						if(AInfo["Designation Change"] == "Yes") {
							editAppSpecific("Cultivator Type",AInfo["Designation Type"],licId);
							editAppName(AInfo["License Issued Type"] + " " + AInfo["Designation Type"] + " - " + AInfo["License Type"],licId);
						}
		//Set renewal to complete, used to prevent more than one renewal record for the same cycle
						renewalCapProject = getRenewalCapByParentCapIDForIncomplete(licId);
						if (renewalCapProject != null) {
							renewalCapProject.setStatus("Complete");
							renewalCapProject.setRelationShip("R");  // move to related records
							aa.cap.updateProject(renewalCapProject);
						}
		// Update the workflow on the Renewal record to approved
						if (AInfo["License Issued Type"] == "Provisional") {
							closeTask("Provisional Renewal Review","Approved","Renewal Fast Tracked","");
						}else{
							closeTask("Annual Renewal Review","Approved","Renewal Fast Tracked","");
						}
		//				updateAppStatus("Approved","Renewal Fast Tracked");
						editAppSpecific("Fast Track","CHECKED");
				
		//Run Official License Certificate and Annual/Provisional Renewal Approval Email and Set the DRP		
						if (AInfo["License Issued Type"] == "Provisional")
							var approvalLetter = "Provisional Renewal Approval";
						else
							var approvalLetter = "Approval Letter Renewal";
						var scriptName = "asyncRunOfficialLicenseRpt";
						var envParameters = aa.util.newHashMap();
						envParameters.put("licType", "");
						envParameters.put("appCap",altId);
						envParameters.put("licCap",licAltId); 
						envParameters.put("reportName","Official License Certificate");
						envParameters.put("approvalLetter", approvalLetter);
						envParameters.put("emailTemplate", "LCA_RENEWAL_APPROVAL");
						envParameters.put("reason", "");
						envParameters.put("currentUserID",currentUserID);
						envParameters.put("contType","Designated Responsible Party");
						envParameters.put("fromEmail","calcannabislicensing@cdfa.ca.gov");
						aa.runAsyncScript(scriptName, envParameters);
							
						var priContact = getContactObj(capId,"Designated Responsible Party");
		// If DRP preference is Postal add license record to Annual/Provisional Renewal A set
						if(priContact){
							var priChannel =  lookup("CONTACT_PREFERRED_CHANNEL",""+ priContact.capContact.getPreferredChannel());
							if(!matches(priChannel, "",null,"undefined", false)){
								if(priChannel.indexOf("Postal") > -1 ){
									if (AInfo['License Issued Type'] == "Provisional") {
										var sName = createSet("PROVISIONAL_LICENSE_RENEWAL_ISSUED","License Notifications", "New");
									}
									if (AInfo['License Issued Type'] == "Annual"){
										var sName = createSet("ANNUAL_LICENSE_RENEWAL_ISSUED","License Notifications", "New");
									}
									if(sName){
										setAddResult=aa.set.add(sName,licId);
										if(setAddResult.getSuccess()){
											logDebug(capId.getCustomID() + " successfully added to set " +sName);
										}else{
											logDebug("Error adding record to set " + sName + ". Error: " + setAddResult.getErrorMessage());
										}
									}
								}
							}
						}
			// Add record to the CAT set
						addToCat(licId);
					}
				}
			}
			if (AInfo['Fast Track'] != "CHECKED" && getAppStatus != 'Submitted'){
				updateAppStatus("Submitted", "Updated via PPB:LICENSES/CULTIVATOR/*/Renewal.");
			}
		}else{
			updateAppStatus("Deferral Paid", "Updated via PPB:LICENSES/CULTIVATOR/*/Renewal.");
		}
	}
}catch(err){
	logDebug("An error has occurred in PPA:LICENSES/CULTIVATOR/*/Renewal: Renewal Fees Paid: " + err.message);
	logDebug(err.stack);
}