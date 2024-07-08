const NETWORK_MMR_SCRIPT = "LET network=[test_mmr2] IF PREVSTATE(0) EQ STATE(0) AND SIGNEDBY(PREVSTATE(0)) THEN RETURN VERIFYOUT(@INPUT @ADDRESS @AMOUNT @TOKENID TRUE) ENDIF RETURN FALSE";
const NETWORK_ARCHIVE_SCRIPT = "LET network=[test_archive2] IF PREVSTATE(0) EQ STATE(0) AND SIGNEDBY(PREVSTATE(0)) THEN RETURN VERIFYOUT(@INPUT @ADDRESS @AMOUNT @TOKENID TRUE) ENDIF RETURN FALSE";
var NETWORK_MMR_SCRIPT_ADDRESS = "";
var NETWORK_ARCHIVE_SCRIPT_ADDRESS = "";

MDS.init(function(msg){
  //Do initialitzation
  if(msg.event == "inited"){
    MDS.log("The app is initialising MDS ..., setting up the  configuration");
    
    
    register_network_script(NETWORK_MMR_SCRIPT, "MMR");
    register_network_script(NETWORK_ARCHIVE_SCRIPT, "ARCHIVE") ;
    
    //createConfigureDB();
    //getMaximaInfo();     // set on global vars the MAXIMA info of your node
	//setAddress();        // set on global vars the publickey and a wallet address
	//setNodeType();       // set on global vars the node type you are running MMR / ARCHIVE
    //setTimeout(() => {
  	//	configureOrLoadConfigurationDB();
  	//}, 1000);
    
	// Re publish maxima address every x times
	//setInterval(publish_modify_maxima_address(), PUBLISH_TIME);
	
	//var timerId = setTimeout(function republish_maxima() {
	//  publish_modify_maxima_address();
	//  timerId = setTimeout(republish_maxima, PUBLISH_TIME); 
	//}, PUBLISH_TIME);
  }
  else if(msg.event == "NEWBLOCK"){
  // the chain tip has changed
  }
  else if(msg.event == "NEWBALANCE"){
    // user's balance has changed
    MDS.log("New Balance Detected");
  }
  else if(msg.event == "MAXIMA"){
    /*
     Receive a Json petition object from users:
		- maxima_address   (user maxima address where to send the results of the petiton)
		- maxima_publickey   user publickey (Always will be the same, so opens a possibility to charge some fees and avoid abuse of it)
		- tokenid
		- address 
		- coinid
		- sendable
		- amount
		- coinage
		- order
		- confirmations
		- command    balance / coins
		- [] addresses /  coinids / tokenids    to be implemented on the next version with a service.js working
	   }
    
    */
    if(msg.data.application == "MMR_network-info-petition-answer"){
      //remove the leading 0x
      var datastr	= msg.data.data.substring(2);

      //Convert the data to petiton object
      var result_str = hexToUtf8(datastr);
      var result_obj = JSON.parse(result_str);
      MDS.log("Received Maxima data: MR_network-info-petition-answer :"+ JSON.stringify(result_obj, undefined, 2));
	  show_petiton_results_maxima(result_obj);
    }
  }
  else if(msg.event == "MINIMALOG"){
  // new Minima log message
  }
  else{
  }
});


document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("mainForm");
    const checkboxes = document.querySelectorAll('input[name="typeSearch"]');
    const addressCheckbox = document.getElementById("searchAddress");
    const toggleOptionsImage = document.getElementById("toggleOptions");
    const optionsFieldset = document.getElementById("optionsFieldset");
    // const jsonDataSection = document.getElementById("jsonDataSection");
    const jsonDataList = document.getElementById("jsonDataList");

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const network = document.getElementById("network").value;
        const address = document.getElementById("address").value;
        const tokenid = document.getElementById("tokenid").value;
        const coinid = document.getElementById("coinid").value;
        const command = document.getElementById("command").value;
        const typeSearch = Array.from(checkboxes).filter(checkbox => checkbox.checked).map(checkbox => checkbox.value);
        const amount = document.getElementById("amount").value;
        const coinage = document.getElementById("coinage").value;
        const order = document.getElementById("order").value;
        const sendable = document.getElementById("sendable").value;
		jsonDataList.innerHTML = "";
		
		process_petition(network, address, tokenid, coinid, command, typeSearch, amount, coinage, order, sendable);
        // Mock JSON data
        const mockData = [
            { id: 1, name: "John Doe", age: 30 },
            { id: 2, name: "Jane Smith", age: 25 }
            // Add more mock data as needed
        ];

        // Display mock data in yellow-colored list
        //jsonDataList.innerHTML = mockData.map(item => `<li>${JSON.stringify(item)}</li>`).join("");

        // Hide form section and show jsonDataSection
        //document.querySelector("main").style.display = "none";
        // jsonDataSection.style.display = "block";
    });

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", () => {
            const checkedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;
            if (checkedCount === 0) {
                addressCheckbox.checked = true;
            }
        });
    });

    toggleOptionsImage.addEventListener("click", () => {
        if (optionsFieldset.style.display === "none") {
            optionsFieldset.style.display = "block";
            toggleOptionsImage.src = "https://fonts.gstatic.com/s/i/materialicons/expand_less/v6/24px.svg"; // Change to contract icon when options are shown
        } else {
            optionsFieldset.style.display = "none";
            toggleOptionsImage.src = "https://fonts.gstatic.com/s/i/materialicons/expand_more/v6/24px.svg"; // Change back to expand icon when options are hidden
        }
    });
});



