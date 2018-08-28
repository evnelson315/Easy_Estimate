// Dependencies
// =============================================================
var express = require('express');
var extend = require('node.extend');
var bodyParser = require('body-parser');
var path = require('path');
var $ = require("jquery");
var mysql = require('mysql');
// var connection = mysql.createConnection({
//     host: "localhost",
//     port: 8889,
//     user: "root", //Your username
//     password: "root", //Your password
//     database: "estimate_DB"
// })


 
// connection.connect(function(err) {
//     if (err) throw err;
//     console.log("connected as id " + connection.threadId);
// })

// Sets up the Express App
// =============================================================
var app = express();
var PORT = process.env.PORT || 3000;

// Sets up the Express app to handle data parsing 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.use("/assets", express.static('assets'));  
app.use(bodyParser.json({type:'application/vnd.api+json'}));

// (DATA)
// =============================================================
var quotes = [
]

// Routes
// =============================================================

// Basic route that sends the user first to the AJAX Page
app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, 'view.html'));
})



app.get('/new', function(req, res){
	res.sendFile(path.join(__dirname, 'new.html'));
})

app.get('/setup', function(req, res){
	res.sendFile(path.join(__dirname, 'setup.html'));
})

app.get('/about', function(req, res){
	res.sendFile(path.join(__dirname, 'about.html'));
})

app.get('/change', function(req, res){
	res.sendFile(path.join(__dirname, 'change.html'));
})

app.get('/help', function(req, res){
	res.sendFile(path.join(__dirname, 'help.html'));
})
app.get('/complete', function(req, res){
	res.sendFile(path.join(__dirname, 'complete.html'));
})

// api/noun/verb
// api / What are you accessing / what are you doing with it
app.get('/api/all/:quotes?', function(req, res){

	var chosen = req.params.quotes;
	
	if(chosen){

		for (var i=0; i <quotes.length; i++){

			if (chosen == quotes[i].newEst.routeName){
				res.json(quotes[i]);
				return;
			}
		}

		res.json(false);
	}

	else{
		res.json(quotes);
	}
})

app.get('/api/:quotes?', function(req, res){

	var chosen = req.params.quotes;
	
	if (quotes.length > 0) {
		switch (chosen) {
			case 'latest':
				// get the latest quote
				res.json(quotes[quotes.length - 1]);
				break;
			case 'all':
				// no quotes defined - return all
				res.json(quotes);
				break;
			default:
				res.json({error: 'API parameter not defined'});
		}
	} else {
		res.json({error: 'There are no parts in the quotes array'});
	}
})

