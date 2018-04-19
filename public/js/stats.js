/**
 * Page Timing to WS
 * 
 */

var errorList = [];

window.addEventListener('error', function(e) {
    errorList.push([
        e.message,
        'URL: ' + e.filename,
        'Line: ' + e.lineno + ', Column: ' + e.colno,
        'Stack: ' + (e.error && e.error.stack || '(no stack trace)')
    ].join('\n') );

});

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name);// + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}
function getCookies() {
  var value = "; " + document.cookie;
  return value.split("; ");// + "=");
}
function convertDateToUTC(date) { return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); }
function getHeaders(){
if(XMLHttpRequest){
 xmlhttp = new XMLHttpRequest();
 xmlhttp.open("HEAD", document.location,true);
 xmlhttp.onreadystatechange=function() {
  if (xmlhttp.readyState==4) {
   console.log(xmlhttp.getAllResponseHeaders());
  }
 }
 xmlhttp.send(null)
}
}
function botCheck(){
var botPattern = "(googlebot\/|Googlebot-Mobile|Googlebot-Image|Google favicon|Mediapartners-Google|bingbot|slurp|java|wget|curl|Commons-HttpClient|Python-urllib|libwww|httpunit|nutch|phpcrawl|msnbot|jyxobot|FAST-WebCrawler|FAST Enterprise Crawler|biglotron|teoma|convera|seekbot|gigablast|exabot|ngbot|ia_archiver|GingerCrawler|webmon |httrack|webcrawler|grub.org|UsineNouvelleCrawler|antibot|netresearchserver|speedy|fluffy|bibnum.bnf|findlink|msrbot|panscient|yacybot|AISearchBot|IOI|ips-agent|tagoobot|MJ12bot|dotbot|woriobot|yanga|buzzbot|mlbot|yandexbot|purebot|Linguee Bot|Voyager|CyberPatrol|voilabot|baiduspider|citeseerxbot|spbot|twengabot|postrank|turnitinbot|scribdbot|page2rss|sitebot|linkdex|Adidxbot|blekkobot|ezooms|dotbot|Mail.RU_Bot|discobot|heritrix|findthatfile|europarchive.org|NerdByNature.Bot|sistrix crawler|ahrefsbot|Aboundex|domaincrawler|wbsearchbot|summify|ccbot|edisterbot|seznambot|ec2linkfinder|gslfbot|aihitbot|intelium_bot|facebookexternalhit|yeti|RetrevoPageAnalyzer|lb-spider|sogou|lssbot|careerbot|wotbox|wocbot|ichiro|DuckDuckBot|lssrocketcrawler|drupact|webcompanycrawler|acoonbot|openindexspider|gnam gnam spider|web-archive-net.com.bot|backlinkcrawler|coccoc|integromedb|content crawler spider|toplistbot|seokicks-robot|it2media-domain-crawler|ip-web-crawler.com|siteexplorer.info|elisabot|proximic|changedetection|blexbot|arabot|WeSEE:Search|niki-bot|CrystalSemanticsBot|rogerbot|360Spider|psbot|InterfaxScanBot|Lipperhey SEO Service|CC Metadata Scaper|g00g1e.net|GrapeshotCrawler|urlappendbot|brainobot|fr-crawler|binlar|SimpleCrawler|Livelapbot|Twitterbot|cXensebot|smtbot|bnf.fr_bot|A6-Indexer|ADmantX|Facebot|Twitterbot|OrangeBot|memorybot|AdvBot|MegaIndex|SemanticScholarBot|ltx71|nerdybot|xovibot|BUbiNG|Qwantify|archive.org_bot|Applebot|TweetmemeBot|crawler4j|findxbot|SemrushBot|yoozBot|lipperhey|y!j-asr|Domain Re-Animator Bot|AddThis)";
          var re = new RegExp(botPattern, 'i');
          var userAgent = navigator.userAgent;
          if (re.test(userAgent)) {
              return true;
          }else{
            return false;
          }
}

function addCacheComments(out){

console.log(jQuery('body').contents().filter(function(){  return this.nodeType == 8;  }));

jQuery(document).contents().filter(function(){
        return this.nodeType == 8;
    }).each(function(i, e){ //console.log(e.data);
        comment=e.data;
     if(comment.indexOf('WP-Super-Cache')>-1){
        sp=comment.split(/:(.+)/);
        k='SuperCacheDate';	//sp[0].trim().trim().replace(/ /g,'');	//ideally "SuperCacheDate"
        v=sp[1].trim();
        out[k]=v;
     }else if(comment.indexOf('WP Fastest Cache')>-1){
        sp=comment.split(/on (.+)/);
        k='SuperCacheDate';	//sp[0].trim().trim().replace(/ /g,'');
        v=sp[1].trim().replace(" ","-");	// poorly formatted as dd-mm-yy: 24-08-17-time  :/
	dt=v.split(/-/);	//
        out[k]=convertDateToUTC(new Date("20"+dt[2]+"-"+dt[1]+"-"+dt[0]+" "+dt[3])).toISOString();	//local time, not UTC :/
     }
     });
    return out;
    
}//fx

