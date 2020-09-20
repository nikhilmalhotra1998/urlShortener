'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser=require('body-parser')
var cors = require('cors');
var autoIncrement = require('mongoose-auto-increment');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;
const uri=process.env.MONGO_URL;
mongoose.connect(uri,{
  useNewUrlParser: true,
  useUnifiedTopology:true,
  serverSelectionTimeoutMS:5000});


autoIncrement.initialize(mongoose);

const connection=mongoose.connection;
connection.on('error', console.error.bind(console,'connection error:'));
connection.once('open',()=>{
  console.log("Mongo connected successfully");
})

const Schema= mongoose.Schema;
const urlSchema=new Schema({
  original_url:String,
  short_url:Number
})

urlSchema.plugin(autoIncrement.plugin, {
    model: 'urlShort',
    field: 'short_url',
    startAt: 1
});

const urlShort=mongoose.model("urlShort",urlSchema);
/** this project needs a db !! **/ 
// mongoose.connect(process.env.DB_URI);
app.use(bodyParser.urlencoded({
  extended:false
}))
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const validUrlChecker=/(^(https?:\/\/(?:www\.|(?!www)))?[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/

app.post("/api/shorturl/new",  function(req,res){
  var urlBody=req.body.url;
  
  if(!validUrlChecker.test(urlBody)) {
    console.log(urlBody);
    res.json({"error":"invalid URL"});
  }
  else{
    try{
      urlShort.findOne({original_url:urlBody},function(err, doc){
      if(doc!==null){
        res.json({
          original_url:doc.original_url,
          short_url:doc.short_url
        });
      }
      else{
        let newUrl=new urlShort({
          original_url:urlBody
        })
        newUrl.save(function(err, data){
        newUrl.nextCount(function(err, count) {
      let shortUrl = count - 1;
      res.send({"original_url": urlBody, "short_url": shortUrl});
    });
      });
      }
      })
    }
    catch(err){
      console.error(err)
      res.status(500).json({"reason":"Server Error"})
    }
    }
   });
  
var httpchecker=/^(http:\/\/|https:\/\/){1}[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm
var redirectUrl;
app.get("/api/shorturl/:num", function(req,res,next){

  let num=req.params.num;
    urlShort.findOne({short_url:num},function(err, doc){
    if(err){
       console.log("not found");
       res.status(404).json({"reason":"No Url Found"})
    }
    else{
      redirectUrl = doc.original_url;   
      if(!httpchecker.test(redirectUrl)){
        redirectUrl="https:\/\/"+redirectUrl;
      }
      next();
  }
    });
}, function(req, res){
  try{
    res.redirect(redirectUrl);
  } catch(err){
console.error(err)
      res.status(500).json({"reason":"Server Error"})
  }
});





app.listen(port, function () {
  console.log('Node.js listening ...');
});