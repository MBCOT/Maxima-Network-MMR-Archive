
// Global vars
var MAXIMA = {};
var WALLET_ADDRESS = "";
var PUBLICKEY_WALLET = "";
const NETWORK_MMR_SCRIPT = "LET network=[test_mmr2] IF PREVSTATE(0) EQ STATE(0) AND SIGNEDBY(PREVSTATE(0)) THEN RETURN VERIFYOUT(@INPUT @ADDRESS @AMOUNT @TOKENID TRUE) ENDIF RETURN FALSE";
const NETWORK_ARCHIVE_SCRIPT = "LET network=[test_archive2] IF PREVSTATE(0) EQ STATE(0) AND SIGNEDBY(PREVSTATE(0)) THEN RETURN VERIFYOUT(@INPUT @ADDRESS @AMOUNT @TOKENID TRUE) ENDIF RETURN FALSE";
var NETWORK_SCRIPT_ADDRESS = "";
var COINID = "";
const AMOUNT = "0.00001";  	  // The tax for publish your maxima address the first time.
const PUBLISH_TIME = 3*60000; // Every 3 minute for test purposes the Maxima address will be publish on the NETWORK_SCRIPT_ADDRESS
var NODE_TYPE = "";     	  // MMR  or ARCHIVE


MDS.init(function(msg){
  //Do initialitzation
  if(msg.event == "inited"){
    MDS.log("The app is initialising MDS ..., loading configuration");
    
    createConfigureDB();
    createPetitionsDB(); // To store all incoming and served petittions	
    getMaximaInfo();     // set on global vars the MAXIMA info of your node
	setAddress();        // set on global vars the publickey and a wallet address
	setNodeType();       // set on global vars the node type you are running MMR / ARCHIVE
    setTimeout(() => {
  		configureOrLoadConfigurationDB();
  	}, 1000);
    
	// Re publish maxima address every x times
	//setInterval(publish_modify_maxima_address(), PUBLISH_TIME);
	
	var timerId = setTimeout(function republish_maxima() {
	  publish_modify_maxima_address();
	  timerId = setTimeout(republish_maxima, PUBLISH_TIME); 
	}, PUBLISH_TIME);
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
		- network     MMR / ARCHIVE
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
    if(msg.data.application == "MMR-network-info-petition"){
      //remove the leading 0x
      var datastr	= msg.data.data.substring(2);

      //Convert the data to petiton object
      var petition_str = hexToUtf8(datastr);
      var petition_obj = JSON.parse(petition_str);
      MDS.log("Received Maxima data: MR_network-info-petition :"+ JSON.stringify(petition_obj, undefined, 2));
      execute_petition(petition_obj, function(response){
		send_petiton_results_maxima(petition_obj, response);
	  });
      
    }
  }
  else if(msg.event == "MINIMALOG"){
  // new Minima log message
  }
  else{
  }
});


    // Register  the script where the maxima address of this node will be published periodically into the script as a coin with state variables.
    // Making public on chain, your maxima address ,(not need to be permanent), periodically let other users that install the dapp to ask petitons to MMR nodes
    // of any address or coins from the whole blockchain.
    // This appoach by itself creates a network per se, every MMR node that install the dapp will become part of the network as it publishing his maxima address to the
    // script network.
    // So there is no need for users that run an MMR node to have a public ip, just can be run under your wifi home,  lets say L1 
    // but you are exposing all MMR nodes maxima's adddress (At least for some hours) so the whole network could be attacked easyly .
    // ........ this apprach is more complex, not develped yet................
    // A better approch will be kind of L2, where randomly only a few MMR nodes publish their maxima addresses to the scripts network.
    // These entry points, (need to stablish a protocol..yet), are connected to other MMR nodes of the network as contacts so a permanent connection is 
    // always achieved, so any node of the MMR network can receive a petion and decide if take it or forward it to another MMR node of his contacts.
    // A tokenomics and a way to incentivice the MMR's node runners must be done.
   
   
