
try {
	if(!publicUser) {
		if(AInfo["Producing Dispensary"] == "CHECKED") {
			fnd = "N";
			cfi =loadASITable("CANNABIS FINANCIAL INTEREST");
//			logDebug("table Length " + CANNABISFINANCIALINTEREST.length);
//			if(CANNABISFINANCIALINTEREST.length > 0) {
				for(x in cfi) {
					if(cfi[x]["Type of License"] == "Producing Dispensary") 
						fnd ="Y";
				}
	//		}
			if (fnd == "N") {
				showMessage = true;
				cancel = true;
				comment("When Producing Dispensary is checked then you must list your Producing Dispensary License Number in the Cannabis Financial Interest table.");
			}
		}
	}
}
catch (err) {
    logDebug("A JavaScript Error occurred: Licenses/Cultivation/* /Application: " + err.message);
	logDebug(err.stack);
}

