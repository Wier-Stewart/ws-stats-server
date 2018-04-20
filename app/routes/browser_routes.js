
const crypto = require('crypto');
const path = require('path');
const fs = require('fs')
var json2csv = require('json2csv').parse;
var newLine= "\r\n";

module.exports = function(app, db) {

    app.get('/browser', (req, res) => {
        res.send('Browser Stats is Functional.')
    });

    app.get('/browser/js/stats.js', function(req, res) {
        res.sendFile(path.join(__dirname + '/../../public/js/stats.js'));
    });

    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    app.post('/browser/api', (req, res, next_route_match) => {    //next_route_match will be less specific than this; good luck.
        // jQuery.ajax is sending: Content-Type: application/x-www-form-urlencoded; charset=UTF-8

        res.send(req.body); //fire back, closes cxxn.

        //Continue parsing..
        //.then( preParse )
        var posted_obj = {};
        var posted_str = '';
        try{
            if( typeof req.body.stats == "string") posted_str = req.body.stats; // .body.substring(1,req.body.length-1)
            else posted_str =  Object.keys( req.body )[0]; //Alternate, if req.body.stats isn't set?
            posted_obj = JSON.parse( posted_str );
        }catch(error) {
            console.log("JSON Parsing error:", req.body , error);
        }

        //.then( saveJSON ) //backup
        let datestring = new Date().toJSON().replace('T','-').replace('Z','').replace(/:/g,'_'); // 2018-04-19-22:03:17.905500
        let json_filename = path.join(__dirname + '/../log/ajax-'+datestring+'.log');
        fs.writeFile(json_filename, posted_str, function (err, stat) {
            if (err) throw err;
            console.log('file saved');
        });

    //PHP: $file_result=file_put_contents('../log/ajax-'.$datestring.'.log',$ajax_post);

        //.then( forRealParse:Raw )
        const parsedForRawCSV = parsePostedData(posted_obj);
        console.log("parsedForCSV:", parsedForRawCSV);

        //.then( forRealAppend:Raw ) //aka, save/append to mega-csv
        const rawResult = appendToCSV(path.join(__dirname + '/../data/raw.csv'), [parsedForRawCSV]);

        //.then( forRealParse:Grouped )
        const groupedCSV = groupPerformance(parsedForRawCSV);
        //.then( forRealAppend:Grouped ) //aka, save/append to mega-csv
        const groupResult = appendToCSV(path.join(__dirname + '/../data/group.csv'), [groupedCSV]);

        //.catch( next ) //error handle?

        console.log("file saves:", rawResult, groupResult )



    });
};

/**
Output:
Context: timestamp,php_duration,CacheDate,CacheAge,supercache,cloudflare,uid,domain,url,
Timing: navigationStart,unloadEventStart,unloadEventEnd,redirectStart,redirectEnd,fetchStart,domainLookupStart,domainLookupEnd,connectStart,connectEnd,secureConnectionStart,requestStart,responseStart,responseEnd,domLoading,domInteractive,domContentLoadedEventStart,domContentLoadedEventEnd,domComplete,loadEventStart,loadEventEnd,
Extra: duration,gaClientID

TOADD: queryCount, errorCount

**/

const csv_keys=['timestamp','php_duration','CacheDate','CacheAge','supercache','cloudflare','uid','domain','url','performance','duration','gaClientID','queryCount', 'errorCount'];