//if(!sc_info)  if(typeof sc_info === 'undefined' || sc_info) 
if(typeof sc_info === 'undefined') sc_info={};

//jQuery(document).ready(function($){ 
jQuery(window).load(function($){
sc_info=addCacheComments(sc_info);

var _navigator = {};
for (var i in navigator) _navigator[i] = navigator[i];
/*
var ws_browser=JSON.stringify(_navigator);
var req = new XMLHttpRequest();
req.open('GET', document.location, false);
req.send(null);
var headers = req.getAllResponseHeaders().toLowerCase().split('\r\n');
var ws_headers='';//JSON.stringify( headers );
*/

var cookies=getCookies();
//var ws_cookie=JSON.stringify( cookies );
//var ws_performance=JSON.stringify( window.performance )

var now_utc = new Date().toISOString();   // this is in UTC 

var is_cf=false;
if(window.CloudFlare){
	is_cf=true;
}

var gaClientID;
if(window.ga){
    ga(function(tracker) {
      gaClientID = tracker.get('clientId');
    });
}else if(window.__gaTracker){
    __gaTracker(function(tracker) {
      gaClientID = tracker.get('clientId');
    });
}


//        'headers':headers,
var ws_stats={
        'timestamp': now_utc,
	'url': document.location,
        'php_build': sc_info,
	'cloudflare': is_cf,
        'cookies': cookies,
        'browser': _navigator,
        'performance': window.performance,
	'gaClientID': gaClientID,
	'errors': errorList
    };
// var ws_stats=JSON.stringify( ws_stats );
/*
  var page_load_time = performance.timing.domInteractive - performance.timing.navigationStart;
  console.log("Wordpress Reporting:",sc_info);
  console.log("Response/Server/PHP-time: " + (performance.timing.responseEnd - performance.timing.requestStart) );
  console.log("User-perceived page loading time: " + page_load_time);
*/
//next step: POST to stats.ws.com.. 

if(!botCheck()){
        jQuery.ajax({
            type: 'POST',
/*    headers: {
        'Authorization':'Basic xxxxxxxxxxxxx',
        'X_CSRF_TOKEN':'xxxxxxxxxxxxxxxxxxxx',
        'Content-Type':'application/json'
    },
*/
            url: 'https://stats.wierstewarthosting.com/browser/api/index.php',    //might have to post to wp-plugin.. or this is a script called from stats. :( 
            crossDomain: true,
            data: "stats="+JSON.stringify( ws_stats ),
            dataType: 'json',
            success: function(responseData, textStatus, jqXHR) {
//                var value = responseData.someKey;
                console.log("POST submitted:",responseData);
            },
            error: function (responseData, textStatus, errorThrown) {
                console.log('POST failed:',ws_stats,responseData,textStatus,errorThrown);
            }
        });//ajax
}else{
console.log("Sry, you look like a bot");
}//botcheck

});

/**
 * User-Actions to GA
 * 
 */

/*
'.site-title a',
'.menu-item a',
*/
var hrefTrack = [
'a',
'.read-more',
'.view-more',
'.button',
'.slide-link'
];

var clickTrack = [
'.mobile-menu-icon',
'.flex-direction-nav a',
'input[type="submit"]',
'button',
'.submit'
];

//var hoverTrack = [];
//var scrollTrack = []; //integrate into scroll-checker


function addTracking($,gaObjName,selector,category){ //should also work for 
	//check if ga exist - otherwise links die.
	$(selector).each(function() {
		console.log('adding:',selector);//category,action,label)

		var thisEvent = $(this).attr("onclick"); // grab the original onclick event
		$(this).click(function(event) { // when someone clicks these links
		console.log('click:',category,selector);

		var href = $(this).attr("href");
		if(href=='') href=$(this).text();
		if(href=='') href=$(this).attr('title');
		if(href=='') href=$(this).attr('id');
		if(href=='') href=$(this).attr('class');
		if(href=='') href=$(this).closest(['id']).attr('id');	//closest id

		var target = $(this).attr("target");
                action=selector;
                label=href;
		console.log('sending:',category,action,label)
			window[gaObjName]('send', { hitType: 'event',  eventCategory: category,  eventAction: action,  eventLabel: label }); //analytics.js safe
		});
	});//each
}//f:onclickTrack;

function doTrack($,gaObj){
    for(i in hrefTrack){
        addTracking($,gaObj,hrefTrack[i],"ws_link");
    }
    for(i in clickTrack){
        addTracking($,gaObj,clickTrack[i],"ws_click");
    }
}

jQuery(document).ready(function($) {
	if(window.ga){
		doTrack($,'ga');	//default
	}else if(window.__gaTracker){
		doTrack($,'__gaTracker');	//Yoast
	}else{

	}

});