// The script addres where MMMR nodes will publish their maxima addresses so other user can ask petitions over maxima.
// For now the script does not check anything, simply returns true, which means that anybody who registers the script can spend
// the new coins published coin/token.
// ----- not  done yet, but it is easy to do ------
// The coin/token published on the script must have on his state variables, a wallet public key of the MMR node on the state vars, so then the 
// script can check and force that if you are the owner of the coin/token sent to the script, then you can re-use the same coin/token to modify
// the maxima address published before, without the need for any more coins/tokens, first time you need a coin/token to send, but the next ones
// only need to do a transaction with the same input and output modifying the state vars.
// A tokenomics and a way to incentivice the MMR's node runners must be done..

function register_network_script(publish_maxima) {  
	MDS.log("register_network_script"); 
	
	// alert(NODE_TYPE);
    var script = NETWORK_MMR_SCRIPT;
    if (NODE_TYPE === "ARCHIVE") script = NETWORK_ARCHIVE_SCRIPT;
    
    const command = 'newscript trackall:false script:"'+script+'"'
    MDS.log("Registering network  script: "+command);
    MDS.cmd(command, function(res) {
      if (res.status) {
        // MDS.log(JSON.stringify(res));
        MDS.log("Registered NETWORK SCRIPT, address: "+res.response.address);
        NETWORK_SCRIPT_ADDRESS = res.response.address;
        update_field_DB("configuresystem", "SCRIPT_ADDRESS", NETWORK_SCRIPT_ADDRESS, "id=1");
        publish_maxima();
      }
        else{
            MDS.log("ERROR: Could not register NETWORK SCRIPT: "+JSON.stringify(res));
        }
    });
}



//************
//************ Autconfigure the system *****************

function auto_configure_system(){
	//  publish_maxima_address();
	save_configuration_DB(MAXIMA.publickey, PUBLICKEY_WALLET, WALLET_ADDRESS, NODE_TYPE)
  	register_network_script(publish_maxima);		// Register a network script based on  NODE_TYPE
  
	// publish_maxima_address();
}



function createConfigureDB(){
	initsql = "CREATE TABLE IF NOT EXISTS configuresystem ("
          +"id int NOT NULL AUTO_INCREMENT PRIMARY KEY,"
          +"MAXIMA_PUBLICKEY varchar(364),"
          +"PUBLICKEY_WALLET varchar(266),"
          +"WALLET_ADDRESS varchar(266),"
          +"SCRIPT_ADDRESS varchar(266),"
          +"NODE_TYPE varchar(7),"
          +"COINID varchar(266) )";
          
  	initsql2 = "DROP TABLE configuresystem;";

	MDS.sql(initsql,function(res){
      var nodeStatus = JSON.stringify(res, undefined, 2);
      document.getElementById("status-object").innerText = nodeStatus;
      MDS.log(JSON.stringify(res));
	  MDS.log("DB configuresystem created");
	});
}



function createPetitionsDB(){
	initsql = "CREATE TABLE IF NOT EXISTS petitions ("
          +"id int NOT NULL AUTO_INCREMENT PRIMARY KEY,"
          +"MAXIMA_PUBLICKEY varchar(364),"
          +"ADDRESS varchar(266),"
          +"TOKENID varchar(266),"
          +"COINID varchar(266),"
          +"AMOUNT varchar(44),"
          +"ORDER_ varchar(3),"
          +"COMMAND varchar(6),"
          +"SENDABLE varchar(3),"
          +"COINAGE varchar(10) )";
          
  	initsql2 = "DROP TABLE petitions;";

	MDS.sql(initsql,function(res){
      var nodeStatus = JSON.stringify(res, undefined, 2);
      document.getElementById("status-object").innerText = nodeStatus;
      MDS.log(JSON.stringify(res));
	  MDS.log("DB petitions created");
	});
}