function parsePostedData(posted_obj){ //to raw.csv
    const posted_keys = Object.keys(posted_obj);
    let safe_to_add = true;

    let output_json={}; //keys & vals: headers & row-cell for csv.

    for(let posted_key of csv_keys){
        switch(posted_key){
        case 'url':
        if( posted_obj[posted_key]['href'].indexOf('http') < 0 ) safe_to_add = false;
        output_json['domain']=posted_obj[posted_key]['hostname'];
        output_json['url']=posted_obj[posted_key]['href'].replace(',', '-');    //avoid csv issues
        break;

        case 'timestamp':
        output_json['timestamp'] = Date.parse(posted_obj[posted_key])/1000;  //unix time @ milliseconds
        break;

        case 'errors':
        output_json['error_count']=posted_obj[posted_key].length;
        break;

        case 'gaClientID':
        output_json['gaClientID']=posted_obj[posted_key];
        break;

        case 'php_build':
        output_json['php_duration']=posted_obj[posted_key]['Duration'];
        output_json['QueryCount']=posted_obj[posted_key]['QueryCount'];
        output_json['php_build_date'] = Date.parse(posted_obj[posted_key]['BuildDate'])/1000;  //unix time @ milliseconds
        //273:	$scdate=$json['php_build']['SuperCacheDate'];
        output_json['CacheDate']=new Date();
        if( posted_obj[posted_key]['SuperCacheDate'] ) posted_obj[posted_key]['SuperCacheDate'].replace(/"/g,"");
        output_json['CacheAge'] = (output_json['timestamp'] - output_json['php_build_date']); //seconds

        output_json['supercache']=0; //true/false; outdated
        if(output_json['CacheAge'] < 5000 ) output_json['supercache']=0;    //we assume 5s to build = upper end?!

        break;

        case 'cloudflare':  //true/false
        output_json['cloudflare']=(typeof posted_obj[posted_key] == 'Number' || typeof posted_obj[posted_key] == 'String') ? parseInt(posted_obj[posted_key]) : 0;
        break;

        case 'browser':
//        301:$uid=hash('sha256',json_encode($json['browser']));
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(posted_obj[posted_key]));
        output_json['uid']=hash.digest('hex');

//        303:$isHuman=checkHumanity($json['browser']);
        break;

        case 'performance':
        let timings = handlePerformanceTiming( posted_obj[posted_key]['timing'] );
        console.log("PT:", timings);
        output_json = { ...output_json, ...timings };
        break;

        default:
        output_json[posted_key] = 0;
        break;

        }//switch

    }//for

    return output_json;
}//fx


function handlePerformanceTiming(performance_timing){
const performanceOrder = ['navigationStart','unloadEventStart','unloadEventEnd','redirectStart','redirectEnd','fetchStart','domainLookupStart','domainLookupEnd','connectStart','connectEnd','secureConnectionStart','requestStart','responseStart','responseEnd','domLoading','domInteractive','domContentLoadedEventStart','domContentLoadedEventEnd','domComplete','loadEventStart','loadEventEnd'];
let output={};  //all output in millis, except duration=sec.

    let keys=Object.keys(performance_timing);
    let values=Object.values(performance_timing);

	let min=0;
	let max=0;
	let diff=0;

	const nonzero_timings = values.filter(timing => timing > 0);
	if( nonzero_timings.length > 1){
	  min = Math.min(...nonzero_timings);	//non-zero
	  max = Math.max(...values);
	  diff=(max-min)/1000;
	}
	let prev=min;

	for( let k of performanceOrder){
          let v = performance_timing[k];
		let d = v - prev;	//prev vs. min..
		if( d < 0 ) d = 0;
		else prev = v;

          output[ k ] = d;
	}
	output['duration']=diff;

    return output;
}

/***********
// $json['php_build']) && intval($json['cloudflare'])) $tmp['supercache']=1; //without a date, could have been now, but if it's CF, then should be non-now

raw.csv: domain,url,                           navigationStart,unloadEventStart,unloadEventEnd,redirectStart,redirectEnd,fetchStart,domainLookupStart,domainLookupEnd,connectStart,connectEnd,secureConnectionStart,requestStart,responseStart,responseEnd,domLoading,domInteractive,domContentLoadedEventStart,domContentLoadedEventEnd,domComplete,loadEventStart,loadEventEnd,duration
         localhost,http://localhost:8000/test/,0,              22,              1,             0,            0,          0,         0,                0,              0,           0,         0,                    0,           0,            0,          10,        265,           1,                         4,                       249,        0,             0,           0.552

//group.csv: timestamp,php_duration,CacheDate,CacheAge,supercache,cloudflare,uid,domain,url,Network,Interactive,Total,Server,Browser1,Browser2,duration,gaClientID
domain,                           url,Network,Interactive,Total,Server,Browser1,Browser2,duration
localhost,http://localhost:8000/test/,0      ,275,        529,  0,     275,     254,     0.552,
*/




