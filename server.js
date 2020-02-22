const express = require('express')
const bodyParser = require('body-parser')

const app = express()
require("dotenv").config()
const port = process.env.PORT || 9090
var schedule = require('node-schedule');
var request = require("request");


app.use(bodyParser.json())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
const URL = "mongodb://root:sv165030@ds155278.mlab.com:55278/heroku_t6wsbg17"
const DB = "heroku_t6wsbg17"


var MongoClient = require('mongodb').MongoClient;

// Connect to the db



app.get('/data', (req,res) => {
    MongoClient.connect(URL, function(err, db) {
        if(err) { return console.dir(err); }
        dbo = db.db(DB) 
        var query = {};
        dbo.collection("scraped").find(query).toArray(function(err, result) {
          if (err) throw err;
          console.log(result);
          res.send(result)
          db.close();
        });
      
    })        

})

app.get('/', (req, res) => {
  console.log("pinged")
    res.send({"message" :"This API is not for getting"})

})

app.post('/data', (req,res) => {

    res.send({message:"Dont's send data"})

});

var j = schedule.scheduleJob('*/5 * * * *', function(){
    const time = Date.now()
    scrapeData().then((data) => {
        MongoClient.connect(URL, function(err, db) {
          if (err) throw err;
          var dbo = db.db(DB);
          for (i=0;i<data.length;i++){data[i].time = time}

          dbo.collection("scraped").insertMany(data, function(err, res) {
            if (err) throw err;
            console.log(data[0])
            console.log("documents inserted");
            db.close();
          });
      
        })
    })

    request('https://laundry-uptime.herokuapp.com/', { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      console.log("Self-call")
      console.log(body);

    });


  });

  
var htmlparser = require("htmlparser2");

function scrapeData(){
    console.log("Scraping data")
    const https = require('https');
    var p1 = new Promise((resolve, reject) => {

      // or
      // reject(new Error("Error!"));
      
    
    request("https://m.dartmouth.edu/laundryview/index/", function (error, response, body) {
        if (!error) {
            var ar = []
            data ={}
            var parser = new htmlparser.Parser({

                ontext: function(text){

                  ar.push(text)
                }
              }, {decodeEntities: true});
              parser.write(body);
              parser.end();
              var i =0
              valid_times = []

              while (i<ar.length ){

                if (ar[i].length < 100 && ar[i].includes("available")) {
                    valid_times.push({
                        "building":ar[i-1],
                        "washers":ar[i].substring(0,ar[i].length-17),
                        "dryers":ar[i+1].substring(0,ar[i+1].length-16)
                    })
                    i+=2
                }
                i++;
              }

              

              resolve( valid_times)
        } else {
        console.log(error);
        }
    })

  });
  return p1

}


/**
 * Simple Error Handling
 */
app.use(function(err, req, res, next){
    res.status(400).json(err)
  })

/**
 * Port listening, on localhost
 */
app.listen(port, () => console.log(`API Server listening on port ${port}!`))