function show_petiton_results_maxima(result_obj){
	const jsonDataSection = document.getElementById("jsonDataSection");
	const jsonDataList = document.getElementById("jsonDataList");
	jsonDataList.innerHTML = result_obj.map(item => `<li>${JSON.stringify(item,undefined,2)}</li>`).join("<br/>");
	// jsonDataList.innerHTML = result_obj.map(item => `<li>${JSON.stringify(item,",","<br/>")}</li>`).join("<br/>");
	// const txt_content = result_obj.map(item => `${JSON.stringify(item,undefined,2)}`).join("\n\n");
	// jsonDataList.innerText = txt_content;
	if (result_obj.length == 0) jsonDataList.innerHTML = "<li>No results found for this query</li>";
	jsonDataSection.style.display = "block";
}



function register_network_script(script, network_type) {  
	// MDS.log("register_network_script"); 
    
    const command = 'newscript trackall:false script:"'+script+'"'
    MDS.log("Registering network  script "+network_type+" : "+command);
    MDS.cmd(command, function(res) {
      if (res.status) {
        // MDS.log(JSON.stringify(res));
        MDS.log("Registered NETWORK SCRIPT "+network_type+", address: "+res.response.address);
        if ("MMR" === network_type) NETWORK_MMR_SCRIPT_ADDRESS = res.response.address;
		else NETWORK_ARCHIVE_SCRIPT_ADDRESS = res.response.address;
      }
        else{
            MDS.log("ERROR: Could not register NETWORK SCRIPT: "+JSON.stringify(res));
        }
    });
}

// build a petition_obj query to be send over Maxima to MMR/Archive nodes
function process_petition(network, address, tokenid, coinid, command, typeSearch, amount, coinage, order, sendable){
	var petition_obj = {};
	petition_obj.network = network;
	petition_obj.command = command;
	petition_obj.order = order;
	
	if (amount.trim().length != 0) petition_obj.amount = amount.trim();
	if (coinage.trim().length != 0) petition_obj.coinage = coinage.trim();
	if (sendable.trim().length != 0) petition_obj.sendable= sendable.trim();
	
	 typeSearch.forEach(search => {
	    if (search === 'address' && address.trim().length != 0) {
	        petition_obj.address = address.trim();
	    }
	    if (search === 'tokenid' && tokenid.trim().length != 0) {
	        petition_obj.tokenid = tokenid.trim();
	    }
	    if (search === 'coinid' && coinid.trim().length != 0) {
	        petition_obj.coinid = coinid.trim();
	    }
	    // Add conditions for additional parameters if needed
	});
	
	MDS.log("Petition Object: "+JSON.stringify(petition_obj, undefined, 2));
	
	if (address.trim().length == 0 && tokenid.trim().length == 0 && coinid.trim().length == 0 && address.trim().length == 0) {
		alert("Petition must contain at least one of the following fields (address, tokenid or coinid)");
		return;
	} else if (address.trim().length == 0 && tokenid.trim() === "0x00" && undefined === petition_obj.amount) {
		alert("Petition must contain at least one one address with tokenid  0x00 or an amount )");
		return;
	}
	//alert(get_network_script_address(network)+", "+network);
	send_maxima_petition(petition_obj, get_network_script_address(network))
}