//===========================================================
//adding part number//
app.post('/api/new', function(req, res){

	var newEst= req.body;
	newEst.routeName = newEst.partNumber;

	// console.log(newEst);
	// console.log(newEst.partNumber);
	// console.log(newEst.partRev);
	// console.log(newEst.partQty);
	// console.log(newEst.material);
	// console.log(newEst.thickness);
	// console.log(newEst.partWidth);
	// console.log(newEst.partLength);
	// console.log(newEst.sheetWidth);
	// console.log(newEst.sheetLength);
	// console.log(newEst.numHoles);
	// console.log(newEst.HoleDia);
	// console.log(newEst.outlineLength);
	// console.log(newEst.cutoutLength);
	// console.log(newEst.numBends);
	// console.log(newEst.weldInches);
	// console.log(newEst.grindInches);
	// console.log(newEst.Finish);
	// console.log(newEst.Hardware);
	// console.log(newEst.hardwareQty);
	//console.log(newEst.margin);


	var partSize = newEst.partWidth * newEst.partLength;
	var sheetSize = newEst.sheetWidth * newEst.sheetLength;
	var partsPerSheet = sheetSize/partSize;
	var partVol = (newEst.thickness * newEst.partLength) *newEst.partWidth;
	var materialCost = partVol * newEst.material;

	var HoleDia = parseFloat(newEst.HoleDia);
	var lineLength = parseFloat(newEst.outlineLength);
	var cutoutLength = parseFloat(newEst.cutoutLength);
	var numHoles = parseFloat(newEst.numHoles);
	
	
	var surfaceArea1 = function(a,b,c){return (2* (b*c)) + (2*(a*c)) + (2*(a*b))};
	var surfaceArea = surfaceArea1(newEst.thickness, newEst.partWidth, newEst.partLength);

	// console.log(surfaceArea);
	// console.log(newEst.Finish);
	// console.log(partSize);
	// console.log(sheetSize);
	// console.log(partsPerSheet);
	// console.log(partVol);
	// console.log(partCost);
	// console.log(newEst.material);
	// console.log(holeDia);

	var partNumber =newEst.partNumber;
	var Rev = newEst.partRev;
	var qty = newEst.partQty;
	var totCost;


	var laserSet = 60;

	//============laserRun gives length of all laser work=================
	var laserRun1 = function (a, b, c, d) {return a * 3.14 * b + c + d};
	var laserRun = laserRun1(HoleDia, numHoles, lineLength, cutoutLength);
	//=============laserRunCost multiplies cost by length of laser cut======
	laserRunCost = laserRun * .75;


	//=============laserFin1 ammortizes part cost, qty and setup time========
	var laserFin = function(a,b,c){return ((a * b) + c) / b};
	var laserFin1 = laserFin(laserRunCost, newEst.partQty, laserSet);
	//don't forget to add load and unload time;
	// var comboRun = (newEst.HoleDia) + (newEst.outlineLength);
	// newEst.Drilledholes + newEst.outlineLength + newEst.cutoutLength;
	//var comboRun = time to cut all shapes in part

	//function takes in parameters of:
	//length of perimeter cut. 
	//number holes
	//diameter of holes
	// var brakeSet;

	var breakSet = 60;
	//function takes in parameters of how many bends
	// var brakeRun;
	//function takes in parameters of number of bends
	var brakepartCost = newEst.numBends * .75;
	// var brakeFin = ((brakepartCost * newEst.partQty )+ brakeSet) / newEst.partQty;

	var brakeFin = function(a,b,c){return ((a * b) + c) / b};
	var brakeFin1 = brakeFin(brakepartCost, newEst.partQty, breakSet);


	var detailSet;
	//
	var detailRun;
	//function takes in parameters of length of perimeter cut.
	//number of holes
	//diameter of holes
	var weldSet = 60;

	var weldRun = function(a){return a};
	var weldRun1 = weldRun( newEst.weldInches);
	//hardcode for 1hr
	var weldTot = function(a,b,c){return ((a * b) + c) / b};
	var weldTot1 = weldTot( weldRun1, newEst.partQty, weldSet);
	// var weldRun;
	//function takes in parameters of length of weld.
	
	var detailSet = 15;

	var detailRun = function(a,b){return ((a * b) + 10)};
	var detailRun1 = detailRun(newEst.grindInches, .5);
	var detailPartCost = detailRun1 * .075;
	var detailtot = function(a,b,c){return ((a * b) + c) / b};
	var detailtot1 = detailtot( detailPartCost, newEst.partQty, detailSet);

	var finishCost = surfaceArea * newEst.Finish;
	var totalQtyfinishCost = finishCost * newEst.partQty;
	//totalFinCost:
	//if totalQtyfinishCost < minFin then FinCost  = 65;
	//else FinCost = totalQtyfinishCost;
	// console.log(surfaceArea * newEst.Finish + "this is part finish cost");


	// var minimum cost
	// if part qty * fin cost < minFin 
	// final finish cost is minfin 
	// else final finish cost = part qty x finish cost.
		if (newEst.partQty * newEst.Finish < newEst.minFin) {
        	totalQtyfinishCost = newEst.minFin;
    	} 
    	else {
        	totalQtyfinishCost = finishCost * newEst.partQty;
    	};


	var hardwareSet = 11.25;

	// var hardwareRun1 = function (a, b, c) {return a * b};
	// var hardwareRun = hardwareSet1(newEst.Hardware, newEst.hardwareQty, 45);
	//takes in parameter of hardware type
	//var hardwareRun;
	//var hardwareRun = function (1, 2) {return a * b};
	
	var HARDWARE = function (a, b) {return a * b};
	var x = HARDWARE(newEst.Hardware, newEst.hardwareQty);
	//takes in parameters of hardware type and
	//qty of hardware
	var hdwInstall = function (a, b){return a * b};
	var hdwInstall1 = hdwInstall( newEst.hardwareQty, 1.5);
	//takes in parameters of hardware qty and time to install
	var installpluscost = function(a,b){return a * b};
	var installpluscost1 = installpluscost(x, hdwInstall1);
	console.log(x +"this is x");

	var hdwTot = function( a, b, c){return ((a * b) + c) / b};
	var hdwtot1 = hdwTot( installpluscost1, newEst.partQty, hardwareSet);

	var enCost = newEst.enHours * 60;
	console.log(enCost = "this is enCost");
	var enPartPrice = function( a, b, c){return ((a * b) / c)};
	var enPartPrice1 = enPartPrice(newEst.enHours, 60, newEst.partQty); 
	console.log(newEst.enHours + "is this fucked?")


	var profitMargin = newEst.margin;
	var marginMultiplyer = ((100- profitMargin)/100); 



	var totalFINcost = materialCost + laserFin1 + brakeFin1 + weldTot1 + detailtot1 + hdwtot1 + enPartPrice1;

	var totalMarginpartcost = totalFINcost/marginMultiplyer;

	var totalJobCost = (totalFINcost * qty);

	var totalMarginJobCost = totalJobCost/marginMultiplyer;

	//===================STANDARD REQUIRED PART INFO======================
	console.log(partNumber);
	console.log(Rev);
	console.log(qty);
	console.log("$" + materialCost + " in material cost");
	//===================LASER PRICING ====================================
	console.log("$" + laserSet+ " cost to setup laser");
	console.log("$" + laserRunCost + " cost of cut time");
	console.log("$" + laserFin1 + " laser work center cost per part");
	//===================BRAKE PRESS PRICING ==============================
	console.log("$"+breakSet + " cost of setting up press-brake")
	console.log("$" +brakepartCost + " cost of bends");
	console.log("$" + brakeFin1 +" press brake work center cost per part");
	//===================WELD PRICING=======================================
	console.log("$" + weldRun1 + " cost to weld one part");
	console.log("$" + weldTot1 + " cost of welding work center per part");
	//==================== DETAIL PRICING ================================
	console.log(detailSet + " detail setup time");
	console.log("$" + detailPartCost + " cost of detailing per part");
	console.log("$" + detailtot1 + " total detailing cost per part");
	//============================FINISH PRICING================================
	console.log(surfaceArea);
	console.log(newEst.Finish);
	console.log(qty);
	console.log("$" + finishCost + " finish cost per part");
	console.log("$" + totalQtyfinishCost + " finishing cost for entire job");
	// console.log(totalQtyCost + " total finishing cost for entire job");
	//===========================HARDWARE INSTALLATION==========================
	console.log("$" + hardwareSet + " cost to setup hardware work center");
	console.log("$" + x + " hardware cost per part");
	console.log("$" + hdwInstall1 + " cost to install on part");
	console.log("$" + installpluscost1 + " cost to install plus cost of hardware");
	console.log("$" + hdwtot1 + " cost to install on part plus hardware plus setup");
	//=========================ENGINEERING COSTS================================
	console.log("$" + enCost + " cost of engineering");
	console.log("$" + enPartPrice1 + " <-- fucked up cost of engineering cost per part");
	//=======================Profit Margin========================================
	console.log(profitMargin + " this is the profit Margin");
	console.log(marginMultiplyer);
	//========================TOTAL JOB COSTS=====================================
	console.log("$" + totalMarginpartcost + " Final cost per part for qty of: " + qty);
	console.log("$" + totalMarginJobCost + " Cost of total job");
	var partRoundedcost = totalMarginpartcost.toFixed(2);
	var totalRoundedjob = totalMarginJobCost.toFixed(2);
	

	var input = { newEst };
	var partPrice = {partRoundedcost };
	var totPrice = { totalRoundedjob};
	entireThing = extend(input, partPrice, totPrice);
	quotes.push(entireThing);
	// console.log("ok here");
	res.json(entireThing);
	// console.log('here too');
})


// =============================================================
app.listen(PORT, function(){
	console.log('App listening on PORT ' + PORT);
})