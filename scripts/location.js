
var url = "http://maps.googleapis.com/maps/api/geocode/json?";
var contents;
var results = "";
var regEx = /\((.*)\)/i;
var regExLatLong = /'(.*?)'/;
var dataLength = 0;
var progressCount = 0;

$(document).ready(function(){
	$("#latitude").ForceNumericOnly();
	$("#longitude").ForceNumericOnly();
	$("#replace-index").ForceNumericOnly();
});

$(document).on("change","#text-file",function(e){
	var isAllowed = true;
	var selectedFile = e.target.value;
	var selectedFileExtension = selectedFile.substr(selectedFile.lastIndexOf("."));
	if(selectedFileExtension===".txt"){
		readSingleFile(e);
	}else{
		isAllowed = false;
	}
	return isAllowed;
});

var readSingleFile = function(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var textFile = evt.target.files[0]; 
    if (textFile) {
    	if(textFile.type!=="text/plain"){
    		bootbox.alert("please select a valid text file!");
    		return false;
    	}

      var reader = new FileReader();

      reader.onload = function(e) { 
	    contents = e.target.result;
        /*alert( "Got the file.n" 
              +"name: " + textFile.name + " \n"
              +"type: " + textFile.type + " \n"
              +"size: " + textFile.size + " bytes \n"
              + "starts with: " + contents.substr(1, contents.indexOf("n"))
        );  */
      }
      reader.readAsText(textFile);
    } else { 
      alert("Failed to load file");
    }
}

$(document).on("click","#start-searching",function(){
	var latitudeIndex = $("#latitude").val();
	var longitudeIndex = $("#longitude").val();
	results = "";
    dataLength = 0;
    progressCount = 0;
	$('.progress-bar').css('width', 0+'%').attr('aria-valuenow', 0); 
	if(contents==null){
		bootbox.alert("Choose a text file to update");
	}else if(isLatitudeAndLongitudeValid(latitudeIndex,longitudeIndex)===true){
		$("#location-result tbody").html('');
		var contentData = contents.split("\n");
		dataLength =  contentData.length;
		$.each(contentData, function(index, contentLine) {
			var contentLineExtract = contentLine.match(regEx)[1];
			if(contentLineExtract == null){
				contentLineExtract = contentLine;
			}
			var selectedIndex = $("#select-index").val();
			var selectedParams = $("#select-parameter").val();
			if(isIndexSelected(selectedIndex)===true){
				contentLineRows = contentLineExtract.split(",");
				if(contentLineRows[selectedIndex].search(selectedParams) != -1){
					var latitude = contentLineRows[latitudeIndex].match(regExLatLong)[1];
					var longitude = contentLineRows[longitudeIndex].match(regExLatLong)[1]
					var latlng = latitude+","+longitude;
					getGeoCodeAddressFromUrl(index,latitude,longitude,latlng.trim(),contentLine);
				}
			}else{
				contentLineRows = contentLineExtract.split(",");
				var latitude = contentLineRows[latitudeIndex].match(regExLatLong)[1];
				var longitude = contentLineRows[longitudeIndex].match(regExLatLong)[1]
				var latlng = latitude+","+longitude;
				getGeoCodeAddressFromUrl(index,latitude,longitude,latlng.trim(),contentLine);
			}	 
	    });
	}
});

var isIndexSelected = function(selectedIndex){
	return selectedIndex !="";
}

var isLatitudeAndLongitudeValid = function(latitude,longitude){
	if(latitude == ""){
		bootbox.alert("Index of Latitude is invalid");
		return false;
	}else if(longitude == ""){
		bootbox.alert("Index of Longitude is invalid");
		return false;
	}
	return true;
}

var getGeoCodeAddressFromUrl = function(index,latitude,longitude,latlng,contentLine){
	var getUrl = url+"latlng="+latlng+"&sensor=true";

	$.ajax({
		url:getUrl,
		type:"GET",
		success:function(data){
			var address_components = data.results[0].address_components;
			var city_name;
			var state_name;
			var country_name;
			progressCount++;
			$.each(address_components, function(index, contentLine) {
				var state_type = contentLine.types;
				$.each(state_type, function(index, stateContentLine) {
					if(stateContentLine === "administrative_area_level_1"){
						state_name = contentLine.long_name+" State";
					}else if(stateContentLine==="country"){
						country_name = contentLine.long_name;
					}else if(stateContentLine==="route"){
						city_name = contentLine.short_name;
					}
				});
			});
			$("#location-result tbody").append('<tr><td>'+index+'</td><td>'+latitude+'</td><td>'+longitude+'</td><td>'+contentLine.split(",")[1].match(regExLatLong)[1]+'</td><td>'+state_name+'</td><td>'+country_name+'</td></tr>');
			var newContentLine = contentLine;
			var replaceIndex =$("#replace-index").val();
			var replaceParams =$("#replace-parameter").val();
			var from = contentLine.split(",")[replaceIndex];
			if(replaceParams=="City"){
				var changed = newContentLine.replace(from,"'"+city_name+"'");
				results = results + changed+"\n";
			}else if(replaceParams=="State"){
				var changed = newContentLine.replace(from,"'"+state_name+"'");
				results = results + changed+"\n";
			}else if(replaceParams=="Country"){
				var changed = newContentLine.replace(from,"'"+country_name+"'");
				results = results + changed+"\n";
			}
			$('.progress-bar').css('width', ((progressCount/dataLength)*100)+'%').attr('aria-valuenow', ((progressCount/dataLength)*100)); 
			console.log((progressCount/dataLength)*100);
		}
	});

}

$(document).on("click","#create-script",function(){
	var textFile;
	if(results!=""){
		var resultData = new Blob([results],{type: 'text/plain'});
		if (textFile !== null) {
	      window.URL.revokeObjectURL(textFile);
	    }
	    textFile = window.URL.createObjectURL(resultData);
	    $("#download-script").show();
	    $("#download-script").attr("href", textFile);
	}
});