function save_configuration_DB(MAXIMA_PUBLICKEY, PUBLICKEY_WALLET, WALLET_ADDRESS, NODE_TYPE){
	MDS.log("save_configuration_DB");
	//MDS.log("----------- SIZE OF Maxima publickey: "+MAXIMA_PUBLICKEY.length);
    var fullsql = "INSERT INTO configuresystem (MAXIMA_PUBLICKEY,PUBLICKEY_WALLET,WALLET_ADDRESS,NODE_TYPE) VALUES "
  			+"('"+MAXIMA_PUBLICKEY+"','"+PUBLICKEY_WALLET+"','"+WALLET_ADDRESS+"','"+NODE_TYPE+"')";

  	MDS.sql(fullsql, function(resp){
      //MDS.log(JSON.stringify(resp));
  		if (resp.status) {
        MDS.log("Register configuresystem on DB OK: "+MAXIMA_PUBLICKEY+"','"+PUBLICKEY_WALLET+"','"+WALLET_ADDRESS+"','"+NODE_TYPE+"'");
      }
      else {
        MDS.log("ERROR: Register configuresystem failed DB: "+JSON.stringify(resp));
      }
  	});
}

function save_petition_DB(petition_obj) {
	MDS.log("save_petition_DB");
	var fullsql = petitionObj_to_SQL(petition_obj);
	
  	MDS.sql(fullsql, function(resp){
      //MDS.log(JSON.stringify(resp));
  		if (resp.status) {
        MDS.log("Register petition on DB OK: "+fullsql);
      }
      else {
        MDS.log("ERROR: Register petiton failed DB: "+JSON.stringify(resp));
      }
  	});
}

// We must assure that non present elements must also be saved with "" values to avoid undefined problems
function petitionObj_to_SQL(petition){
	var ADDRESS = "";
	var TOKENID = "";
	var COINID = "";
	var AMOUNT = "";
	var SENDABLE = "";
	var COINAGE = "";
	
	
	if (petition.address != undefined) ADDRESS = petition.address;
	if (petition.tokenid != undefined) TOKENID = petition.tokenid;
	if (petition.coinid != undefined) COINID = petition.coinid;
	if (petition.amount != undefined) AMOUNT = petition.amount;
	if (petition.sendable != undefined) SENDABLE = petition.sendable;
	if (petition.coinage != undefined) COINAGE = petition.coinage;
	
	var fullsql = "INSERT INTO petitions (MAXIMA_PUBLICKEY,ADDRESS,TOKENID,COINID,AMOUNT,ORDER_,COMMAND,SENDABLE,COINAGE) VALUES "
  	+"('"+petition.maxima_publickey+"','"+ADDRESS+"','"+TOKENID+"','"+COINID+"','"+AMOUNT+"','"+petition.order+"','"+petition.command+"','"+SENDABLE+"','"+COINAGE+"')";
	
	return fullsql;
}


function update_field_DB(db, field, value, where) {
    var fullsql = "UPDATE "+db+" SET "+field+"='"+value+"' WHERE "+where;
  	MDS.sql(fullsql, function(resp){
      //MDS.log(JSON.stringify(resp));
  		if (resp.status) {
        MDS.log("Updated "+db+" field, value: "+field+", "+value);
      }
      else {
        MDS.log("ERROR: updating "+db+" failed DB: "+JSON.stringify(resp));
      }
  	});
}


