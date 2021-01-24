const express=require('express');
const app=express();
console.log("Express Acquired");

const body=require('body-parser');
const url=body.urlencoded({extended:false});
console.log("Url Service Required");

const mongoose=require('mongoose');
mongoose.connect('mongodb://localhost:27017/chat',{
	urlencoded:true,
	useNewUrlParser:true,
	useUnifiedTopology:true,
	useFindAndModify:false
});
console.log("Database Connected");

const schema = mongoose.Schema;
const ObjectId=schema.ObjectId;

require("dotenv").config();

var _ = require('lodash');
var JSAlert = require("js-alert");
const ejsLint = require('ejs-lint');

const userbase= new schema({
	username:String,
	password:String
});

const usermodel=mongoose.model("user",userbase);

const messagebase= new schema({
	from:ObjectId,
	message:String,
	to:ObjectId
});

const messagemodel=mongoose.model("message",messagebase);

const connectbase= new schema({
	user:ObjectId,
	username:String,
	connect:String,
	connectedName:String,
	to:ObjectId,
});

const connectmodel=mongoose.model("connect",connectbase);

app.set('view engine','ejs');

var publicDir = require('path').join(__dirname, '/stuff');
app.use(express.static(publicDir));

app.use('/stuff', express.static('stuff'))

app.get('/',(req,res)=>{
	var number;
	usermodel.find({},(err,docs)=>{
		if(err){
			console.log(err);
		}
		if(_.isEmpty(docs)){
			number=0;
			res.render('login',{number:number,info:null});
		}
		else{
			number=docs.length;
			res.render('login',{number:number,info:null});
		}
	})
})

app.post('/',url,(req,res)=>{
	var username=req.body.username;
	var password=req.body.password;
	usermodel.find({username:username},(err,doc)=>{
		if(err){
			console.log(err);
		}
		if(_.isEmpty(doc)){
			var newuser= new usermodel();
			newuser.username=username;
			newuser.password=password;
			newuser.save((err)=>{
				if(err){
					console.log(err);
				}
				else{
					res.redirect('/chat/'+newuser._id);
				}
			});
		}
		else{
			if(doc[0].password==password){
				res.redirect('/chat/'+doc[0]._id);
			}
			else{
				res.render('login',{info:"This Username has been taken, please try anything else"});
			}
		}
	});
});

app.get('/chat/:_id',(req,res)=>{
	res.render('index',{connectname:null,messages:null});
});

app.post('/chat/:_id',url,(req,res)=>{
	var id=req.params._id;
	var username;
	var reciever;
	var recieverName;
		usermodel.find({_id:id},(err,docs)=>{
		if(err){
			console.log(err);
		}
		else{
			username=docs[0].username;
		}
	});
	

	if(req.body.connect){
		if(id!=null){
			connectmodel.find({user:id},(err,doc)=>{
			if(err){
				console.log(err);
			}
			if(_.isEmpty(doc)){
				var newconnect= new connectmodel();
				newconnect.user=id;
				newconnect.username=username;
				newconnect.connect="Searching";
				newconnect.connectedName=null;
				newconnect.to=null;
				newconnect.save((err)=>{
					if(err){
						console.log(err);
					}
				});
			}
		});
	}
	else{
		JSAlert.alert("You are already connected to a user");
	}
		
		setTimeout(()=>{
			connectmodel.find({
				$and:[
					{user:{$ne:id}},
					{connect:{$ne:"connected"}}
					]
				},(err,docs)=>{
			if(err){
				console.log(err);
			}
			if(_.isEmpty(docs)){
				reciever=null;
				res.render('index',{connectname:null,messages:null});
			}
			else{
				var length=docs.length;
				var limit=Math.random()*(length-0)+0;
				reciever=docs[Math.floor(limit)].user;
				recieverName=docs[Math.floor(limit)].username;
			}
		});
		},2000);

		setTimeout(()=>{
			if(reciever!=null){
			connectmodel.findOneAndUpdate({user:id},{"$set":{
			"connect":"connected",
			"connectedName":recieverName,
			"to":reciever
			}},(err,doces)=>{
			if(err){
				console.log(err);
			}
			res.redirect('/chatterbox/'+id);
			});
		}
		else{
			res.render('index',{connectname:null,messages:null});
		}
		},3000);
	}

	if(req.body.disconnect){
		var id=req.params._id;
		connectmodel.findOneAndRemove({user:id},(err)=>{});
		connectmodel.findOneAndRemove({to:id},(err)=>{});
		messagemodel.deleteMany({from:id},(err)=>{if(err){console.log(err)}});
		messagemodel.deleteMany({to:id},(err)=>{if(err){console.log(err)}});
		res.redirect('/chat/'+id);
	}
	if(req.body.logout){	
		usermodel.findOneAndRemove({_id:id},(err)=>{});
		messagemodel.deleteMany({from:id},(err)=>{if(err){console.log(err)}});
		messagemodel.deleteMany({to:id},(err)=>{if(err){console.log(err)}});
		res.redirect('/');
	}

});

app.get('/chatterbox/:_id',(req,res)=>{
	var connectname;
	var messages;
		var ide=req.params._id;
		connectmodel.find({user:ide},(err,docs)=>{
			if(err){
				console.log(err);
			}
			if(_.isEmpty(docs)){
				connectname=null;
				messages=null;
				res.render('index',{connectname:connectname,messages:messages});
			}
			else{
				connectname=docs;
				messagemodel.find({
				$or:[
				{from:docs[0].user},
				{to:docs[0].user}
				]},(err,docss)=>{
				if(err){
					console.log(err);
				}
				if(!_.isEmpty(docss)){
					messages=docss;
					res.render('index',{connectname:connectname,messages:messages});
				}
				else{
					messages=null;
					res.render('index',{connectname:connectname,messages:messages});
				}
			});
		};
	});
});

app.post('/chatterbox/:_id',url,(req,res)=>{
	if(req.body.Send){
		var ide=req.params._id;
		var userid;
		var recid;
		connectmodel.find({user:ide},(err,docs)=>{
			if(err){
				console.log(err);
			}
			userid=docs[0].user;
			recid=docs[0].to;
			var message=req.body.message;
			var newmessage=new messagemodel();
			newmessage.from=userid;
			newmessage.message=message;
			newmessage.to=recid;
			newmessage.save((err)=>{
				if(err){
					console.log(err);
				}
			});
		res.redirect('/chatterbox/'+ide);
		});
	}

	if(req.body.disconnect){
		var id=req.params._id;
		connectmodel.findOneAndRemove({user:id},(err)=>{});
		connectmodel.findOneAndRemove({to:id},(err)=>{});
		messagemodel.deleteMany({from:id},(err)=>{if(err){console.log(err)}});
		messagemodel.deleteMany({to:id},(err)=>{if(err){console.log(err)}});
		res.redirect('/chat/'+id);
	}

	if(req.body.logout){	
		var id=req.params._id;
		usermodel.findOneAndRemove({_id:id},(err)=>{});
		connectmodel.findOneAndRemove({user:id},(err)=>{});
		connectmodel.findOneAndRemove({to:id},(err)=>{});
		messagemodel.deleteMany({from:id},(err)=>{if(err){console.log(err)}});
		messagemodel.deleteMany({to:id},(err)=>{if(err){console.log(err)}});
		res.redirect('/');
	}

});

const listener = app.listen(process.env.PORT || 3000,()=>{
  console.log("Your app is listening on port " + listener.address().port);
});