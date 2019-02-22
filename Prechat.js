var mysql = require('mysql');
var express = require('express');
var app = express();
var http = require('http');
var fs = require('fs');
var url = require('url');
var fileUpload = require('express-fileupload');
var multipart = require('connect-multiparty');
var path = require('path');
//var busboy = require("then-busboy");


var con = mysql.createConnection({
	host: '192.168.2.3',
	user: 'testmysql',
	password: 'test123',
	database: 'prechat'
});
con.connect(function (err) {
	if (err) {
		console.log("Error in connecting DB" + err);
		return;
	}
	console.log("Connection Estabilished");
});

app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);
	// Pass to next layer of middleware
	next();
});
app.use(fileUpload());




app.get("/logincheck", function (req, res) {
	var UserName = req.query.UserName;
	var Password = req.query.Password;
	con.query("SELECT * FROM `ch_userregistration` WHERE UserName='" + UserName + "' AND Password='" + Password + "' AND UserStatus='Y' AND UserType = 'User' ", function (err, result) {
		if (err) {
			throw err;
		} else if (result.length > 0) {
			res.json({ "Status": 200, "Message": "Login Success", "Response": result });
			res.end();
		} else {
			res.json({ "Status": 400, "Message": "Login Failed", "Response": result });
			res.end();
		}
	});
});

app.get("/ListOfUsers", function (req, res) {
	var ReciverId = req.query.ReciverId;
	//con.query("SELECT * FROM `ch_userregistration` WHERE UserType='User'",function(err,result){
	con.query("SELECT  a.*,COUNT(b.Message) AS `Count` FROM ch_userregistration a LEFT JOIN ch_singleconversation b  ON   b.ReceiverId = '" + ReciverId + "' AND b.MsgStatus = 'Y' AND a.UserId = b.SenderId GROUP  BY a.UserId, a.UserName,a.UserPhoto,A.LastSeen ORDER BY Count DESC", function (err, result) {
		if (err) {
			throw err;
		} else if (result.length > 0) {
			res.json({ "Status": 200, "Message": "User List", "Response": result });
			res.end();
		} else {
			res.json({ "Status": 400, "Message": "User List", "Response": result });
			res.end();
		}
	});
});
app.get("/GetPerticularMsg", function (req, res) {
	var SenderId = req.query.SenderId;
	var ReciverId = req.query.ReciverId;
	con.query("SELECT * FROM `ch_singleconversation` WHERE (SenderId='" + SenderId + "' && ReceiverId='" + ReciverId + "') || (SenderId='" + ReciverId + "' && ReceiverId='" + SenderId + "')", function (err, result) {
		if (err) {
			throw err;
		} else if (result.length > 0) {
			res.json({ "Status": 200, "Message": "List Of Messages", "Response": result });
			res.end();
		} else {
			res.json({ "Status": 400, "Message": "Message Failed", "Response": result });
			res.end();
		}
	});
});
app.get("/UpdatePerticularMsgStatus", function (req, res) {
	var SenderId = req.query.SenderId;
	var ReciverId = req.query.ReciverId;
	//con.query("UPDATE `ch_singleconversation` SET `MsgStatus`='V' WHERE (SenderId='"+SenderId+"' && ReceiverId='"+ReciverId+"') || (SenderId='"+ReciverId+"' && ReceiverId='"+SenderId+"')",function(err,result){
	con.query("UPDATE `ch_singleconversation` SET `MsgStatus`='V' WHERE (SenderId='" + ReciverId + "' && ReceiverId='" + SenderId + "')", function (err, result) {
		if (err) {
			throw err;
		} else if (result.affectedRows > 0) {
			res.json({ "Status": 200, "Message": "Message Status", "Response": result });
			res.end();
		} else {
			res.json({ "Status": 400, "Message": "Failed to Update Message Status", "Response": result });
			res.end();
		}
	});
});
app.post("/SendPerticularMsg", function (req, res) {



	var SenderId = req.query.SenderId;
	var ReceiverId = req.query.ReceiverId;
	var SenderName = req.query.SenderName;
	var ReceiverName = req.query.ReceiverName;
	var Type = "sender";
	var Message = req.query.Message || null;
	var SenderMessage = 'UD';
	var ReceiverMessage = 'UN';
	var temp = Date();
	var SentTime = temp.toString().split(" ")[4];
	var MsgStatus = 'Y';
	var SendThrough = 'Web';
	var CreatedBy = req.query.SenderName;
	//console.log(req.files);
	if (req.files != null) {
		var file = req.files.uploaded_image;
		var img_name = file.name;
		var DocAttachment = "assets/API/Prechat/imagess/" + img_name;

		//console.log(req.files.uploaded_image);
		file.mv('./imagess/' + img_name, function (err) {
			if (err) throw err;
			con.query("INSERT INTO `ch_singleconversation`(`SenderId`, `ReceiverId`, `SenderName`, `ReceiverName`,`DocAttachment`, `Message`, `SenderMessage`, `ReceiverMessage`, `SentTime`, `Type`, `MsgStatus`, `SendThrough`, `CreatedBy`) VALUES ('" + SenderId + "','" + ReceiverId + "','" + SenderName + "','" + ReceiverName + "','" + DocAttachment + "','" + Message + "','" + SenderMessage + "','" + ReceiverMessage + "','" + SentTime + "','" + Type + "','" + MsgStatus + "','" + SendThrough + "','" + CreatedBy + "')", function (err, result) {
				if (err) {
					throw err;
				} else {
					res.json({ "Status": 200, "Message": "Message Send successfully", "Response": result });
					res.end();
				}
			});
		});
	} else {
		con.query("INSERT INTO `ch_singleconversation`(`SenderId`, `ReceiverId`, `SenderName`, `ReceiverName`, `Message`, `SenderMessage`, `ReceiverMessage`, `SentTime`, `Type`, `MsgStatus`, `SendThrough`, `CreatedBy`) VALUES ('" + SenderId + "','" + ReceiverId + "','" + SenderName + "','" + ReceiverName + "','" + Message + "','" + SenderMessage + "','" + ReceiverMessage + "','" + SentTime + "','" + Type + "','" + MsgStatus + "','" + SendThrough + "','" + CreatedBy + "')", function (err, result) {
			if (err) {
				throw err;
			} else {
				res.json({ "Status": 200, "Message": "Message Send successfully", "Response": result });
				res.end();
			}
		});
	}


});