// get the coins of the network script  to fetch the maxima address where to send the petition
// get the Maxima info of the user and add it to the petition_obj
// send the petition object to maxima address end point of a node of the network
function send_maxima_petition(petition_obj, script_address) {
	
	// Get the coins from the netwoek script to fetch the maxima address of a neteork's node
	getNetworkScriptCoins(script_address, function(coins){
		if (coins.length == 0) {
			alert("There are not any network nodes published yet, \nWait a few minutes and try again");
			return;
		}
		// const randomIndex = Math.floor(Math.random() * coins.length);
		// const coin = coins[randomIndex];
		const coin = coins[0];        // Pick the last one of the script, uncommnet previous code to pick one randomly
		const ntw_maxima_publickey = coin.state[1].data;
		var ntw_maxima_address = coin.state[2].data;
		// get rid of of "[" "]" characters surrounding the maxima address of the state var
		
		// alert(JSON.stringify(ntw_maxima_address));
		ntw_maxima_address = ntw_maxima_address.substring(1, ntw_maxima_address.length - 1);
		
		
		getMaximaInfo(function(maxima_obj){
			petition_obj.maxima_publickey = maxima_obj.publickey;
			petition_obj.maxima_address = maxima_obj.maxima_address;
			
			// alert ("Petition_info:" + JSON.stringify(petition_obj));
			// Convert petition_obj to hex data for sending it over maxima
			var petition_hex_obj = "0x"+utf8ToHex(JSON.stringify(petition_obj));
			
			// ---> send petition_obj over maxima to the node MMR/ARCHIVE fetched from script network random coin
			var cmd_maxima = "maxima action:send publickey:"+ntw_maxima_publickey+" to:"+ntw_maxima_address+" application:MMR-network-info-petition data:"+petition_hex_obj;
			MDS.log("send maxima petition cmd: "+cmd_maxima);
			MDS.cmd(cmd_maxima, function(resp) {
			    if (resp.status) {
			      MDS.log("**** Maxima Petition sent OK ***** ->"+JSON.stringify(petition_obj));
			      alert("Petition sent, wait for the answer, if it takes too much try again");
			    }
			    else{
			      MDS.log("ERROR: Maxima Petiton not sended:"+JSON.stringify(resp));
			      alert("ERROR: Maxima Petiton not sended:"+JSON.stringify(resp));
			      
			    }
			});
		});
		
	});
}


// return on the callback the response that is an array of coins found
function getNetworkScriptCoins(script_address, callback){
  MDS.log("coins address:"+script_address);
  MDS.cmd("coins address:"+script_address, function(resp) {
    if (resp.status) {
	  callback(resp.response);
    } else {
	  MDS.log("ERROR: getNetworkScriptCoins"+JSON.stringify(resp, undefined, 2));
	  callback([]);
      //var nodeStatus = JSON.stringify(resp, undefined, 2);
      //document.getElementById("status-object").innerText = nodeStatus;
      //document.getElementById("status-object").innerHTML = result;
    }
  });
}


function get_network_script_address(network_type){
	if ("MMR" === network_type) return NETWORK_MMR_SCRIPT_ADDRESS;
	else return NETWORK_ARCHIVE_SCRIPT_ADDRESS;
}


// Get the maxima info most recent of the user miima node and return on the callback
function getMaximaInfo(callback) {
  MDS.log("getMaximaInfo");
  
  var maxima_obj = {};
  MDS.cmd("maxima action:info", function(resp) {
    if (resp.status) {
      //alert("Contact maxima action info!");
      MDS.log("getting MAXIMA info....");
      //MDS.log("Maxima info:"+JSON.stringify(resp.response, undefined, 2));
      maxima_obj.maxima_address = resp.response.contact;
      maxima_obj.publickey = resp.response.publickey;
      callback(maxima_obj);

    }else{
      var nodeStatus = JSON.stringify(resp, undefined, 2);
      MDS.log("ERROR getMaximaInfo() ...."+nodeStatus);
    }
  });
}



const utf8encoder = new TextEncoder();
function hexToUtf8(s)
{
  return decodeURIComponent(
     s.replace(/\s+/g, '') // remove spaces
      .replace(/[0-9A-F]{2}/g, '%$&') // add '%' before each 2 characters
  );
}

function utf8ToHex(s)
{
  const rb = utf8encoder.encode(s);
  let r = '';
  for (const b of rb) {
    r += ('0' + b.toString(16)).slice(-2);
  }
  return r;
}

