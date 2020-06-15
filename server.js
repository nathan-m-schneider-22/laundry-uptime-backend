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

const URL = process.env.DB_URL
const DB = process.env.DB_NAME


var MongoClient = require('mongodb').MongoClient;


app.get('/data', (req,res) => {
    MongoClient.connect(URL, function(err, db) {
        if(err) { return console.dir(err); }
        dbo = db.db(DB) 
        var query = {};
        dbo.collection("scraped").find(query).toArray(function(err, result) {
          if (err) throw err;
          res.send(result)
          db.close();
        });
    })        
})

app.get('/', (req, res) => {
  console.log("pinged")
    res.send("Use /data for data")

})


var j = schedule.scheduleJob('*/5 * * * *', function(){
    scrapeData().then((data) => {
        MongoClient.connect(URL, function(err, db) {
          if (err) throw err;
          var dbo = db.db(DB);

          dbo.collection("scraped").insertOne(data, function(err, res) {
            if (err) throw err;
            console.log("document inserted");
            db.close();
          });
      
        })
    })

    //Self request to prevent the heroku app from going to sleep
    request('https://laundry-uptime.herokuapp.com/', { json: true }, (err, res, body) => {
      if (err) { return console.log(err); }
      console.log("Self-call")

    });


  });

  

function scrapeData(){
    console.log("Scraping data")
    return new Promise((resolve, reject) => {
    const url = "https://proxybot.io/api/v1/JF33bQx0Xeb8ZHdr8fgovyZ82d13?render_js=true&url=https://www.peoplecount.live/embed/TqbMydvq_/oKbsHvaFb/__master__"
    request(url, function (error, response, body) {
        if (!error) {
            //Find specific CSS tag position in HTML
            i = body.indexOf("count regular")
            //Retrive one or two digits from the correct position
            count = parseInt(body.slice(i+15,i+17).replace("<",""))

            data ={
              time:Date.now(),
              count:count
            }
            console.log(data)
            resolve(data)
        } else {
        reject(error);
        }
    })

  });

}

app.use(function(err, req, res, next){
    res.status(400).json(err)
  })

app.listen(port, () => console.log(`API Server listening on port ${port}!`))