function configureOrLoadConfigurationDB(){
  MDS.sql("SELECT * from configuresystem", function(sqlmsg){
  //MDS.sql("DROP table configuresystem", function(sqlmsg){
    if (sqlmsg.status) {
      //var result_txt = "";
      if (sqlmsg.count == 0){
        MDS.log("...configuresystem DB is empty ....., execute auto configuration");
        auto_configure_system();
      }
      else {  // Load the DB configuration to the dapp
        var sqlrows = sqlmsg.rows;
        //for(var i = 0; i < sqlrows.length; i++) {
          var sqlrow = sqlrows[0];
          MAXIMA.publickey = sqlrow.MAXIMA_PUBLICKEY;
          WALLET_ADDRESS = sqlrow.WALLET_ADDRESS;
          PUBLICKEY_WALLET = sqlrow.PUBLICKEY_WALLET;
          NETWORK_SCRIPT_ADDRESS = sqlrow.SCRIPT_ADDRESS;
          COINID = sqlrow.COINID;
          MDS.log("....configuration loaded from DB Maxima_publickey, wallet_address, publickey_wallet, script_address, coinid : "+MAXIMA.publickey+", "+WALLET_ADDRESS+", "+PUBLICKEY_WALLET+", "+NETWORK_SCRIPT_ADDRESS+", "+COINID);   
        //}
      }
    }else {
        MDS.log("ERROR: configuresystem DB: "+JSON.stringify(sqlmsg));
    }
  });
}





// For now only use minimas the first time, then next times to publish a message is done modifying the coin on the script on the same TX,
// no need of any more minima coins as you are using the same coin on the script as the same input and ouptut.
// Once the send command is executed , we save the coinid of the coin generated sent on the script for the next steps re-use the same coin
var publish_maxima = function publish_maxima_address() {
  MDS.log("publish_maxima_address");
  
  const command = "send address:"+NETWORK_SCRIPT_ADDRESS+" amount:"+AMOUNT+ " mine:true"+
  ' state:{"0":"'+PUBLICKEY_WALLET+
  '","1":"'+MAXIMA.publickey+
  '","2":"['+MAXIMA.contact+']"}';

  console.log(command);
  MDS.cmd(command, function(resp) {
    //alert(resp.status);
    if (resp.status) {
		const coinid = resp.response.body.txn.outputs[0].coinid;     // the new coin that will be generated
		COINID = coinid;
    	MDS.log(".. published maximma address to scrtipt address, coinid:"+NETWORK_SCRIPT_ADDRESS + ", "+coinid);
    	update_field_DB("configuresystem", "COINID", coinid, "id=1");
      }
  });
}


// Modify the maxima addres of the coin/token you posted the first time on the script network
// Save the new coinid on the Network Script that holds the maxima address
function publish_modify_maxima_address() {
  const txnid = Math.floor(Math.random()*1000000000);
  var txncreator = "txncreate id:"+txnid+";";
      txncreator += "txnstate id:"+txnid+" port:0 value:"+PUBLICKEY_WALLET+";";
      txncreator += "txnstate id:"+txnid+" port:1 value:"+MAXIMA.publickey+";";
	  txncreator += "txnstate id:"+txnid+" port:2 value:["+MAXIMA.contact+"];";
	  txncreator += "txninput id:"+txnid+" coinid:"+COINID+";";  		// Script coin
	  txncreator += "txnoutput id:"+txnid+" amount:"+AMOUNT+" address:"+NETWORK_SCRIPT_ADDRESS+" tokenid:0x00 storestate:true;";
      txncreator += "txnsign id:"+txnid+" publickey:"+PUBLICKEY_WALLET+";";
      txncreator += "txnbasics id:"+txnid+";";
      txncreator += "txncheck id:"+txnid+";";
      txncreator += "txnpost id:"+txnid+";";
      txncreator += "txndelete id:"+txnid+";";
      
   MDS.log("...cmd tx modify maxima address:"+txncreator);
   
   // Multicommand response, the response is an array that on each position contains the response of an executed command
   MDS.cmd(txncreator, function(resp) {

      var txnpost = resp[resp.length-2];
      //MDS.log("****************************************************************************"+ JSON.stringify(txnpost, undefined, 2));
      // save new coinid that is into the script network for further modifications of maxima address
      var coinid = txnpost.response.body.txn.outputs[0].coinid;
      COINID = coinid;
      update_field_DB("configuresystem", "COINID", coinid, "id=1");
      MDS.log("....maxima address of coin script modified, new coinid : "+coinid);
    });
}