app.get("/DeleteChat", function (req, res) {
	var SenderId = req.query.SenderId;
	var ReciverId = req.query.ReciverId;

	con.query("DELETE FROM `ch_singleconversation` WHERE (SenderId='" + SenderId + "' && ReceiverId='" + ReciverId + "')|| (SenderId='" + ReciverId + "' && ReceiverId='" + SenderId + "')", function (err, result) {
		if (err) {
			throw err;
		} else if (result.affectedRows > 0) {
			res.json({ "Status": 200, "Message": "Chat Deleted", "Response": result });
			res.end();
		} else {
			res.json({ "Status": 400, "Message": "Chat Delete Failed", "Response": result });
			res.end();
		}
	});
});

// 

var con_test = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '12345',
	database: 'tfs'
});
con_test.connect(function (err) {
	if (err) {
		console.log("Error in connecting DB" + err);
		return;
	}

	console.log("Connection Estabilished in 192.168.1.45");

});

app.get('/joinresponsegot', (req, res) => {
	con_test.query('SELECT * FROM `projectlist`', (err, result) => {
		if (err) throw err;
		for (var i = 0; i < result.length; i++) {
			responseprint(res, result[i], result[i].ProjectId, i, result.length);
		}
	});
});
var arraytest = [];
function responseprint(res, arr, ProjectId, i, templength) {
	if (i === 0) {
		arraytest = [];
	}
	var tempobj = arr;
	con_test.query('SELECT * FROM `taskdetails` WHERE ProjectId="' + ProjectId + '" ', (err, output) => {
		if (err) throw err;
		tempobj.taskdetails = output;
		arraytest.push(tempobj)
		if (i === (templength - 1)) {
			res.json({ StatusCode: 200, Response: arraytest })
		}

	});
}


// Local Connection


var localcon = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '12345',
	database: 'oauth'
});
localcon.connect(function (err) {
	if (err) {
		console.log("Error in connecting DB" + err);
		return;
	}
	console.log("Connection Estabilished" + localcon);
});

// Image to binary
app.post('/imagetobinary', (req, res) => {
	let binaryimage = req.files.binaryimage;
	let temp = new Buffer(binaryimage.data, binaryimage.data.length)
	localcon.query('INSERT INTO `imagetobytearray` SET `Bytearray`= ? ', temp, (err, result) => {
		if (err) {
			res.json({ StatusCode: 400, Description: err })
		} else {
			res.json({ StatusCode: 200, Message: result });
		}
	});
});

app.get('/getimg', (req, res) => {
	localcon.query('SELECT * FROM `imagetobytearray`', (err, result) => {
		if (err) {
			res.json({ StatusCode: 400, Description: err })
		} else {
			res.json({ StatusCode: 200, Response: result })
		}
	});
});



// 
var ConAndroid = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '12345',
	database: 'tracking'
});
ConAndroid.connect(function (err) {
	if (err) {
		console.log("Error in connecting DB" + err);
		return;
	}
	console.log("Connection Estabilished");
});

app.get("/colbacktest", (req, res) => {
	tempfun(function (response) {
		res.json({ response });
	});
});

var tempfun = (cb) => {
	cb("Hello");
}


app.get('/InsertAndroidDevice', (req, res) => {
	let lat = req.query.lat;
	let lan = req.query.lan;
	ConAndroid.query("INSERT INTO `location`(`Lat`, `Lan`) VALUES (" + lat + "," + lan + ")", (err, result) => {
		if (err) {
			res.json({ StatusCode: 400, Description: err })
		} else {
			res.json({ StatusCode: 200, Message: "Succes", Details: result });
		}
	});
});



app.listen(8000);
app.listen(process.env.PORT)
console.log("Sever Listen 8000");