function groupPerformance(row){
    const groupHeader=['timestamp','php_duration','CacheDate','CacheAge','supercache','cloudflare','uid','domain','url','Network','Interactive','Total','Server','Browser1','Browser2','duration','gaClientID','queryCount','errorCount'];

	input_header=Object.keys(row);	//these are input headers, not output headers!!

	let output = {};
	let lastgroup='';
	let total=0;
	let interactive=0;

	for(key of input_header){
	    group='';
	    group_interactive=false;
	    group_total=false;
	    switch(key){
		case "fetchStart":
		case "domainLookupStart":
		case "domainLookupEnd":
		case "connectStart":
		case "secureConnectionStart":
		case "connectEnd":
		  group='Network';
            group_interactive=true;
            group_total=true;
		break;

		case "requestStart":
		case "responseStart":
		case "responseEnd":
		  group='Server'; // Time to download from server, basically.
            group_interactive=true;
            group_total=true;
		break;

		case "domLoading":
		case "domInteractive":
		  group='Browser1';
            group_interactive=true;
            group_total=true;
		break;

		case "domContentLoadedEventStart":
		case "domContentLoadedEventEnd":
		case "loadEventStart":
		case "loadEventEnd":
		case "domComplete":
		  group='Browser2';
            group_total=true;
		break;
		case "navigationStart":
		case "unloadEventStart":
		case "unloadEventEnd":
		case "redirectStart":
		case "redirectEnd":
		   group='ignore';
		break;
		default:
		   group='';

	    }//switch

        // Non-Timing key. @context: domain,url,uid, etc
        if(group==''){
            output[key]=row[key];
        }

        //Default Timing: Sum to the Group
        if(group!=='' && group!=='ignore'){
            if(typeof output[group] =='undefined') output[group]=0;
            output[group]+=parseInt(row[key]);
        }

        //Extra: Add up Time-toInteractive/Total
        if(group_interactive){
            if(typeof output["Interactive"] =='undefined') output["Interactive"]=0;
            output["Interactive"] += parseInt(row[key]);
        }
        if(group_total){
            if(typeof output["Total"] =='undefined') output["Total"]=0;
            output["Total"]+= parseInt(row[key]);
        }

    }//fe

    return output;

} // fx



function appendToCSV(csv_filename, appendRowsArray){
    // https://stackoverflow.com/questions/40725959/how-to-append-new-row-in-exist-csv-file-in-nodejs-json2csv?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa
    var options = {
        data: appendRowsArray,
        fields: Object.keys(appendRowsArray[0]),
        header: false
    };

    fs.stat(csv_filename, function (err, stat) {
        if (err == null) {
            console.log('File exists');

            //write the actual data and end with newline
            let csv='';
            try {
                csv = json2csv(appendRowsArray, options) + newLine;
                console.log("CSV:",csv);
            } catch (err) {
              console.error(err, toCsv);
            }


            fs.appendFile(csv_filename, csv, function (err) {
                if (err) throw err;
                console.log('The "data to append" was appended to file!');
            });
        }else {
            //write the headers and newline
            console.log('New file, just writing headers');
            let fieldsString = (toCsv.fields + newLine);

            fs.writeFile(csv_filename, fieldsString, function (err, stat) {
                if (err) throw err;
                console.log('file saved');
            });
        }
    });

}