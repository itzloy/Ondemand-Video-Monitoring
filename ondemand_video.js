#!/usr/bin/env node
var connect = require('connect');
var serveStatic = require('serve-static');
var puppeteer = require('puppeteer');
var fs = require('fs')

// Accept video URL and video play time from user
var video_URL = process.env.CP_UNSAFE_VAR_Video_URL;
var video_playtime = process.env.CP_UNSAFE_VAR_Video_Playtime;

// Check for playtime to be less than 30000
if(video_playtime>90000 || video_playtime<30000){
    console.log('video view time should be between 45000 ms to 90000 ms.');
    console.log("Availability: 0");
    process.exit();
}

// Check if the video type is supported.
var video_format = video_URL.match(/(?!.*\.)(.*)/g);
if(video_format[0]!='mp4' && video_format[0]!='webm' && video_format[0]!='m4v' && video_format[0]!='mkv' && video_format[0]!='mov'){
    console.log("video format:"+video_format[0]);
    console.log("Please use one of the supported video formats [mp4, webm, m4v, mkv and mov]");
    console.log("Availability: 0");
    process.exit();
}

// Add the video URL in the index.html file.
fs.readFile("/opt/3genlabs/hawk/syntheticnode/service/shellmonitor/sandbox/index.html", 'utf8', function (err,data) {
  if (err) {
    console.log("Availability: 0");
    return console.log(err);
  }

  console.log("Set video link to HTML file");
  var result = data.replace(/id='video_url'(\s)+src='.*?'/g, "id='video_url' src='"+video_URL+"'");

  fs.writeFile("/opt/3genlabs/hawk/syntheticnode/service/shellmonitor/sandbox/index.html", result, 'utf8', function (err) {
     if (err){
         console.log("Availability: 0");
         return console.log(err);
     }
  });
});

// launch a local server
connect().use(serveStatic(__dirname)).listen(8080, function(){
    console.log('Server running on 8080...');
});


async function run() {
    //const browser = await puppeteer.launch({args: ['--no-sandbox']});
    const browser = await puppeteer.launch({args: ['--no-sandbox','--no-user-gesture-required','--incognito'], executablePath: '/usr/bin/google-chrome'});
    const page = await browser.newPage();
    
    console.log("Load video URL in browser");
    await page.goto('http://127.0.0.1:8080');
    await page.waitForSelector('#playStart');

    console.log("Capture first screenshot");
    await page.screenshot({path: 'Step1_A.png'});

    console.log("wait for the video to play for "+ video_playtime +" ms");
    await new Promise(r => setTimeout(r, video_playtime));
    await page.click('#my-video');
    await page.waitFor(500);

    console.log("Capture second screenshot");
    await page.screenshot({path: 'Step1_B.png'});
    
    console.log("Gather all Cookies");
    var allCookies = await page.cookies();

    var metrics = ['VideoAnalyticsViewTime', 'VideoAnalyticsBufferingCounter', 'VideoAnalyticsBufferingTime', 'VideoAnalyticsDecodedFrameCount', 'VideoAnalyticsDroppedFrameCount'];

    for(var i=0; i<metrics.length; i++){
      // Check if metrics were captured. 
      if(allCookies.length==0){
        console.log("Metrics were not captured.");
        break;
      }
      
      // Print all the metrics.
      for (var j=0; j<allCookies.length; j++) {
        if(metrics[i]==allCookies[j].name){
          console.log(metrics[i]+": "+allCookies[j].value);
          break;
        }
        if (j==allCookies.length-1) {
          console.log(metrics[i]+": 0");
        }
      }
    }

    console.log("Availability: 1");

    // Print all cookies.
    console.log("allCookies values:"+JSON.stringify(allCookies))
    await page.waitFor(1000);

    await browser.close();
    process.exit();

}
run();