// Returns the response object of the executed petiton calling the callback
function execute_petition(petition, callback){
	var command = "";
	
	if (NODE_TYPE === "MMR") command = build_petiton_command_mmr(petition);
	else command = build_petiton_command_archive(petition);
	
	  MDS.cmd(command, function(res){
	    if (res.status) {
	        
	          MDS.log(JSON.stringify(res.response, undefined, 2));
	          document.getElementById("status-object").innerText = JSON.stringify(res.response, undefined, 2);
	          return callback(res.response);
	       
	    }else {
	      MDS.log("ERROR: executing the petition: "+JSON.stringify(res));
	      callback(false);
	   }
	  });
}


// returns the minima command to execute based on the petition
function build_petiton_command_mmr(petition) {
	var command = "";
	
  	if (petition.command === "coins") {
		command = "coins";
		if (petition.address != undefined) {
			command += " address:" + petition.address;
		}	
		if (petition.coinid != undefined) {
			command += " coinid:" + petition.coinid;
		}	
		if (petition.tokenid != undefined) {
			command += " tokenid:" + petition.tokenid;
		}	
		if (petition.sendable != undefined) {
			command += " sendable:" + petition.sendable;
		}
		if (petition.amount != undefined) {
			command += " amount:" + petition.amount;
		}	
		if (petition.coinage != undefined) {
			command += " coinage:" + petition.coinage;
		}
		if (petition.order != undefined) {
			command += " order:" + petition.order;
		}
		
	} else if (petition.command === "balance"){
		command = "balance";
		if (petition.address != undefined) {
			command += " address:" + petition.address;
		}
		if (petition.tokenid != undefined) {
			command += " tokenid:" + petition.tokenid;
		}
		if (petition.confirmations != undefined) {
			command += " confirmations:" + petition.confirmations;
		}
	}
	
	command += " megammr:true";
	
	if (command.search("coinid") == -1 && command.search("address") == -1 && command.search("tokenid") == -1) {
		command = "ERROR balance / coins commands cannot be allowed without one of following parameters: coinid, address or tokenid";
	} else if (command.search("address") == -1 && command.search("tokenid") != -1 && petition.tokenid == "0x00" && undefined === petition.amount) {
		command = "ERROR tokenid with 0x00 cannot be run without an address given or an amount";
	}
	MDS.log(command);
	
	return command;
}

// returns the minima command to execute based on the petition for an archive node
function build_petiton_command_archive(petition) {
	var command = "";
	
  	if (petition.command === "coins") {
		command = "coins";
		if (petition.address != undefined) {
			command += " address:" + petition.address;
		}	
		if (petition.coinid != undefined) {
			command += " coinid:" + petition.coinid;
		}	
		if (petition.tokenid != undefined) {
			command += " tokenid:" + petition.tokenid;
		}	
		if (petition.sendable != undefined) {
			command += " sendable:" + petition.sendable;
		}
		if (petition.amount != undefined) {
			command += " amount:" + petition.amount;
		}	
		if (petition.coinage != undefined) {
			command += " coinage:" + petition.coinage;
		}
		if (petition.order != undefined) {
			command += " order:" + petition.order;
		}
		
	} else if (petition.command === "balance"){
		command = "balance";
		if (petition.address != undefined) {
			command += " address:" + petition.address;
		}
		if (petition.tokenid != undefined) {
			command += " tokenid:" + petition.tokenid;
		}
		if (petition.confirmations != undefined) {
			command += " confirmations:" + petition.confirmations;
		}
	}
	
	command += " megammr:true";
	
	if (command.search("coinid") == -1 && command.search("address") == -1 && command.search("tokenid")) {
		command = "ERROR balance / coins commands cannot be allowed without one of following parameters: coinid, address or tokenid";
	}
	MDS.log(command);
	
	return command;
}

