
function OnLoad() {
	var user;
    var _iSiteVersion;
    try {
        user = Radiology.GetCurrentUser();
    }
    catch (e) {
        Shim_Debug("Couldn't get user.");
        return;
    }

    try {
    	_iSiteVersion = Radiology.GetVersion();
    	if (_iSiteVersion < "3.5") {
    		Shim_Debug("Version is lower than expected: " + _iSiteVersion);
    	}
    }
    catch (e) {
    	Shim_Debug("Couldn't get iSite version.");
    }

    if(user !== undefined)
    {
        Shim_Debug("User is " + user);
        Shim_Debug("Version is " + _iSiteVersion);
    }
    else
    {
        Shim_Debug("Undefined user.");
    }
}

function OnUnload() {
    
}

function QueryMRN(mrn) {
    var str = "x00100020 = \"" + mrn + "\"";
    examList = RadiologyQuery(str);
}

function Query(mrn, accession) {
    var str;
    if (mrn != undefined && mrn != null && mrn != "")
        str = "x00080050 = \"" + accession + "\" AND x00100020 = \"" + mrn + "\"";
    else
    str = "x00080050 = \"" + accession + "\"";
    examList = RadiologyQuery(str);
}

//From PS360 plugin, should refactor
function RadiologyQuery(query) {
    Shim_Debug("Query string: " + query);

	var examNode = null;
	var queryResults = Radiology.Query(query, "INTERPRETATION", 1);
	if (queryResults == "") {
		var error = Radiology.GetLastErrorCode();
        Shim_Debug("Radiology error: " + error);
	}
	else {
        Shim_Debug("Got query response:" + JSON.stringify(queryResults));
		var doc = xmldso.XMLDocument;
		doc.loadXML(queryResults);
		var nodeList = doc.getElementsByTagName("QueryResult");
		var numMatches = nodeList.item(0).selectSingleNode("TotalMatches").text;
		if (numMatches == 0) {
			queryResults = Radiology.Query(query, "LOOKUP", 1);
			if (queryResults != "") {
				doc = xmldso.XMLDocument;
				doc.loadXML(queryResults);
				nodeList = doc.getElementsByTagName("QueryResult");
				numMatches = nodeList.item(0).selectSingleNode("TotalMatches").text;
			}
		}
		if (numMatches > 0) {
			examNode = doc.getElementsByTagName("Exam");
		}
	}
	return examNode;
}