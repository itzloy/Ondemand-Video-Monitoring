#!/usr/bin/env node
var connect = require('connect');
var serveStatic = require('serve-static');
var puppeteer = require('puppeteer');
var fs = require('fs')


var video_URL = "http://mirrors.standaloneinstaller.com/video-sample/jellyfish-25-mbps-hd-hevc.mp4";
var video_playtime = 30000;

connect().use(serveStatic(__dirname)).listen(8080, function(){
    console.log('Server running on 8080...');
});


fs.readFile("index.html", 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }

  console.log("Set video link to HTML file");
  var result = data.replace(/id='video_url'(\s)+src='.*?'/g, "id='video_url' src='"+video_URL+"'");
  //console.log("result:"+result);  

  fs.writeFile("index.html", result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});


async function run() {
  //const browser = await puppeteer.launch({args: ['--no-sandbox']});
  const browser = await puppeteer.launch({args: ['--no-sandbox','--no-user-gesture-required','--incognito'], executablePath: '/usr/bin/google-chrome'});
  const page = await browser.newPage();
    
    console.log("Load the video URL");
    await page.goto('http://127.0.0.1:8080');
    console.log("Capture first screenshot");
    await page.screenshot({path: 'Step1_A.png'});
    await page.waitFor(60000);
    console.log("Capture second screenshot");
    await page.screenshot({path: 'Step1_B.png'});
    
    console.log("Capture Cookies");
    var allCookies = await page.cookies();

    var metrics = ['VideoAnalyticsViewTime', 'VideoAnalyticsBufferingCounter', 'VideoAnalyticsBufferingTime'];

    for(var i=0; i<metrics.length; i++){
      for (var j=0; j<allCookies.length; j++) {
        if(metrics[i]==allCookies[j].name){
          console.log(metrics[i]+": "+allCookies[j].value);
          break;
        }
        if (j==allCookies.length-1) {
          console.log(metrics[i]+": 0");
        }
      }
      console.log("i: "+i);
    }

    console.log("allCookies values:"+JSON.stringify(allCookies))

    await page.waitFor(1000);

    await browser.close();

    process.exit();

}
run();