function send_petiton_results_maxima(petition_obj, results) {
	// if receive an object the petition execution has benn succed
	if (petition_obj instanceof Object) {
		// send the results over maxima to the user
		
		var maxima_user = petition_obj.maxima_address;
		var publickey_maxima_user = petition_obj.maxima_publickey;
		
		var answer_hex_obj = "0x"+utf8ToHex(JSON.stringify(results));
		
		var cmd_maxima = "maxima action:send publickey:"+publickey_maxima_user+" to:"+petition_obj.maxima_address+" application:MMR_network-info-petition-answer data:"+answer_hex_obj;
		  MDS.cmd(cmd_maxima, function(resp) {
		    if (resp.status) {
		      MDS.log("**** Maxima Petition answer sent OK *****");
		      save_petition_DB(petition_obj); 
		    }
		    else{
		      var nodeStatus = JSON.stringify(resp, undefined, 2);
		      document.getElementById("status-object").innerText = nodeStatus;
		      MDS.log("ERROR: Maxima Petiton Results not sended:"+JSON.stringify(resp));
		      // alert("ERROR: Maxima Petition Results answer not sended:"+JSON.stringify(resp));
		    }
		  });
		
	}else {
		MDS.log("ERROR: send_petiton_results_maxima: the petition failed to execute");
	}
}


// Get the maxima info most recent of the miima node and set it on memory
function getMaximaInfo() {
  MDS.log("getMaximaInfo");
  
  MDS.cmd("maxima action:info", function(resp) {
    if (resp.status) {
      //alert("Contact maxima action info!");
      MDS.log("getting MAXIMA info....");
      //MDS.log("Maxima info:"+JSON.stringify(resp.response, undefined, 2));
      MAXIMA.contact = resp.response.contact;
      MAXIMA.publickey = resp.response.publickey;

    }else{
      var nodeStatus = JSON.stringify(resp, undefined, 2);
      MDS.log("ERROR getMaximaInfo() ...."+nodeStatus);
    }
  });
}


function setAddress(){
  MDS.log("setAddress");
  
  MDS.cmd("getaddress", function(resp) {
    if (resp.status) {
      PUBLICKEY_WALLET = resp.response.publickey;
      WALLET_ADDRESS = resp.response.address;
      // var nodeStatus = JSON.stringify(resp.response, undefined, 2);
      // document.getElementById("status-object").innerText = nodeStatus;
    }
  });
}


function setNodeType(){
  MDS.log("setNodeType");
  
  MDS.cmd("megammr", function(resp) {
    if (resp.status) {
      if (true == resp.response.enabled){
		NODE_TYPE = "MMR";
	  } else {
		NODE_TYPE = "ARCHIVE";
	  }
    }
  });
}


function listScriptCoins(){
  MDS.cmd("coins megammr:true address:"+NETWORK_SCRIPT_ADDRESS, function(resp) {
    MDS.log("coins megammr:true address:"+NETWORK_SCRIPT_ADDRESS);
    var result = "";
    if (resp.status) {
      if (resp.response.length == 0) {
		MDS.log("...script address is empty .....");
        document.getElementById("status-object").innerText = "...there are not coins on the script yet  .....\n";
	  } else {
          var nodeStatus = JSON.stringify(resp.response, undefined, 2);
          document.getElementById("status-object").innerText = nodeStatus;
      }
    } else {
		MDS.log("ERROR: listScriptCoins: "+JSON.stringify(sqlmsg));
	}
  });
}



function listPetitionsDB(){
  MDS.sql("SELECT * from petitions order by id DESC", function(sqlmsg){
    if (sqlmsg.status) {
      if (sqlmsg.count == 0){
        MDS.log("...petitions  DB is empty .....");
        document.getElementById("status-object").innerText = "...petitions  DB is empty .....\n";
      }
      else{
        var sqlrows = sqlmsg.rows;
       
        var nodeStatus = JSON.stringify(sqlrows, undefined, 2);
        document.getElementById("status-object").innerText = nodeStatus;
      }
      
    }else {
        MDS.log("ERROR: listPetitionsDB: "+JSON.stringify(sqlmsg));
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
