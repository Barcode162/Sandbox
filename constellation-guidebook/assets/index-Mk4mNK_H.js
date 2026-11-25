(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={schema:`constellation.memory`,version:1,meta:{title:`Heat, a long road and two pathways`,description:`The seed memory: one kitchen seen by a Cook, a Physicist and a Child. Switch lenses to watch values, lines and outcomes change.`,defaultPerspective:`cook`,featured:{route:{from:`road-a`,to:`road-z`},pathway:`p1`,query:`boil`}},perspectives:[{id:`cook`,label:`Cook`,description:`Kitchen truths in °C. Pathways and recipe files pulled close; variables pushed far away.`,accent:`#FF9F5A`,positions:{temperature:{x:6.5,y:20.67,z:4.11},"boiling-point":{x:-11.47,y:31.58,z:3.93},"flame-step":{x:-7.99,y:13.04,z:-13.09},"safe-to-touch":{x:27.91,y:-.48,z:3.19},room:{x:13.43,y:-3.66,z:10.01},heat:{x:14.56,y:32.04,z:-3.25},steam:{x:-29.18,y:21.67,z:-.14},soup:{x:-32.39,y:-2.22,z:-2.73},burn:{x:18.81,y:10.25,z:-3.67},energy:{x:-13.03,y:-24.36,z:0},molecules:{x:-7.54,y:-7.41,z:2.31},kelvin:{x:1.63,y:-19.24,z:8.23},stove:{x:1.89,y:2.43,z:-7.54},pot:{x:-21.27,y:7.38,z:-6.03},ice:{x:26.88,y:25.78,z:8.51},thermometer:{x:2.83,y:42.77,z:2.18},recipe:{x:-138.03,y:79.07,z:-48.03},"boiling-curve":{x:-161.75,y:87.3,z:-43.77},"drawing-of-a-sun":{x:-109.76,y:102.16,z:-40},"lab-notes":{x:-107.33,y:48.33,z:-37.32},"shopping-list":{x:-123.57,y:81.83,z:-54.33},thermostat:{x:-141.84,y:65.72,z:-39.24},"kettle-manual":{x:-138.1,y:38.21,z:-34},timer:{x:-112,y:75.65,z:-37.44},"loop-notes":{x:-122.65,y:66.25,z:-28.12},readme:{x:-126.37,y:101.11,z:-34.57},"sim-config":{x:-128.38,y:47.34,z:-46.13},"bedtime-story":{x:-135.49,y:112.13,z:-40},"var-limit":{x:147.15,y:-66.81,z:-78.33},"var-unit":{x:147.1,y:-94.74,z:-82.58},"var-count":{x:147.31,y:-52.81,z:-84.68},"var-i":{x:131.14,y:-64.93,z:-89.63},"var-done":{x:172.56,y:-65.95,z:-91.29},"var-step":{x:132.88,y:-51.07,z:-96.54},"var-total":{x:156.05,y:-41.08,z:-88.18},"var-name":{x:160.92,y:-77.94,z:-102.19},"var-epsilon":{x:138.06,y:-85.24,z:-95.59},"var-retries":{x:166.83,y:-99.44,z:-90.98},"meta-memory":{x:-4.78,y:122.15,z:-89.6},"meta-perspective":{x:-1.62,y:139.99,z:-94.95},"meta-facet":{x:20.74,y:136.23,z:-98.9},"meta-relation":{x:3.58,y:108.89,z:-92.13},"meta-shortcut":{x:17.88,y:105.32,z:-86.83},"meta-route":{x:22.03,y:121.02,z:-82.45},"meta-recall":{x:8.47,y:130.58,z:-83.89},"meta-pathway":{x:-19.78,y:123.01,z:-89.86},"meta-loop":{x:-29.34,y:109.7,z:-96.79},"meta-condition":{x:-17.17,y:103.12,z:-84.59},"road-a":{x:-55,y:-140,z:-30},"road-b":{x:-54.89,y:-130.81,z:-49.7},"road-c":{x:-40.5,y:-123.93,z:-64.47},"road-d":{x:-24.25,y:-118.22,z:-76.7},"road-e":{x:-3.94,y:-113.55,z:-86.72},"road-f":{x:18.78,y:-115.57,z:-82.38},"road-g":{x:37.89,y:-120.64,z:-71.51},"road-h":{x:57.32,y:-126.68,z:-58.56},"road-i":{x:65.54,y:-136.5,z:-37.5},"road-j":{x:60.87,y:-146.61,z:-15.83},"road-k":{x:54.57,y:-156.76,z:5.93},"road-l":{x:37.97,y:-165.29,z:24.22},"road-m":{x:12.6,y:-167.91,z:29.85},"road-n":{x:-12.99,y:-168.79,z:31.73},"road-o":{x:-40.07,y:-166.69,z:27.23},"road-p":{x:-58.52,y:-157.97,z:8.53},"road-q":{x:-69.4,y:-147.53,z:-13.85},"road-r":{x:-77.11,y:-135.88,z:-38.83},"road-s":{x:-68.05,y:-124.19,z:-63.9},"road-t":{x:-47.68,y:-115.64,z:-82.24},"road-u":{x:-24.69,y:-107.89,z:-98.86},"road-v":{x:5.19,y:-105.15,z:-104.73},"road-w":{x:33.61,y:-109.81,z:-94.74},"road-x":{x:59.6,y:-116.35,z:-80.73},"road-y":{x:80.7,y:-126.5,z:-58.96},"road-z":{x:83.9,y:-140,z:-30},p1:{x:-60,y:0,z:50},p2:{x:-60,y:-12,z:50},p3:{x:-60,y:-24,z:50},p4:{x:-60,y:-36,z:50},p5:{x:-46,y:-36,z:50},p6:{x:-53,y:-47,z:50},p7:{x:-70,y:-50,z:50},q1:{x:60,y:0,z:50},q2:{x:60,y:-12,z:50},q3:{x:60,y:-24,z:50},q4:{x:46,y:-36,z:50},q5:{x:74,y:-36,z:50},q6:{x:66,y:-50,z:50},q7:{x:84,y:-50,z:50}}},{id:`physicist`,label:`Physicist`,description:`Kelvin and molecules. Exclusive lines to Kelvin, Molecules and Energy; the Long Road is a precise flat ring.`,accent:`#6FD3FF`,positions:{temperature:{x:-5.16,y:5.39,z:-1.25},"boiling-point":{x:2.22,y:19.87,z:4.03},"flame-step":{x:33.29,y:8.03,z:-2.22},"safe-to-touch":{x:-11.76,y:24.64,z:-6.99},room:{x:17.13,y:15.96,z:-6.15},heat:{x:1.97,y:-10.41,z:-6.32},steam:{x:11.01,y:5.3,z:9.87},soup:{x:17.59,y:-25.19,z:10.55},burn:{x:-33.15,y:16.96,z:-10.83},energy:{x:-1.46,y:-31.22,z:-7.16},molecules:{x:-10.58,y:-16.75,z:3.66},kelvin:{x:-19.47,y:13.53,z:2.78},stove:{x:30.71,y:-6.45,z:.79},pot:{x:16.69,y:-10.47,z:7.7},ice:{x:-17.08,y:-2.4,z:6.08},thermometer:{x:-31.95,y:-6.78,z:-4.55},recipe:{x:127.59,y:37.57,z:-57.66},"boiling-curve":{x:150.15,y:60.61,z:-56.42},"drawing-of-a-sun":{x:169.61,y:-6.93,z:-50},"lab-notes":{x:166.7,y:58.6,z:-47.56},"shopping-list":{x:130.26,y:-2.47,z:-50},thermostat:{x:122.48,y:12.11,z:-48.63},"kettle-manual":{x:139.68,y:30.19,z:-39.94},timer:{x:163.85,y:26.85,z:-57.67},"loop-notes":{x:140.38,y:10.77,z:-59.14},readme:{x:169.09,y:7.35,z:-55.01},"sim-config":{x:168.97,y:44.89,z:-40.63},"bedtime-story":{x:184.91,y:14.99,z:-50},"var-limit":{x:-135.47,y:13.61,z:-25.61},"var-unit":{x:-128.35,y:25.02,z:-35.43},"var-count":{x:-149.65,y:7.97,z:-28.26},"var-i":{x:-165.11,y:9.56,z:-29.2},"var-done":{x:-154.37,y:38.89,z:-31.81},"var-step":{x:-177.42,y:19.77,z:-32.74},"var-total":{x:-138.27,y:-2.95,z:-32.47},"var-name":{x:-149.1,y:20.57,z:-41.13},"var-epsilon":{x:-138.57,y:38.67,z:-24.18},"var-retries":{x:-163.68,y:28.88,z:-19.17},"meta-memory":{x:6.03,y:92.48,z:-39.65},"meta-perspective":{x:18.52,y:100.97,z:-39.83},"meta-facet":{x:32.74,y:104.53,z:-46.12},"meta-relation":{x:-2.49,y:107.22,z:-42.64},"meta-shortcut":{x:-22.38,y:98.79,z:-47.05},"meta-route":{x:-17.21,y:79.24,z:-46.74},"meta-recall":{x:-2.23,y:79.03,z:-42.64},"meta-pathway":{x:-8.94,y:94.91,z:-33.21},"meta-loop":{x:-16.08,y:116.13,z:-31.42},"meta-condition":{x:12.03,y:76.69,z:-30.69},"road-a":{x:-58,y:-110,z:0},"road-b":{x:-54.82,y:-105.49,z:-21.23},"road-c":{x:-43.68,y:-101.47,z:-40.12},"road-d":{x:-25.92,y:-98.55,z:-53.88},"road-e":{x:-3.88,y:-97.17,z:-60.37},"road-f":{x:19.41,y:-97.58,z:-58.42},"road-g":{x:40.64,y:-99.79,z:-48.05},"road-h":{x:56.71,y:-103.52,z:-30.5},"road-i":{x:65.16,y:-108.29,z:-8.05},"road-j":{x:64.55,y:-113.45,z:16.21},"road-k":{x:54.69,y:-118.26,z:38.87},"road-l":{x:36.74,y:-122.04,z:56.62},"road-m":{x:13.03,y:-124.2,z:66.8},"road-n":{x:-13.21,y:-124.39,z:67.72},"road-o":{x:-38.28,y:-122.54,z:59},"road-p":{x:-58.57,y:-118.85,z:41.63},"road-q":{x:-71.06,y:-113.79,z:17.85},"road-r":{x:-73.73,y:-108.06,z:-9.11},"road-s":{x:-65.97,y:-102.46,z:-35.47},"road-t":{x:-48.6,y:-97.79,z:-57.46},"road-u":{x:-23.86,y:-94.73,z:-71.82},"road-v":{x:4.91,y:-93.78,z:-76.3},"road-w":{x:33.69,y:-95.12,z:-70.03},"road-x":{x:58.38,y:-98.6,z:-53.62},"road-y":{x:75.35,y:-103.8,z:-29.18},"road-z":{x:82,y:-110,z:0},p1:{x:-95,y:-5,z:60},p2:{x:-95,y:-17,z:60},p3:{x:-95,y:-29,z:60},p4:{x:-95,y:-41,z:60},p5:{x:-81,y:-41,z:60},p6:{x:-88,y:-52,z:60},p7:{x:-105,y:-55,z:60},q1:{x:95,y:-5,z:60},q2:{x:95,y:-17,z:60},q3:{x:95,y:-29,z:60},q4:{x:81,y:-41,z:60},q5:{x:109,y:-41,z:60},q6:{x:101,y:-55,z:60},q7:{x:119,y:-55,z:60}}},{id:`child`,label:`Child`,description:`Values on a 0–5 hand-feel scale. Drawing and bedtime-story lines appear. It cannot see F–X, so its shortcut is longer.`,accent:`#FF7EC8`,positions:{temperature:{x:9.4,y:-10.75,z:36.74},"boiling-point":{x:-8.55,y:1.39,z:32.47},"flame-step":{x:17.33,y:20.09,z:23.35},"safe-to-touch":{x:16.45,y:8.31,z:39.98},room:{x:-2.67,y:-37.32,z:38.8},heat:{x:34.67,y:-15.76,z:34.62},steam:{x:-23.4,y:-2.77,z:23.84},soup:{x:-33.02,y:30.07,z:21},burn:{x:36.56,y:7.23,z:35.26},energy:{x:8.12,y:-49.86,z:30},molecules:{x:-36.63,y:-24.43,z:35.38},kelvin:{x:-6.27,y:37.17,z:34.23},stove:{x:2.48,y:21.13,z:17.41},pot:{x:-18.73,y:14.36,z:18.02},ice:{x:-5.85,y:-12.05,z:46.71},thermometer:{x:6.84,y:-27.88,z:27.37},recipe:{x:-79.91,y:53.61,z:4.23},"boiling-curve":{x:-46.91,y:64.53,z:7.01},"drawing-of-a-sun":{x:-92.82,y:79.9,z:6.95},"lab-notes":{x:-69.4,y:77.64,z:.94},"shopping-list":{x:-99.81,y:53.33,z:0},thermostat:{x:-90.48,y:95,z:-4},"kettle-manual":{x:-65.21,y:54.36,z:-7.07},timer:{x:-65.61,y:94.34,z:9.71},"loop-notes":{x:-60.54,y:105.96,z:-3.64},readme:{x:-46.73,y:76.85,z:-7.29},"sim-config":{x:-39.08,y:93.33,z:.68},"bedtime-story":{x:-108.65,y:84.51,z:3.71},"var-limit":{x:155.62,y:67.71,z:-119.54},"var-unit":{x:148.75,y:79.13,z:-129.92},"var-count":{x:167.12,y:78.3,z:-116.23},"var-i":{x:160.22,y:92.56,z:-116.51},"var-done":{x:145.17,y:102.76,z:-124.95},"var-step":{x:160.2,y:108.73,z:-112.69},"var-total":{x:182.13,y:75.96,z:-115.19},"var-name":{x:134.93,y:87.94,z:-116.84},"var-epsilon":{x:175.23,y:89.24,z:-125.56},"var-retries":{x:170.62,y:117.67,z:-122.57},"meta-memory":{x:-141.66,y:-19.43,z:-61.15},"meta-perspective":{x:-126.71,y:-22.24,z:-67.54},"meta-facet":{x:-129.11,y:-38.1,z:-70.9},"meta-relation":{x:-144.37,y:-36.37,z:-59.01},"meta-shortcut":{x:-164.36,y:-35.86,z:-58.61},"meta-route":{x:-169.29,y:-17.11,z:-60.66},"meta-recall":{x:-153.19,y:-7,z:-62.98},"meta-pathway":{x:-123.71,y:-4.55,z:-55.09},"meta-loop":{x:-133.76,y:7.33,z:-52.84},"meta-condition":{x:-113.83,y:-26.68,z:-51.24},"road-a":{x:4,y:-100,z:0},"road-b":{x:-1.04,y:-90.68,z:-13.31},"road-c":{x:14.66,y:-86.35,z:-19.49},"road-d":{x:24.37,y:-80.95,z:-27.21},"road-e":{x:36.93,y:-72.03,z:-39.94},"road-f":{x:53.31,y:-76.5,z:-33.56},"road-g":{x:64.66,y:-82.9,z:-24.42},"road-h":{x:84.98,y:-85.82,z:-20.26},"road-i":{x:91.16,y:-96.29,z:-5.29},"road-j":{x:81.45,y:-106.1,z:8.72},"road-k":{x:82.27,y:-117.62,z:25.16},"road-l":{x:71.58,y:-128.54,z:40.76},"road-m":{x:49.21,y:-127.71,z:39.57},"road-n":{x:30.1,y:-129.76,z:42.5},"road-o":{x:5.58,y:-131.11,z:44.43},"road-p":{x:-6.3,y:-119.3,z:27.56},"road-q":{x:-12.66,y:-107.76,z:11.08},"road-r":{x:-26.72,y:-95.17,z:-6.9},"road-s":{x:-17.67,y:-81.82,z:-25.97},"road-t":{x:3.1,y:-74.42,z:-36.53},"road-u":{x:18.84,y:-62.65,z:-53.35},"road-v":{x:44.62,y:-57.88,z:-60.15},"road-w":{x:67.13,y:-66.94,z:-47.22},"road-x":{x:90.31,y:-72.9,z:-38.7},"road-y":{x:113.89,y:-83.22,z:-23.96},"road-z":{x:111.43,y:-100,z:0},p1:{x:-90,y:-30,z:60},p2:{x:-90,y:-42,z:60},p3:{x:-90,y:-54,z:60},p4:{x:-90,y:-66,z:60},p5:{x:-76,y:-66,z:60},p6:{x:-83,y:-77,z:60},p7:{x:-100,y:-80,z:60},q1:{x:110,y:40,z:60},q2:{x:110,y:28,z:60},q3:{x:110,y:16,z:60},q4:{x:96,y:4,z:60},q5:{x:124,y:4,z:60},q6:{x:116,y:-10,z:60},q7:{x:134,y:-10,z:60}}}],nodes:[{id:`temperature`,label:`Temperature`,kind:`variable`,value:20,facets:{physicist:293,cook:20,child:2},units:{physicist:`K`,cook:`°C`,child:`· warm`},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`boiling-point`,label:`Boiling Point`,kind:`variable`,value:100,facets:{physicist:373,cook:100,child:5},units:{physicist:`K`,cook:`°C`,child:`· bubbly`},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`flame-step`,label:`Flame Step`,kind:`variable`,value:40,facets:{physicist:20,cook:40,child:1},units:{physicist:`K`,cook:`°C`,child:`· a bit`},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`safe-to-touch`,label:`Safe To Touch`,kind:`variable`,value:45,facets:{physicist:318,cook:45,child:1},units:{physicist:`K`,cook:`°C`,child:`· cool`},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`room`,label:`Room`,kind:`variable`,value:18,facets:{physicist:295,cook:18,child:1},units:{physicist:`K`,cook:`°C`,child:`· cool`},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`heat`,label:`Heat`,kind:`concept`,value:`how high the flame is`,facets:{physicist:`energy moving from hot to cold`,cook:`how high the flame is`,child:`the thing that says ouch`},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`steam`,label:`Steam`,kind:`concept`,value:`the soup is ready`,facets:{physicist:`water as gas, above 373 K`,cook:`the soup is ready`,child:`the cloud from the pot`},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`soup`,label:`Soup`,kind:`concept`,value:`Tuesday's leek soup`,facets:{physicist:`mostly water, 1.0 kg`,cook:`Tuesday's leek soup`,child:`dinner`},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`burn`,label:`Burn`,kind:`concept`,value:`what happens when you rush`,facets:{physicist:`tissue damage above ~317 K`,cook:`what happens when you rush`,child:`ouch`},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`energy`,label:`Energy`,kind:`concept`,value:`never made or destroyed`,facets:{},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`molecules`,label:`Molecules`,kind:`concept`,value:`jiggle faster when hot`,facets:{},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`kelvin`,label:`Kelvin`,kind:`concept`,value:`absolute scale`,facets:{},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`stove`,label:`Stove`,kind:`concept`,value:null,facets:{},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`pot`,label:`Pot`,kind:`concept`,value:null,facets:{},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`ice`,label:`Ice`,kind:`concept`,value:null,facets:{},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`thermometer`,label:`Thermometer`,kind:`concept`,value:null,facets:{},tags:[`heat`],created:17934912e5,updated:17934912e5},{id:`recipe`,label:`recipe.txt`,kind:`file`,value:`Grandma's leek soup`,facets:{physicist:`2.1 KB of UTF-8 text`,cook:`Grandma's leek soup`,child:`the paper with the soup on it`},tags:[`files`],file:{name:`recipe.txt`,path:`/kitchen/recipe.txt`,mime:`text/plain`,sizeNote:`2.1 KB`,content:`Leeks, butter, stock. Simmer until it smells like home.`},created:17934912e5,updated:17934912e5},{id:`boiling-curve`,label:`boiling-curve.csv`,kind:`file`,value:`why soup is slow in the mountains`,facets:{physicist:`pressure vs boiling point, 40 rows`,cook:`why soup is slow in the mountains`,child:`numbers`},tags:[`files`],file:{name:`boiling-curve.csv`,path:`/lab/boiling-curve.csv`,mime:`text/csv`,sizeNote:`38 KB`},created:17934912e5,updated:17934912e5},{id:`drawing-of-a-sun`,label:`drawing-of-a-sun.png`,kind:`file`,value:`stuck on the fridge`,facets:{physicist:`a 5778 K blackbody, roughly`,cook:`stuck on the fridge`,child:`MY SUN`},tags:[`files`],file:{name:`drawing-of-a-sun.png`,path:`/home/drawings/sun.png`,mime:`image/png`,sizeNote:`640 KB`},created:17934912e5,updated:17934912e5},{id:`lab-notes`,label:`lab-notes.md`,kind:`file`,value:null,facets:{},tags:[`files`],file:{name:`lab-notes.md`,path:`/lab/lab-notes.md`,mime:`text/markdown`},created:17934912e5,updated:17934912e5},{id:`shopping-list`,label:`shopping-list.txt`,kind:`file`,value:null,facets:{},tags:[`files`],file:{name:`shopping-list.txt`,path:`/home/shopping-list.txt`,mime:`text/plain`},created:17934912e5,updated:17934912e5},{id:`thermostat`,label:`thermostat.cfg`,kind:`file`,value:null,facets:{},tags:[`files`],file:{name:`thermostat.cfg`,path:`/home/thermostat.cfg`,mime:`text/plain`},created:17934912e5,updated:17934912e5},{id:`kettle-manual`,label:`kettle-manual.pdf`,kind:`file`,value:null,facets:{},tags:[`files`],file:{name:`kettle-manual.pdf`,path:`/home/kettle-manual.pdf`,mime:`application/pdf`},created:17934912e5,updated:17934912e5},{id:`timer`,label:`timer.js`,kind:`file`,value:null,facets:{},tags:[`files`],file:{name:`timer.js`,path:`/code/timer.js`,mime:`text/javascript`},created:17934912e5,updated:17934912e5},{id:`loop-notes`,label:`loop-notes.md`,kind:`file`,value:null,facets:{},tags:[`files`],file:{name:`loop-notes.md`,path:`/code/loop-notes.md`,mime:`text/markdown`},created:17934912e5,updated:17934912e5},{id:`readme`,label:`README.md`,kind:`file`,value:null,facets:{},tags:[`files`],file:{name:`README.md`,path:`/code/README.md`,mime:`text/markdown`},created:17934912e5,updated:17934912e5},{id:`sim-config`,label:`sim-config.json`,kind:`file`,value:null,facets:{},tags:[`files`],file:{name:`sim-config.json`,path:`/lab/sim-config.json`,mime:`application/json`},created:17934912e5,updated:17934912e5},{id:`bedtime-story`,label:`bedtime-story.txt`,kind:`file`,value:null,facets:{},tags:[`files`],file:{name:`bedtime-story.txt`,path:`/home/bedtime-story.txt`,mime:`text/plain`},created:17934912e5,updated:17934912e5},{id:`var-limit`,label:`limit`,kind:`variable`,value:90,facets:{physicist:100,cook:90,child:3},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`var-unit`,label:`unit`,kind:`variable`,value:`°C`,facets:{physicist:`K`,cook:`°C`,child:`hand-feel`},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`var-count`,label:`count`,kind:`variable`,value:0,facets:{},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`var-i`,label:`i`,kind:`variable`,value:0,facets:{},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`var-done`,label:`done`,kind:`variable`,value:!1,facets:{},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`var-step`,label:`step`,kind:`variable`,value:1,facets:{},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`var-total`,label:`total`,kind:`variable`,value:0,facets:{},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`var-name`,label:`name`,kind:`variable`,value:`Constellation`,facets:{},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`var-epsilon`,label:`epsilon`,kind:`variable`,value:.001,facets:{},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`var-retries`,label:`retries`,kind:`variable`,value:3,facets:{},tags:[`variables`],created:17934912e5,updated:17934912e5},{id:`meta-memory`,label:`Memory`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`meta-perspective`,label:`Perspective`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`meta-facet`,label:`Facet`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`meta-relation`,label:`Relation`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`meta-shortcut`,label:`Shortcut`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`meta-route`,label:`Route`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`meta-recall`,label:`Recall`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`meta-pathway`,label:`Pathway`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`meta-loop`,label:`Loop`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`meta-condition`,label:`Condition`,kind:`concept`,value:null,facets:{},tags:[`meta`],created:17934912e5,updated:17934912e5},{id:`road-a`,label:`A`,kind:`concept`,value:`stop 1 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-b`,label:`B`,kind:`concept`,value:`stop 2 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-c`,label:`C`,kind:`concept`,value:`stop 3 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-d`,label:`D`,kind:`concept`,value:`stop 4 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-e`,label:`E`,kind:`concept`,value:`stop 5 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-f`,label:`F`,kind:`concept`,value:`stop 6 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-g`,label:`G`,kind:`concept`,value:`stop 7 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-h`,label:`H`,kind:`concept`,value:`stop 8 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-i`,label:`I`,kind:`concept`,value:`stop 9 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-j`,label:`J`,kind:`concept`,value:`stop 10 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-k`,label:`K`,kind:`concept`,value:`stop 11 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-l`,label:`L`,kind:`concept`,value:`stop 12 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-m`,label:`M`,kind:`concept`,value:`stop 13 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-n`,label:`N`,kind:`concept`,value:`stop 14 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-o`,label:`O`,kind:`concept`,value:`stop 15 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-p`,label:`P`,kind:`concept`,value:`stop 16 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-q`,label:`Q`,kind:`concept`,value:`stop 17 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-r`,label:`R`,kind:`concept`,value:`stop 18 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-s`,label:`S`,kind:`concept`,value:`stop 19 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-t`,label:`T`,kind:`concept`,value:`stop 20 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-u`,label:`U`,kind:`concept`,value:`stop 21 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-v`,label:`V`,kind:`concept`,value:`stop 22 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-w`,label:`W`,kind:`concept`,value:`stop 23 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-x`,label:`X`,kind:`concept`,value:`stop 24 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-y`,label:`Y`,kind:`concept`,value:`stop 25 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`road-z`,label:`Z`,kind:`concept`,value:`stop 26 of 26`,facets:{},tags:[`long-road`],created:17934912e5,updated:17934912e5},{id:`p1`,label:`Simmer until done`,kind:`pathway`,value:null,facets:{},tags:[`simmer`],pathway:{op:`start`},created:17934912e5,updated:17934912e5},{id:`p2`,label:`read heat ← Temperature`,kind:`pathway`,value:null,facets:{},tags:[`simmer`],pathway:{op:`read`,target:`heat`,source:`temperature`},created:17934912e5,updated:17934912e5},{id:`p3`,label:`assign stirs ← 0`,kind:`pathway`,value:null,facets:{},tags:[`simmer`],pathway:{op:`assign`,target:`stirs`,expr:`0`},created:17934912e5,updated:17934912e5},{id:`p4`,label:`while heat is too low`,kind:`pathway`,value:null,facets:{},tags:[`simmer`],pathway:{op:`while`,expr:`heat < @"Boiling Point"`},created:17934912e5,updated:17934912e5},{id:`p5`,label:`assign heat ← heat + Flame Step`,kind:`pathway`,value:null,facets:{},tags:[`simmer`],pathway:{op:`assign`,target:`heat`,expr:`heat + @"Flame Step"`},created:17934912e5,updated:17934912e5},{id:`p6`,label:`assign stirs ← stirs + 1`,kind:`pathway`,value:null,facets:{},tags:[`simmer`],pathway:{op:`assign`,target:`stirs`,expr:`stirs + 1`},created:17934912e5,updated:17934912e5},{id:`p7`,label:`end: done after n stirs`,kind:`pathway`,value:null,facets:{},tags:[`simmer`],pathway:{op:`end`,expr:`"Done after " + stirs + " stirs · heat " + heat`},created:17934912e5,updated:17934912e5},{id:`q1`,label:`What should I do with it?`,kind:`pathway`,value:null,facets:{},tags:[`serve`],pathway:{op:`start`},created:17934912e5,updated:17934912e5},{id:`q2`,label:`read t ← Temperature`,kind:`pathway`,value:null,facets:{},tags:[`serve`],pathway:{op:`read`,target:`t`,source:`temperature`},created:17934912e5,updated:17934912e5},{id:`q3`,label:`if t > Safe To Touch`,kind:`pathway`,value:null,facets:{},tags:[`serve`],pathway:{op:`if`,expr:`t > @"Safe To Touch"`},created:17934912e5,updated:17934912e5},{id:`q4`,label:`end: Wait, too hot to touch.`,kind:`pathway`,value:null,facets:{},tags:[`serve`],pathway:{op:`end`,expr:`"Wait, too hot to touch."`},created:17934912e5,updated:17934912e5},{id:`q5`,label:`if t < Room`,kind:`pathway`,value:null,facets:{},tags:[`serve`],pathway:{op:`if`,expr:`t < @Room`},created:17934912e5,updated:17934912e5},{id:`q6`,label:`end: Warm it up.`,kind:`pathway`,value:null,facets:{},tags:[`serve`],pathway:{op:`end`,expr:`"Warm it up."`},created:17934912e5,updated:17934912e5},{id:`q7`,label:`end: Serve it.`,kind:`pathway`,value:null,facets:{},tags:[`serve`],pathway:{op:`end`,expr:`"Serve it."`},created:17934912e5,updated:17934912e5}],relations:[{id:`heat-01`,from:`temperature`,to:`heat`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-02`,from:`temperature`,to:`thermometer`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-03`,from:`boiling-point`,to:`temperature`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-04`,from:`ice`,to:`temperature`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-05`,from:`room`,to:`temperature`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-06`,from:`safe-to-touch`,to:`temperature`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-07`,from:`temperature`,to:`kelvin`,type:`association`,weight:1,directed:!1,perspectives:[`physicist`],created:17934912e5},{id:`heat-08`,from:`temperature`,to:`molecules`,type:`association`,weight:1,directed:!1,perspectives:[`physicist`],created:17934912e5},{id:`heat-09`,from:`heat`,to:`energy`,type:`association`,weight:1,directed:!1,label:`is-a`,perspectives:[`physicist`],created:17934912e5},{id:`heat-10`,from:`heat`,to:`stove`,type:`association`,weight:1,directed:!1,perspectives:[`cook`],created:17934912e5},{id:`heat-11`,from:`heat`,to:`burn`,type:`association`,weight:1,directed:!1,perspectives:[`cook`,`child`],created:17934912e5},{id:`heat-12`,from:`boiling-point`,to:`steam`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-13`,from:`steam`,to:`pot`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-14`,from:`pot`,to:`stove`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-15`,from:`soup`,to:`pot`,type:`part-of`,weight:1,directed:!1,label:`part-of`,created:17934912e5},{id:`heat-16`,from:`soup`,to:`steam`,type:`association`,weight:1,directed:!1,perspectives:[`cook`],created:17934912e5},{id:`heat-17`,from:`ice`,to:`molecules`,type:`association`,weight:1,directed:!1,perspectives:[`physicist`],created:17934912e5},{id:`heat-18`,from:`flame-step`,to:`stove`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`heat-19`,from:`safe-to-touch`,to:`burn`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`file-01`,from:`recipe`,to:`soup`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-02`,from:`recipe`,to:`pot`,type:`association`,weight:1,directed:!1,label:`references`,perspectives:[`cook`],created:17934912e5},{id:`file-03`,from:`lab-notes`,to:`kelvin`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-04`,from:`lab-notes`,to:`molecules`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-05`,from:`boiling-curve`,to:`boiling-point`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-06`,from:`shopping-list`,to:`recipe`,type:`association`,weight:1,directed:!1,perspectives:[`cook`],created:17934912e5},{id:`file-07`,from:`drawing-of-a-sun`,to:`heat`,type:`association`,weight:1,directed:!1,label:`references`,perspectives:[`child`],created:17934912e5},{id:`file-08`,from:`drawing-of-a-sun`,to:`bedtime-story`,type:`association`,weight:1,directed:!1,perspectives:[`child`],created:17934912e5},{id:`file-09`,from:`thermostat`,to:`room`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-10`,from:`kettle-manual`,to:`boiling-point`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-11`,from:`timer`,to:`meta-loop`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-12`,from:`timer`,to:`var-count`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-13`,from:`loop-notes`,to:`meta-loop`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-14`,from:`loop-notes`,to:`meta-condition`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-15`,from:`readme`,to:`meta-memory`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-16`,from:`sim-config`,to:`var-epsilon`,type:`association`,weight:1,directed:!1,label:`references`,created:17934912e5},{id:`file-17`,from:`sim-config`,to:`lab-notes`,type:`association`,weight:1,directed:!1,perspectives:[`physicist`],created:17934912e5},{id:`file-18`,from:`bedtime-story`,to:`soup`,type:`association`,weight:1,directed:!1,label:`references`,perspectives:[`child`],created:17934912e5},{id:`var-01`,from:`var-limit`,to:`var-count`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`var-02`,from:`var-count`,to:`var-i`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`var-03`,from:`var-i`,to:`var-step`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`var-04`,from:`var-done`,to:`meta-condition`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`var-05`,from:`var-total`,to:`var-count`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`var-06`,from:`var-unit`,to:`temperature`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`var-07`,from:`var-unit`,to:`kelvin`,type:`association`,weight:1,directed:!1,perspectives:[`physicist`],created:17934912e5},{id:`var-08`,from:`var-epsilon`,to:`var-limit`,type:`association`,weight:1,directed:!1,perspectives:[`physicist`],created:17934912e5},{id:`var-09`,from:`var-retries`,to:`meta-loop`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`var-10`,from:`var-name`,to:`meta-memory`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`meta-01`,from:`meta-memory`,to:`meta-perspective`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`meta-02`,from:`meta-memory`,to:`meta-relation`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`meta-03`,from:`meta-memory`,to:`meta-recall`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`meta-04`,from:`meta-memory`,to:`meta-pathway`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`meta-05`,from:`meta-shortcut`,to:`meta-relation`,type:`association`,weight:1,directed:!1,label:`is-a`,created:17934912e5},{id:`meta-06`,from:`meta-recall`,to:`meta-route`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`meta-07`,from:`meta-route`,to:`meta-shortcut`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`meta-08`,from:`meta-pathway`,to:`meta-loop`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`meta-09`,from:`meta-pathway`,to:`meta-condition`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`meta-10`,from:`meta-perspective`,to:`meta-facet`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`bridge-01`,from:`meta-facet`,to:`temperature`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`bridge-02`,from:`meta-route`,to:`road-a`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`bridge-03`,from:`meta-pathway`,to:`p1`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`bridge-04`,from:`meta-pathway`,to:`q1`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`bridge-05`,from:`meta-loop`,to:`p4`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`bridge-06`,from:`meta-condition`,to:`q3`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`road-01`,from:`road-a`,to:`road-b`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-02`,from:`road-b`,to:`road-c`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-03`,from:`road-c`,to:`road-d`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-04`,from:`road-d`,to:`road-e`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-05`,from:`road-e`,to:`road-f`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-06`,from:`road-f`,to:`road-g`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-07`,from:`road-g`,to:`road-h`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-08`,from:`road-h`,to:`road-i`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-09`,from:`road-i`,to:`road-j`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-10`,from:`road-j`,to:`road-k`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-11`,from:`road-k`,to:`road-l`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-12`,from:`road-l`,to:`road-m`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-13`,from:`road-m`,to:`road-n`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-14`,from:`road-n`,to:`road-o`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-15`,from:`road-o`,to:`road-p`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-16`,from:`road-p`,to:`road-q`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-17`,from:`road-q`,to:`road-r`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-18`,from:`road-r`,to:`road-s`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-19`,from:`road-s`,to:`road-t`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-20`,from:`road-t`,to:`road-u`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-21`,from:`road-u`,to:`road-v`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-22`,from:`road-v`,to:`road-w`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-23`,from:`road-w`,to:`road-x`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-24`,from:`road-x`,to:`road-y`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-25`,from:`road-y`,to:`road-z`,type:`chain`,weight:1,directed:!1,label:`next`,created:17934912e5},{id:`road-26`,from:`road-a`,to:`road-f`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`road-27`,from:`road-f`,to:`road-x`,type:`association`,weight:1,directed:!1,perspectives:[`physicist`,`cook`],created:17934912e5},{id:`road-28`,from:`road-x`,to:`road-z`,type:`association`,weight:1,directed:!1,created:17934912e5},{id:`flow-01`,from:`p1`,to:`p2`,type:`flow`,weight:1,directed:!0,branch:`next`,created:17934912e5},{id:`flow-02`,from:`p2`,to:`p3`,type:`flow`,weight:1,directed:!0,branch:`next`,created:17934912e5},{id:`flow-03`,from:`p3`,to:`p4`,type:`flow`,weight:1,directed:!0,branch:`next`,created:17934912e5},{id:`flow-04`,from:`p4`,to:`p5`,type:`flow`,weight:1,directed:!0,branch:`true`,label:`body`,created:17934912e5},{id:`flow-05`,from:`p5`,to:`p6`,type:`flow`,weight:1,directed:!0,branch:`next`,created:17934912e5},{id:`flow-06`,from:`p6`,to:`p4`,type:`flow`,weight:1,directed:!0,branch:`next`,label:`loop`,created:17934912e5},{id:`flow-07`,from:`p4`,to:`p7`,type:`flow`,weight:1,directed:!0,branch:`false`,label:`exit`,created:17934912e5},{id:`flow-08`,from:`q1`,to:`q2`,type:`flow`,weight:1,directed:!0,branch:`next`,created:17934912e5},{id:`flow-09`,from:`q2`,to:`q3`,type:`flow`,weight:1,directed:!0,branch:`next`,created:17934912e5},{id:`flow-10`,from:`q3`,to:`q4`,type:`flow`,weight:1,directed:!0,branch:`true`,label:`then`,created:17934912e5},{id:`flow-11`,from:`q3`,to:`q5`,type:`flow`,weight:1,directed:!0,branch:`false`,label:`else`,created:17934912e5},{id:`flow-12`,from:`q5`,to:`q6`,type:`flow`,weight:1,directed:!0,branch:`true`,label:`then`,created:17934912e5},{id:`flow-13`,from:`q5`,to:`q7`,type:`flow`,weight:1,directed:!0,branch:`false`,label:`else`,created:17934912e5},{id:`read-01`,from:`p2`,to:`temperature`,type:`association`,weight:1,directed:!1,label:`reads`,created:17934912e5},{id:`read-02`,from:`p4`,to:`boiling-point`,type:`association`,weight:1,directed:!1,label:`reads`,created:17934912e5},{id:`read-03`,from:`p5`,to:`flame-step`,type:`association`,weight:1,directed:!1,label:`reads`,created:17934912e5},{id:`read-04`,from:`q2`,to:`temperature`,type:`association`,weight:1,directed:!1,label:`reads`,created:17934912e5},{id:`read-05`,from:`q3`,to:`safe-to-touch`,type:`association`,weight:1,directed:!1,label:`reads`,created:17934912e5},{id:`read-06`,from:`q5`,to:`room`,type:`association`,weight:1,directed:!1,label:`reads`,created:17934912e5}]},t=`constellation.memory`,n=class extends Error{code;pos;constructor(e,t,n){super(t),this.name=`CoreError`,this.code=e,n!==void 0&&(this.pos=n)}};function r(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return t>>>0}function i(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var a=/^[A-Za-z_][A-Za-z0-9_]*$/,o=new Set([`constructor`,`prototype`,`__proto__`,`hasOwnProperty`,`toString`,`valueOf`,`isPrototypeOf`,`propertyIsEnumerable`,`toLocaleString`]);function s(e){return o.has(e)||e.startsWith(`__`)}function c(e){return typeof e==`string`&&a.test(e)&&!s(e)&&![`and`,`or`,`not`,`true`,`false`,`null`].includes(e)}function l(e){return e===null||typeof e==`string`||typeof e==`boolean`||typeof e==`number`&&Number.isFinite(e)}function u(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function d(e){return String(Number.isInteger(e)?e:Number(e.toPrecision(12)))}function f(e){return typeof e==`string`?JSON.stringify(e):typeof e==`number`?d(e):String(e)}function p(e){if(e&&typeof e==`object`&&!Object.isFrozen(e)){Object.freeze(e);for(let t of Object.values(e))p(t)}return e}function m(e){return{x:e.x,y:e.y,z:e.z}}function h(e){let t={name:e.name};return e.path!==void 0&&(t.path=e.path),e.mime!==void 0&&(t.mime=e.mime),e.sizeNote!==void 0&&(t.sizeNote=e.sizeNote),e.content!==void 0&&(t.content=e.content),t}function g(e){let t={op:e.op};return e.target!==void 0&&(t.target=e.target),e.expr!==void 0&&(t.expr=e.expr),e.source!==void 0&&(t.source=e.source),t}function _(e){return Object.fromEntries(Object.entries(e).filter(([,e])=>e!==void 0))}function v(e){return Object.fromEntries(Object.entries(e).filter(([,e])=>e!==void 0))}var y=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;function b(e){let t={id:e.id,label:e.label,kind:e.kind,value:e.value,facets:_(e.facets)};return e.units!==void 0&&(t.units=v(e.units)),t.tags=[...e.tags],e.notes!==void 0&&(t.notes=e.notes),e.file!==void 0&&(t.file=h(e.file)),e.pathway!==void 0&&(t.pathway=g(e.pathway)),t.created=e.created,t.updated=e.updated,t}function x(e){let t={id:e.id,from:e.from,to:e.to,type:e.type,weight:e.weight,directed:e.directed};return e.branch!==void 0&&(t.branch=e.branch),e.label!==void 0&&(t.label=e.label),e.perspectives!==void 0&&(t.perspectives=[...e.perspectives]),t.created=e.created,t}function S(e){let t={id:e.id,label:e.label};return e.description!==void 0&&(t.description=e.description),e.accent!==void 0&&(t.accent=e.accent),e.positions!==void 0&&(t.positions=Object.fromEntries(Object.entries(e.positions).flatMap(([e,t])=>t?[[e,m(t)]]:[]))),t}function C(e){let t=e.description===void 0?{title:e.title,defaultPerspective:e.defaultPerspective}:{title:e.title,description:e.description,defaultPerspective:e.defaultPerspective};if(e.featured!==void 0){let n={};e.featured.route&&(n.route={from:e.featured.route.from,to:e.featured.route.to}),e.featured.pathway!==void 0&&(n.pathway=e.featured.pathway),e.featured.query!==void 0&&(n.query=e.featured.query),t.featured=n}return t}function w(e){return typeof e==`string`&&e.trim()?` ("${e.trim()}")`:``}var T=[`concept`,`variable`,`file`,`note`,`pathway`],E=[`association`,`chain`,`part-of`,`causes`,`shortcut`,`flow`],D=[`start`,`assign`,`if`,`while`,`read`,`end`],O=[`next`,`true`,`false`];function k(e,t){let n=e.units;if(n)return(u(n,t)?n[t]:void 0)??(u(n,`*`)?n[`*`]:void 0)}function A(e){return e!==void 0&&e.trimStart().startsWith(`·`)}function j(e,t){let n=e===null?`empty`:typeof e==`number`?d(e):String(e);return typeof e==`number`&&t?`${n} ${t.trim()}`:n}function M(e){return new F(e??N())}function N(e=`Untitled memory`){return{schema:t,version:1,meta:{title:e,defaultPerspective:`base`},perspectives:[{id:`base`,label:`Base`}],nodes:[],relations:[]}}var P=Object.freeze([]),F=class{#e;#t=new Map;#n=new Map;#r=new Map;#i=new Map;#a=new Set;#o=null;#s=null;#c=null;#l=new Map;#u=1;#d=1;#f=0;constructor(e){this.#p(e)}get meta(){return this.#e}getNode(e){return this.#t.get(e)}nodes(){return this.#o??=Object.freeze([...this.#t.values()])}findByLabel(e){let t=e.trim();if(!t)return;let n=t.toLowerCase(),r;for(let e of this.#t.values()){let i=e.label.trim();if(i===t)return e;!r&&i.toLowerCase()===n&&(r=e)}return r}addNode(e){if(!e||typeof e!=`object`)throw new n(`invalid`,`A new thing needs at least a name.`);let t=e.id??this.#v(`n_`,this.#t,()=>this.#u++);if(typeof t!=`string`||!t.trim())throw new n(`invalid`,`An id must be a non-empty piece of text.`);if(this.#t.has(t))throw new n(`duplicate`,`There's already a node with the id "${t}".`);let r=this.#y(),i={id:t,label:e.label,kind:e.kind??`concept`,value:e.value===void 0?null:e.value,facets:{...e.facets??{}},tags:[...e.tags??[]],created:r,updated:r};e.units!==void 0&&(i.units=v(e.units)),e.notes!==void 0&&(i.notes=e.notes),e.file!==void 0&&(i.file=h(e.file)),e.pathway!==void 0&&(i.pathway=g(e.pathway)),this.#b(i);let a=p(b(i));return this.#t.set(t,a),this.#i.set(t,new Set),this.#o=null,this.#g({type:`node-added`,node:a}),a}updateNode(e,t){let r=this.#_(e),i={...r,facets:{...r.facets},tags:[...r.tags]};for(let e of Object.keys(t??{})){if(![`label`,`kind`,`value`,`facets`,`units`,`tags`,`notes`,`file`,`pathway`].includes(e))throw new n(`invalid`,`"${String(e)}" can't be changed on a node.`);let r=t[e];r===void 0?(e===`units`||e===`notes`||e===`file`||e===`pathway`)&&delete i[e]:i[e]=e===`facets`||e===`units`?{...r}:e===`tags`?[...r]:r}i.updated=Math.max(this.#y(),r.updated),this.#b(i);let a=p(b(i));return this.#t.set(e,a),this.#o=null,this.#g({type:`node-updated`,node:a,previous:r}),a}removeNode(e){let t=this.#_(e),n=[...this.relationsOf(e)];for(let e of n)this.#h(e);this.#t.delete(e),this.#i.delete(e),this.#l.delete(e),this.#o=null,this.#g({type:`node-removed`,node:t,relations:n})}getRelation(e){return this.#n.get(e)}relations(){return this.#s??=Object.freeze([...this.#n.values()])}relationsOf(e){let t=this.#l.get(e);if(t)return t;let n=this.#i.get(e);if(!n)return P;let r=Object.freeze([...n].map(e=>this.#n.get(e)));return this.#l.set(e,r),r}addRelation(e){if(!e||typeof e!=`object`)throw new n(`invalid`,`A line needs two ends.`);let t=e.id??this.#v(`r_`,this.#n,()=>this.#d++);if(typeof t!=`string`||!t.trim())throw new n(`invalid`,`An id must be a non-empty piece of text.`);if(this.#n.has(t))throw new n(`duplicate`,`There's already a line with the id "${t}".`);let r=e.type??`association`,i={id:t,from:e.from,to:e.to,type:r,weight:e.weight??.5,directed:e.directed??(r===`chain`||r===`flow`),created:this.#y()};e.branch===void 0?r===`flow`&&(i.branch=`next`):i.branch=e.branch,e.label!==void 0&&(i.label=e.label),e.perspectives!==void 0&&(i.perspectives=[...e.perspectives]),this.#x(i);let a=p(x(i));return this.#m(a),this.#g({type:`relation-added`,relation:a}),a}updateRelation(e,t){let r=this.#n.get(e);if(!r)throw new n(`not-found`,`No line has the id "${e}".`);let i={...r};for(let e of Object.keys(t??{})){if(![`type`,`weight`,`directed`,`branch`,`label`,`perspectives`].includes(e))throw new n(`invalid`,`"${String(e)}" can't be changed on a line.`);let r=t[e];r===void 0?(e===`branch`||e===`label`||e===`perspectives`)&&delete i[e]:i[e]=e===`perspectives`?[...r]:r}this.#x(i);let a=p(x(i));return this.#n.set(e,a),this.#s=null,this.#l.delete(a.from),this.#l.delete(a.to),this.#g({type:`relation-updated`,relation:a,previous:r}),a}removeRelation(e){let t=this.#n.get(e);if(!t)throw new n(`not-found`,`No line has the id "${e}".`);this.#h(t),this.#g({type:`relation-removed`,relation:t})}perspectives(){return this.#c??=Object.freeze([...this.#r.values()])}getPerspective(e){return this.#r.get(e)}addPerspective(e){if(!e||typeof e.id!=`string`||!e.id.trim())throw new n(`invalid`,`A perspective needs an id.`);if(this.#r.has(e.id))throw new n(`duplicate`,`There's already a perspective with the id "${e.id}".`);this.#S(e);let t=p(S(e));return this.#r.set(e.id,t),this.#c=null,this.#g({type:`perspective-added`,perspective:t}),t}updatePerspective(e,t){let r=this.#r.get(e);if(!r)throw new n(`not-found`,`No perspective has the id "${e}".`);if(t&&u(t,`id`))throw new n(`invalid`,`A perspective's id can't be changed.`);let i={...r};for(let[e,r]of Object.entries(t??{})){if(![`label`,`description`,`accent`,`positions`].includes(e))throw new n(`invalid`,`"${e}" can't be changed on a perspective.`);r===void 0?delete i[e]:i[e]=r}this.#S(i);let a=p(S(i));return this.#r.set(e,a),this.#c=null,this.#g({type:`perspective-updated`,perspective:a}),a}load(e){this.#p(e),this.#g({type:`reset`})}on(e){return this.#a.add(e),()=>{this.#a.delete(e)}}#p(e){if(!e||!Array.isArray(e.perspectives)||!Array.isArray(e.nodes)||!Array.isArray(e.relations))throw new n(`invalid`,`That is not a memory document. Run it through validateDoc first.`);let t=new Map,r=new Map,i=new Map,a=new Map;for(let t of e.perspectives){if(i.has(t.id))throw new n(`duplicate`,`Two perspectives share the id "${t.id}".`);i.set(t.id,p(S(t)))}for(let r of e.nodes){if(t.has(r.id))throw new n(`duplicate`,`Two nodes share the id "${r.id}".`);t.set(r.id,p(b(r))),a.set(r.id,new Set)}for(let t of e.relations){if(r.has(t.id))throw new n(`duplicate`,`Two lines share the id "${t.id}".`);let e=a.get(t.from),i=a.get(t.to);if(!e||!i)throw new n(`not-found`,`Line "${t.id}" touches a node that doesn't exist.`);r.set(t.id,p(x(t))),e.add(t.id),i.add(t.id)}this.#e=p(C(e.meta)),this.#t=t,this.#n=r,this.#r=i,this.#i=a,this.#o=this.#s=this.#c=null,this.#l.clear(),this.#u=1,this.#d=1}#m(e){this.#n.set(e.id,e),this.#i.get(e.from).add(e.id),this.#i.get(e.to).add(e.id),this.#l.delete(e.from),this.#l.delete(e.to),this.#s=null}#h(e){this.#n.delete(e.id),this.#i.get(e.from)?.delete(e.id),this.#i.get(e.to)?.delete(e.id),this.#l.delete(e.from),this.#l.delete(e.to),this.#s=null}#g(e){for(let t of[...this.#a])t(e)}#_(e){let t=this.#t.get(e);if(!t)throw new n(`not-found`,`No node has the id "${e}".`);return t}#v(e,t,n){for(;;){let r=e+n().toString(36);if(!t.has(r))return r}}#y(){let e=Date.now();return this.#f=e>this.#f?e:this.#f+1,this.#f}#b(e){if(typeof e.label!=`string`||!e.label.trim())throw new n(`invalid`,`Give it a name, even one word.`);if(!T.includes(e.kind))throw new n(`invalid`,`"${String(e.kind)}" isn't a kind of node. Use concept, variable, file, note or pathway.`);I(e.value,`Its value`);for(let[t,r]of Object.entries(e.facets)){if(!this.#r.has(t))throw new n(`invalid`,`There is no perspective "${t}" to hold a value for.`);I(r,`Its value under ${this.#r.get(t).label}`)}if(e.units!==void 0){if(!e.units||typeof e.units!=`object`||Array.isArray(e.units))throw new n(`invalid`,`Units must be an object of perspective → unit text.`);for(let[t,r]of Object.entries(e.units)){if(t!==`*`&&!this.#r.has(t))throw new n(`invalid`,`There is no perspective "${t}" to hold a unit for.`);if(typeof r!=`string`||!r.trim()||r.length>40)throw new n(`invalid`,`A unit is a short piece of text (up to 40 characters), like "°C".`)}}if(!Array.isArray(e.tags)||e.tags.some(e=>typeof e!=`string`))throw new n(`invalid`,`Tags must be a list of words.`);if(e.notes!==void 0&&typeof e.notes!=`string`)throw new n(`invalid`,`Notes must be text.`);if(e.file!==void 0){if(typeof e.file.name!=`string`||!e.file.name.trim())throw new n(`invalid`,`A file needs a name.`);if(e.file.content!==void 0&&(typeof e.file.content!=`string`||e.file.content.length>65536))throw new n(`invalid`,`File contents hold up to 64 KB of text. Store a path to anything bigger.`)}if(e.pathway!==void 0&&e.kind!==`pathway`)throw new n(`invalid`,`Only pathway nodes can carry a pathway step.`)}#x(e){if(!this.#t.has(e.from))throw new n(`not-found`,`A line can't start at "${e.from}": no node has that id.`);if(!this.#t.has(e.to))throw new n(`not-found`,`A line can't end at "${e.to}": no node has that id.`);if(e.from===e.to)throw new n(`invalid`,`A line needs two different ends.`);if(!E.includes(e.type))throw new n(`invalid`,`"${String(e.type)}" isn't a type of line.`);if(typeof e.weight!=`number`||!(e.weight>0&&e.weight<=1))throw new n(`invalid`,`A line's weight must be above 0 and at most 1.`);if(typeof e.directed!=`boolean`)throw new n(`invalid`,`A line is either directed or not.`);if(e.type===`flow`&&!e.directed)throw new n(`invalid`,`Pathway (flow) lines always point one way.`);if(e.branch!==void 0){if(e.type!==`flow`)throw new n(`invalid`,`Only pathway (flow) lines have a branch.`);if(!O.includes(e.branch))throw new n(`invalid`,`"${String(e.branch)}" isn't a branch. Use next, true or false.`)}if(e.perspectives!==void 0){if(!Array.isArray(e.perspectives)||e.perspectives.length===0)throw new n(`invalid`,`A lens-only line needs at least one perspective.`);for(let t of e.perspectives)if(!this.#r.has(t))throw new n(`invalid`,`There is no perspective "${t}" for this line to appear in.`)}}#S(e){if(typeof e.label!=`string`||!e.label.trim())throw new n(`invalid`,`A perspective needs a name.`);if(e.accent!==void 0&&(typeof e.accent!=`string`||!y.test(e.accent)))throw new n(`invalid`,`An accent colour is a hex colour like "#FF9F5A" or "#f95".`);for(let[t,r]of Object.entries(e.positions??{}))if(!r||![r.x,r.y,r.z].every(e=>typeof e==`number`&&Number.isFinite(e)))throw new n(`invalid`,`The position for "${t}" needs finite x, y and z numbers.`)}};function I(e,t){if(!l(e))throw new n(`invalid`,`${t} must be text, a number, true/false or empty.`);if(typeof e==`string`&&e.length>500)throw new n(`invalid`,`Values hold up to 500 characters. Put longer text in a File.`)}function L(e,t){if(u(e.facets,t)){let n=e.facets[t];if(n!==void 0)return n}return e.value}function ee(e,t){return t.map(t=>{let n=u(e.facets,t.id)&&e.facets[t.id]!==void 0,r={perspective:t.id,value:L(e,t.id),own:n},i=k(e,t.id);return i!==void 0&&(r.unit=i),r})}function te(e,t){if(t.length<2)return!1;let n=L(e,t[0].id);for(let r=1;r<t.length;r++)if(L(e,t[r].id)!==n)return!0;return!1}function ne(e,t){return e.perspectives===void 0||e.perspectives.includes(t)}function R(e,t){return e.relations().filter(e=>ne(e,t))}var z=8,B=z*1.5;function re(e,t,n){return ue(e,t,n??{},null)}function ie(e,t){let n=se(e),r=n.get(t);return r||(r=ae(e,t),n.set(t,r)),ce(r)}function ae(e,t){let n=e.nodes(),r=e.getPerspective(t)?.positions??{},i=new Map;for(let e of n){let t=u(r,e.id)?r[e.id]:void 0;t&&i.set(e.id,{x:t.x,y:t.y,z:t.z})}let a=R(e,t);if(i.size===0)return re(n,a,{seed:t});if(i.size===n.length){let e=new Map;for(let t of n)e.set(t.id,i.get(t.id));return e}return ue(n,a,{seed:t},i)}var oe=new WeakMap;function se(e){let t=oe.get(e);if(!t){let n=new Map;e.on(()=>n.clear()),oe.set(e,n),t=n}return t}function ce(e){let t=new Map;for(let[n,r]of e)t.set(n,{x:r.x,y:r.y,z:r.z});return t}function le(e){let t=e()*2-1,n=e()*Math.PI*2,r=Math.sqrt(1-t*t);return{x:r*Math.cos(n),y:r*Math.sin(n),z:t}}function ue(e,t,n,a){let o=Math.max(0,Math.floor(n.iterations??300)),s=n.radius??60,c=n.seed??``,l=[...new Set(e.map(e=>e.id))].sort(),u=l.length,d=new Map;if(u===0)return d;let f=new Map;l.forEach((e,t)=>f.set(e,t));let p=new Float64Array(u),m=new Float64Array(u),h=new Float64Array(u),g=new Float64Array(u),_=new Float64Array(u),v=new Float64Array(u),y=new Float64Array(u),b=new Float64Array(u),x=new Float64Array(u),S=new Uint8Array(u),C=new Map;for(let e of t){let t=f.get(e.from),n=f.get(e.to);if(t===void 0||n===void 0||t===n)continue;let r=t<n?t*u+n:n*u+t;C.set(r,Math.max(C.get(r)??0,e.weight))}let w=[...C.keys()].sort((e,t)=>e-t),T=new Int32Array(w.length),E=new Int32Array(w.length),D=new Float64Array(w.length),O=l.map(()=>[]);w.forEach((e,t)=>{let n=Math.floor(e/u),r=e%u;T[t]=n,E[t]=r,D[t]=C.get(e),O[n].push(r),O[r].push(n)});let k=l.map(e=>i(r(c+e))),A=new Uint8Array(u);if(a){let e=0,t=0,n=0,r=0,i=[];for(let o=0;o<u;o++){let s=a.get(l[o]);s&&(p[o]=s.x,m[o]=s.y,h[o]=s.z,S[o]=1,A[o]=1,e+=s.x,t+=s.y,n+=s.z,r++,i.push(o))}e/=r,t/=r,n/=r;for(let e=0;e<i.length;e++){let t=i[e];for(let e of O[t]){if(A[e])continue;let n=le(k[e]);p[e]=p[t]+n.x*z,m[e]=m[t]+n.y*z,h[e]=h[t]+n.z*z,A[e]=1,i.push(e)}}let o=0;for(let r=0;r<u;r++)S[r]&&(o=Math.max(o,Math.hypot(p[r]-e,m[r]-t,h[r]-n)));for(let r=0;r<u;r++){if(A[r])continue;let i=le(k[r]),a=o+16+k[r]()*z;p[r]=e+i.x*a,m[r]=t+i.y*a,h[r]=n+i.z*a}for(let e=0;e<u;e++)y[e]=p[e],b[e]=m[e],x[e]=h[e]}else{let e=z*Math.cbrt(u)*1.2;for(let t=0;t<u;t++){let n=k[t],r=le(n),i=e*Math.cbrt(n());p[t]=r.x*i,m[t]=r.y*i,h[t]=r.z*i}}let j=a?.04:.01,M=a?z*.5:16,N=new de(u),P=new Float64Array(u),F=new Float64Array(u),I=new Float64Array(u);for(let e=0;e<o;e++){let t=M*(1-e/o)+.01;e%(e<o/2?2:4)==0&&(P.fill(0),F.fill(0),I.fill(0),N.repulse(p,m,h,P,F,I,64)),g.set(P),_.set(F),v.set(I);for(let e=0;e<T.length;e++){let t=T[e],n=E[e],r=p[t]-p[n],i=m[t]-m[n],a=h[t]-h[n],o=Math.sqrt(r*r+i*i+a*a)/z*D[e];g[t]=g[t]-r*o,_[t]=_[t]-i*o,v[t]=v[t]-a*o,g[n]=g[n]+r*o,_[n]=_[n]+i*o,v[n]=v[n]+a*o}for(let e=0;e<u;e++){if(S[e])continue;let n=g[e],r=_[e],i=v[e];a?(n-=(p[e]-y[e])*j*z,r-=(m[e]-b[e])*j*z,i-=(h[e]-x[e])*j*z):(n-=p[e]*j*z,r-=m[e]*j*z,i-=h[e]*j*z);let o=Math.sqrt(n*n+r*r+i*i);if(o>0){let a=Math.min(o,t)/o;p[e]=p[e]+n*a,m[e]=m[e]+r*a,h[e]=h[e]+i*a}}}if(!a){let e=0,t=0,n=0;for(let r=0;r<u;r++)e+=p[r],t+=m[r],n+=h[r];e/=u,t/=u,n/=u;let r=0;for(let i=0;i<u;i++)r=Math.max(r,Math.hypot(p[i]-e,m[i]-t,h[i]-n));let i=r>1e-9?s/r:0;for(let r=0;r<u;r++)p[r]=(p[r]-e)*i,m[r]=(m[r]-t)*i,h[r]=(h[r]-n)*i}for(let e=0;e<u;e++)d.set(l[e],{x:p[e],y:m[e],z:h[e]});return d}var de=class{n;cellOf;order;pos;force;slotCell;forward=new Int32Array(13);starts=new Int32Array(1);fill=new Int32Array(1);constructor(e){this.n=e,this.cellOf=new Int32Array(e),this.order=new Int32Array(e),this.slotCell=new Int32Array(e),this.pos=new Float64Array(e*3),this.force=new Float64Array(e*3)}repulse(e,t,n,r,i,a,o){let s=this.n,c=1/0,l=1/0,u=1/0,d=-1/0,f=-1/0,p=-1/0;for(let r=0;r<s;r++){let i=e[r],a=t[r],o=n[r];i<c&&(c=i),i>d&&(d=i),a<l&&(l=a),a>f&&(f=a),o<u&&(u=o),o>p&&(p=o)}let m=Math.max(B,(d-c)/40,(f-l)/40,(p-u)/40),h=Math.floor((d-c)/m)+3,g=Math.floor((f-l)/m)+3,_=Math.floor((p-u)/m)+3,v=h*g*_;this.starts.length<v+1&&(this.starts=new Int32Array(v+1),this.fill=new Int32Array(v+1));let y=this.starts,b=this.fill,x=this.cellOf,S=this.order;y.fill(0,0,v+1);for(let r=0;r<s;r++){let i=Math.floor((e[r]-c)/m)+1+h*(Math.floor((t[r]-l)/m)+1+g*(Math.floor((n[r]-u)/m)+1));x[r]=i,y[i+1]=y[i+1]+1}for(let e=0;e<v;e++)y[e+1]=y[e+1]+y[e];b.set(y.subarray(0,v));let C=this.pos,w=this.force,T=this.slotCell;for(let r=0;r<s;r++){let i=x[r],a=b[i];b[i]=a+1,S[a]=r,T[a]=i,C[a*3]=e[r],C[a*3+1]=t[r],C[a*3+2]=n[r]}w.fill(0);let E=this.forward,D=0;for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++)for(let n=-1;n<=1;n++)(e>0||e===0&&(t>0||t===0&&n>0))&&(E[D++]=n+h*(t+g*e));for(let e=0;e<s;e++){let t=T[e],n=C[e*3],r=C[e*3+1],i=C[e*3+2],a=0,s=0,c=0;for(let l=-1;l<13;l++){let u,d;if(l<0)u=e+1,d=y[t+1];else{let e=t+E[l];u=y[e],d=y[e+1]}for(;u<d;u++){let t=u*3,l=n-C[t],d=r-C[t+1],f=i-C[t+2],p=l*l+d*d+f*f;if(p>144)continue;if(p<1e-6){let t=S[e],n=S[u],r=t<n?t:n,i=t<n?n:t,a=t<n?1:-1,o=(r*7919+i*104729)%360*(Math.PI/180);l=Math.cos(o)*.01*a,d=Math.sin(o)*.01*a,f=.005*a,p=l*l+d*d+f*f}let m=o/p;a+=l*m,s+=d*m,c+=f*m,w[t]=w[t]-l*m,w[t+1]=w[t+1]-d*m,w[t+2]=w[t+2]-f*m}}w[e*3]=w[e*3]+a,w[e*3+1]=w[e*3+1]+s,w[e*3+2]=w[e*3+2]+c}for(let e=0;e<s;e++){let t=S[e];r[t]=r[t]+w[e*3],i[t]=i[t]+w[e*3+1],a[t]=a[t]+w[e*3+2]}}},fe=1e-9;function pe(e,t,n,r){return V(e,t,n,r,`declared`)}function me(e,t,n,r){return V(e,t,n,r,`shortest`)}function he(e,t,n,r){let i=pe(e,t,n,r),a=me(e,t,n,r);return{from:t,to:n,declared:i,shortest:a,savedHops:i&&a?i.hops-a.hops:0}}function ge(e,t,r=.9){if(!t||t.hops<2||t.nodes.length<3)throw new n(`invalid`,`Already one hop. Nothing shorter to learn.`);let i=t.nodes[0],a=t.nodes[t.nodes.length-1];if(i===a)throw new n(`invalid`,`That route ends where it starts, so there is no shortcut to learn.`);let o=e.relationsOf(i).filter(e=>e.type===`shortcut`&&(e.from===i&&e.to===a||e.from===a&&e.to===i)).sort((e,t)=>e.id<t.id?-1:1),s=o.find(e=>e.perspectives===void 0);if(s)return{relation:s,outcome:`existing`,learned:!1};let c=o[0];return c?{relation:e.updateRelation(c.id,{perspectives:void 0}),outcome:`widened`,learned:!0,previous:c}:{relation:e.addRelation({from:i,to:a,type:`shortcut`,weight:r,directed:!1}),outcome:`added`,learned:!0}}function _e(e,t){if(Math.abs(e.cost-t.cost)>fe)return e.cost-t.cost;if(e.hops!==t.hops)return e.hops-t.hops;let n=Math.min(e.nodes.length,t.nodes.length);for(let r=0;r<n;r++){let n=e.nodes[r],i=t.nodes[r];if(n!==i)return n<i?-1:1}return e.nodes.length-t.nodes.length}function V(e,t,n,r,i){if(!e.getNode(t)||!e.getNode(n))return null;if(t===n)return{kind:i,nodes:[t],relations:[],hops:0,cost:0};let a=new Set(r?.excludeTypes??[`flow`]),o=r?.perspective,s=e=>(i===`declared`?e.type===`chain`:!a.has(e.type))&&(o===void 0||ne(e,o)),c=new Map,l=new Set,u=new ye(_e),d={node:t,cost:0,hops:0,nodes:[t],relations:[]};for(c.set(t,d),u.push(d);u.size;){let t=u.pop();if(!(l.has(t.node)||c.get(t.node)!==t)){if(l.add(t.node),t.node===n)return{kind:i,nodes:t.nodes,relations:t.relations,hops:t.hops,cost:ve(t.cost)};for(let n of e.relationsOf(t.node)){if(!s(n))continue;let e;if(n.from===t.node)e=n.to;else if(!n.directed)e=n.from;else continue;if(l.has(e))continue;let r={node:e,cost:t.cost+1/n.weight,hops:t.hops+1,nodes:[...t.nodes,e],relations:[...t.relations,n.id]},i=c.get(e);(!i||_e(r,i)<0)&&(c.set(e,r),u.push(r))}}}return null}function ve(e){return Math.round(e*1e9)/1e9}var ye=class{#e=[];#t;constructor(e){this.#t=e}get size(){return this.#e.length}push(e){let t=this.#e;t.push(e);let n=t.length-1;for(;n>0;){let e=n-1>>1;if(this.#t(t[n],t[e])>=0)break;[t[n],t[e]]=[t[e],t[n]],n=e}}pop(){let e=this.#e,t=e[0],n=e.pop();if(e.length&&n!==void 0){e[0]=n;let t=0;for(;;){let n=2*t+1,r=n+1,i=t;if(n<e.length&&this.#t(e[n],e[i])<0&&(i=n),r<e.length&&this.#t(e[r],e[i])<0&&(i=r),i===t)break;[e[t],e[i]]=[e[i],e[t]],t=i}}return t}};function be(e){return e.normalize(`NFD`).replace(/\p{M}+/gu,``).toLowerCase().replace(/\s+/g,` `).trim()}function H(e){return e===null?null:typeof e==`number`?d(e):String(e)}function xe(e,t,n){let r=be(t??``);if(!r)return[];let i=n??e.meta.defaultPerspective,a=[];for(let t of e.nodes()){let e=0,n=`label`,o=(t,r)=>{t>e&&(e=t,n=r)},s=be(t.label);if(s===r?o(1,`label`):s.startsWith(r)?o(.9,`label`):s.split(/[^\p{L}\p{N}]+/u).some(e=>e.startsWith(r))?o(.8,`label`):s.includes(r)&&o(.7,`label`),e<.6){let e=H(L(t,i));e!==null&&be(e).includes(r)&&o(.6,`value`)}if(e<.55&&t.file&&(be(t.file.name).includes(r)||t.file.path!==void 0&&be(t.file.path).includes(r))&&o(.55,`file`),e<.5&&t.tags.some(e=>be(e).includes(r))&&o(.5,`tag`),e<.45)for(let e of[t.value,...Object.values(t.facets)]){let t=e===void 0?null:H(e);if(t!==null&&be(t).includes(r)){o(.45,`facet`);break}}e<.4&&t.notes!==void 0&&be(t.notes).includes(r)&&o(.4,`notes`),e>0&&a.push({nodeId:t.id,score:e,field:n})}return a.sort((e,t)=>t.score-e.score||(e.nodeId<t.nodeId?-1:+(e.nodeId>t.nodeId))),a}function U(e,t,n){let r=n?.decay??.6,i=n?.maxDepth??3,a=n?.threshold??.05,o=n?.perspective,s=new Map,c=new Map,l=new Map;for(let n of t){if(!e.getNode(n.nodeId)||!(n.activation>=a))continue;let t=Math.min(1,n.activation);t>(c.get(n.nodeId)??0)&&c.set(n.nodeId,t),s.set(n.nodeId,0),t>(l.get(n.nodeId)??0)&&l.set(n.nodeId,t)}for(let t=1;t<=i&&l.size;t++){let n=new Map;for(let[i,u]of l)for(let l of e.relationsOf(i)){if(l.type===`flow`||o!==void 0&&!ne(l,o))continue;let e=l.from===i?l.to:l.from,d=u*r*l.weight;d<a||(s.has(e)||s.set(e,t),d>(c.get(e)??0)&&(c.set(e,d),d>(n.get(e)??0)&&n.set(e,d)))}l=n}let u=[];for(let[e,t]of c)u.push({nodeId:e,depth:s.get(e),activation:t});return u.sort((e,t)=>t.activation-e.activation||e.depth-t.depth||(e.nodeId<t.nodeId?-1:+(e.nodeId>t.nodeId))),u}function W(e,t,n){let r=xe(e,t,n?.perspective);return{query:t,matches:r,activations:U(e,r.map(e=>({nodeId:e.nodeId,activation:e.score})),n)}}var Se=500,Ce=64,we=new Set([`and`,`or`,`not`,`true`,`false`,`null`]),Te=new Set([`==`,`!=`,`<`,`<=`,`>`,`>=`]);function Ee(e,t){throw new n(`parse`,`${e} at column ${t+1}`,t)}function De(e){switch(e.t){case`eof`:return`the end`;case`num`:return d(e.v);case`str`:return JSON.stringify(e.v);case`ref`:return`@${e.v}`;default:return`"${e.v}"`}}function Oe(e){let t=[],n=0,r=e=>e!==void 0&&e>=`0`&&e<=`9`,i=e=>e!==void 0&&/[A-Za-z_]/.test(e),a=e=>e!==void 0&&/[A-Za-z0-9_]/.test(e),o=(t,n)=>{let r=n+1,i=``;for(;;){let a=e[r];if(a===void 0&&Ee(`Expected a closing ${t}`,n),a===t)return[i,r+1];if(a===`\\`){let t=e[r+1];if(t===`"`||t===`'`||t===`\\`){i+=t,r+=2;continue}Ee(`Unknown escape "\\${t??``}" (only \\" \\' and \\\\ are allowed)`,r)}i+=a,r++}};for(;n<e.length;){let c=e[n];if(c===` `||c===`	`||c===`
`||c===`\r`){n++;continue}let l=n;if(r(c)){for(;r(e[n]);)n++;if(e[n]===`.`)for(r(e[n+1])||Ee(`Expected a digit after "."`,n+1),n++;r(e[n]);)n++;i(e[n])&&Ee(`Expected an operator after the number`,n);let a=Number(e.slice(l,n));Number.isFinite(a)||Ee(`That number is too large to keep`,l),t.push({t:`num`,v:a,pos:l});continue}if(c===`"`||c===`'`){let[e,r]=o(c,n);t.push({t:`str`,v:e,pos:l}),n=r;continue}if(c===`@`){if(e[n+1]===`"`){let[e,r]=o(`"`,n+1);e.trim()||Ee(`Expected a label inside @"…"`,n),t.push({t:`ref`,v:e,pos:l}),n=r;continue}for(i(e[n+1])||Ee(`Expected a label after "@" (use @Name or @"Long name")`,n),n++;a(e[n]);)n++;t.push({t:`ref`,v:e.slice(l+1,n),pos:l});continue}if(i(c)){for(;a(e[n]);)n++;let r=e.slice(l,n);!we.has(r)&&s(r)&&Ee(`"${r}" is a reserved name and can't be used`,l),t.push({t:`id`,v:r,pos:l});continue}let u=e.slice(n,n+2);u===`==`||u===`!=`||u===`<=`||u===`>=`?(t.push({t:`op`,v:u,pos:l}),n+=2):`+-*/<>()`.includes(c)?(t.push({t:`op`,v:c,pos:l}),n++):(c===`=`&&Ee(`Expected "==" to compare (a single "=" assigns, which expressions cannot do)`,l),Ee(`Unexpected "${c}"`,l))}return t.push({t:`eof`,pos:e.length}),t}var ke=class{#e;#t=0;#n=0;constructor(e){this.#e=e}get peek(){return this.#e[this.#t]}next(){return this.#e[this.#t++]}isOp(e){let t=this.peek;return t.t===`op`&&t.v===e}isWord(e){let t=this.peek;return t.t===`id`&&t.v===e}parse(){let e=this.or(),t=this.peek;return t.t!==`eof`&&(t.t===`op`&&t.v===`(`&&Ee(`Calls like name(…) aren't allowed: expressions only read values`,t.pos),t.t===`op`&&Te.has(t.v)&&Ee(`Compare two things at a time (use "and" to join comparisons)`,t.pos),t.t===`op`&&t.v===`)`&&Ee(`Unexpected ")"`,t.pos),Ee(`Expected an operator before ${De(t)}`,t.pos)),e}or(){let e=this.and();for(;this.isWord(`or`);)this.next(),e={kind:`binary`,op:`or`,left:e,right:this.and()};return e}and(){let e=this.not();for(;this.isWord(`and`);)this.next(),e={kind:`binary`,op:`and`,left:e,right:this.not()};return e}not(){return this.isWord(`not`)?(this.next(),this.nest(()=>({kind:`unary`,op:`not`,arg:this.not()}))):this.cmp()}cmp(){let e=this.sum(),t=this.peek;return t.t===`op`&&Te.has(t.v)?(this.next(),{kind:`binary`,op:t.v,left:e,right:this.sum()}):e}sum(){let e=this.product();for(;this.isOp(`+`)||this.isOp(`-`);)e={kind:`binary`,op:this.next().v,left:e,right:this.product()};return e}product(){let e=this.unary();for(;this.isOp(`*`)||this.isOp(`/`);)e={kind:`binary`,op:this.next().v,left:e,right:this.unary()};return e}unary(){return this.isOp(`-`)?(this.next(),this.nest(()=>({kind:`unary`,op:`-`,arg:this.unary()}))):this.atom()}atom(){let e=this.next();switch(e.t){case`num`:return{kind:`num`,value:e.v};case`str`:return{kind:`str`,value:e.v};case`ref`:return{kind:`ref`,label:e.v};case`id`:return e.v===`true`||e.v===`false`?{kind:`bool`,value:e.v===`true`}:e.v===`null`?{kind:`null`}:(we.has(e.v)&&Ee(`Expected a value before "${e.v}"`,e.pos),{kind:`var`,name:e.v});case`op`:if(e.v===`(`){let e=this.nest(()=>this.or());return this.isOp(`)`)||Ee(`Expected ")"`,this.peek.pos),this.next(),e}Ee(`Expected a value before "${e.v}"`,e.pos);case`eof`:Ee(`Expected a value`,e.pos)}}nest(e){++this.#n>Ce&&Ee(`That expression nests too deeply`,this.peek.pos);try{return e()}finally{this.#n--}}};function Ae(e){if(typeof e!=`string`)throw new n(`parse`,`Expected an expression (text) at column 1`,0);return e.length>Se&&Ee(`Expressions hold up to ${Se} characters`,Se),e.trim()||Ee(`Expected a value`,0),new ke(Oe(e)).parse()}function je(e){throw new n(`runtime`,e)}function Me(e,t,n){return typeof t==`number`&&typeof n==`number`?[t,n]:je(`Can't ${e===`-`?`subtract`:e===`*`?`multiply`:e===`/`?`divide`:`add`} ${f(t)} and ${f(n)}: both sides need to be numbers.`)}function Ne(e){return Number.isFinite(e)||je(`That number is too large to keep.`),e}function Pe(e){return typeof e==`number`?d(e):String(e)}function Fe(e,t){switch(e.kind){case`num`:return e.value;case`str`:return e.value;case`bool`:return e.value;case`null`:return null;case`var`:return u(t.vars,e.name)||je(`There is no variable called "${e.name}" yet.`),t.vars[e.name];case`ref`:return t.ref(e.label);case`unary`:{let n=Fe(e.arg,t);return e.op===`not`?!ze(n):(typeof n!=`number`&&je(`Can't negate ${f(n)}: it needs to be a number.`),-n)}case`binary`:{if(e.op===`and`)return ze(Fe(e.left,t))&&ze(Fe(e.right,t));if(e.op===`or`)return ze(Fe(e.left,t))||ze(Fe(e.right,t));let n=Fe(e.left,t),r=Fe(e.right,t);switch(e.op){case`+`:if(typeof n==`string`||typeof r==`string`)return Pe(n)+Pe(r);{let[e,t]=Me(`+`,n,r);return Ne(e+t)}case`-`:{let[e,t]=Me(`-`,n,r);return Ne(e-t)}case`*`:{let[e,t]=Me(`*`,n,r);return Ne(e*t)}case`/`:{let[e,t]=Me(`/`,n,r);return t===0&&je(`Can't divide ${d(e)} by 0.`),Ne(e/t)}case`==`:return n===r;case`!=`:return n!==r;case`<`:case`<=`:case`>`:case`>=`:{typeof n==`number`&&typeof r==`number`||typeof n==`string`&&typeof r==`string`||je(`Can't compare ${f(n)} with ${f(r)}: both sides need to be numbers, or both text.`);let t=n,i=r;return e.op===`<`?t<i:e.op===`<=`?t<=i:e.op===`>`?t>i:t>=i}}}}return je(`Unknown expression.`)}function Ie(e){let t=new Set;return Re(e,e=>{e.kind===`ref`&&t.add(e.label)}),[...t]}function Le(e){let t=new Set;return Re(e,e=>{e.kind===`var`&&t.add(e.name)}),[...t]}function Re(e,t){t(e),e.kind===`unary`?Re(e.arg,t):e.kind===`binary`&&(Re(e.left,t),Re(e.right,t))}function ze(e){return e!==!1&&e!==null&&e!==0&&e!==``}var Be={or:1,and:2,"==":4,"!=":4,"<":4,"<=":4,">":4,">=":4,"+":5,"-":5,"*":6,"/":6};function Ve(e,t){let n=(e,r,i)=>{let a=t?.(e);if(a!==void 0)return a;switch(e.kind){case`num`:return d(e.value);case`str`:return JSON.stringify(e.value);case`bool`:return String(e.value);case`null`:return`null`;case`var`:return e.name;case`ref`:return e.label;case`unary`:{let t=e.op===`not`?`not ${n(e.arg,3,!1)}`:`-${n(e.arg,7,!1)}`;return r>(e.op===`not`?3:7)?`(${t})`:t}case`binary`:{let t=Be[e.op],a=`${n(e.left,t,!1)} ${e.op} ${n(e.right,t,!0)}`;return r>t||r===t&&(i||t===4)?`(${a})`:a}}};return n(e,0,!1)}var He=500,Ue=1e5,We={next:0,true:1,false:2};function Ge(e){return e.nodes().filter(e=>e.kind===`pathway`&&e.pathway?.op===`start`).sort((e,t)=>e.label<t.label?-1:e.label>t.label?1:e.id<t.id?-1:+(e.id>t.id))}function Ke(e,t,n){return e.relationsOf(t).filter(e=>e.type===`flow`&&e.from===t&&(n===void 0||ne(e,n))).sort((e,t)=>We[e.branch??`next`]-We[t.branch??`next`]||(e.to<t.to?-1:e.to>t.to?1:e.id<t.id?-1:1))}function qe(e,t){if(!e.getNode(t))return[];let n=new Set([t]),r=[t];for(let t=0;t<r.length;t++)for(let i of Ke(e,r[t]))n.has(i.to)||(n.add(i.to),r.push(i.to));return r}var Je=class extends Error{};function*Ye(e,t,r,i){let a=i?.maxSteps,o=typeof a==`number`&&Number.isFinite(a)?Math.min(Ue,Math.max(1,Math.floor(a))):He,s=e.getPerspective(r)?.label??r,l={},p=[],m=(e,n,i)=>{let a={pathway:t,perspective:r,steps:p,status:e,result:n,vars:{...l}};return i!==void 0&&(a.error=i),a},h=e.getNode(t);if(!h)return m(`error`,null,`That pathway no longer exists.`);if(h.pathway?.op!==`start`)return m(`error`,null,`"${h.label}" isn't the start of a pathway.`);let g=new Map,_=e=>{let t=g.get(e);return t||g.set(e,t=Ae(e)),t},v={vars:l,ref(t){let i=e.findByLabel(t);if(!i)throw new n(`runtime`,`${t} no longer exists.`);return L(i,r)}},y=new Map,b=null,x=()=>{if(b)return b;let n=new Map;for(let i of qe(e,t)){let t=e.getNode(i)?.pathway,a=[];if(t?.source!==void 0&&a.push(e.getNode(t.source)),t?.expr!==void 0)try{for(let n of Ie(_(t.expr)))a.push(e.findByLabel(n))}catch{}for(let e of a)e&&A(k(e,r))&&n.set(e.id,e)}return b=[...n.values()]},S=e=>{let t=L(e,r);return typeof t==`number`?j(t,k(e,r)):f(t)},C=e=>{if(!u(l,e))return;let t=l[e],n=y.get(e);if(typeof t!=`number`||!n)return f(t);if(!A(n.unit)||L(n.source,r)===t)return j(t,n.unit);let i=x().find(e=>L(e,r)===t);return i?j(t,k(i,r)):d(t)},w=t=>Ve(t,t=>{if(t.kind===`var`)return C(t.name);if(t.kind===`ref`){let n=e.findByLabel(t.label);return n?S(n):void 0}}),T=t=>{if(t.kind===`var`)return y.get(t.name);if(t.kind===`ref`){let n=e.findByLabel(t.label),i=n?k(n,r):void 0;return n&&i!==void 0?{unit:i,source:n}:void 0}if(t.kind===`unary`)return T(t.arg);if(t.kind===`binary`)return T(t.left)??T(t.right)},E=t=>{if(t.kind===`binary`&&t.op===`+`&&typeof Fe(t,v)==`string`)return E(t.left)+E(t.right);if(t.kind===`var`)return C(t.name)??``;if(t.kind===`ref`){let n=e.findByLabel(t.label);if(n)return S(n).replace(/^"|"$/g,``)}let n=Fe(t,v);return typeof n==`number`?d(n):String(n)},D=new Map,O=h;for(;;){if(p.length>=o)return m(`max-steps`,null,Xe(e,D,l,o,C));let t=O.pathway,n=p.length,i=O.label;if(!t){let e=`Stopped at "${i}": it isn't a pathway step.`,t={index:n,nodeId:O.id,op:`end`,vars:{...l},note:e};return p.push(t),yield t,m(`error`,null,e)}let a=``,u=`next`,d=null;try{let n=(n,a)=>{if(n===void 0)throw new Je(`Stopped at "${i}": this ${a} step has no expression.`);let o;try{o=_(n)}catch(e){throw new Je(`Stopped at "${i}": its expression can't be read (${e instanceof Error?e.message:String(e)}).`)}try{return{expr:o,value:Fe(o,v)}}catch(n){for(let n of Ie(o)){let i=e.findByLabel(n);if(i&&L(i,r)===null)throw new Je(`Stopped at ${t.op}: ${i.label} has no value under ${s}.`)}let a=n instanceof Error?n.message:String(n);throw new Je(`Stopped at "${i}": ${a}`)}};switch(t.op){case`start`:a=`start · ${i} (${s})`;break;case`read`:{let n=t.source===void 0?void 0:e.getNode(t.source);if(!n)throw new Je(`Stopped at "${i}": ${i.includes(`←`)?i.slice(i.lastIndexOf(`←`)+1).trim():t.source??`the node it reads`} no longer exists.`);if(!c(t.target))throw new Je(`Stopped at "${i}": it doesn't name a variable to read into.`);let o=L(n,r);l[t.target]=o;let s=k(n,r);typeof o==`number`&&s!==void 0?y.set(t.target,{unit:s,source:n}):y.delete(t.target),a=`read ${t.target} ← ${n.label} · ${C(t.target)}`;break}case`assign`:{if(!c(t.target))throw new Je(`Stopped at "${i}": it doesn't name a variable to set.`);let{expr:e,value:r}=n(t.expr,`assign`),o=Ve(e),s=w(e),u=typeof r==`number`?T(e):void 0;l[t.target]=r,u?y.set(t.target,u):y.delete(t.target),a=e.kind===`num`||e.kind===`str`||e.kind===`bool`||e.kind===`null`?`assign ${t.target} ← ${o}`:`assign ${t.target} ← ${o} · ${s} → ${C(t.target)}`;break}case`if`:case`while`:{let e={...l},{expr:r,value:i}=n(t.expr,t.op),o=ze(i);if(u=o?`true`:`false`,a=`${t.op} ${Ve(r)} · ${w(r)} → ${o}`,t.op===`while`){let t=D.get(O.id)??{loops:0,firstVars:e};o&&t.loops++,D.set(O.id,t)}break}case`end`:if(t.expr!==void 0){let{expr:e,value:r}=n(t.expr,`end`);d=typeof r==`string`?E(e):r}a=`end · ${typeof d==`string`?d:f(d)}`}}catch(e){let r=e instanceof Je?e.message:`Stopped at "${i}": ${e instanceof Error?e.message:String(e)}`,a={index:n,nodeId:O.id,op:t.op,vars:{...l},note:r};return p.push(a),yield a,m(`error`,null,r)}if(t.op===`end`){let e={index:n,nodeId:O.id,op:`end`,vars:{...l},note:a};return p.push(e),yield e,m(`ended`,d)}let h=Ke(e,O.id,r).find(e=>(e.branch??`next`)===u),g=h?e.getNode(h.to):void 0,b={index:n,nodeId:O.id,op:t.op,vars:{...l},note:a};if(h&&(b.via=h.id,b.branch=u),p.push(b),yield b,!h||!g)return m(`error`,null,h?`Stopped at "${i}": the next step no longer exists.`:u===`next`?`Stopped at "${i}": nothing comes after this step.`:`Stopped at "${i}": there is no "${u}" path out of this step.`);O=g}}function Xe(e,t,n,r,i){let a;for(let e of t)(!a||e[1].loops>a[1].loops)&&(a=e);if(!a||a[1].loops===0)return`Stopped after ${r} steps: the pathway never reached an end.`;let[o,{loops:s,firstVars:c}]=a,l=e.getNode(o)?.pathway?.expr,d=[];if(l!==void 0)try{d=Le(Ae(l)).filter(e=>u(n,e)&&u(c,e)&&n[e]===c[e]).map(e=>`${e} stayed ${i(e)}`)}catch{d=[]}return`Stopped after ${s} loop${s===1?``:`s`}: the condition never became false${d.length?` (${d.join(`, `)})`:``}.`}function Ze(e,t,n,r){let i=Ye(e,t,n,r);for(;;){let e=i.next();if(e.done)return e.value}}var Qe=`constellation.memory.v1`,$e=e=>typeof e==`object`&&!!e&&!Array.isArray(e),et=e=>typeof e==`string`,tt=e=>typeof e==`number`&&Number.isFinite(e),nt=e=>e===null?`empty (null)`:Array.isArray(e)?`a list`:typeof e==`object`?`an object`:typeof e==`string`?`text`:`a ${typeof e}`,rt=[`schema`,`version`,`meta`,`perspectives`,`nodes`,`relations`],it=[`id`,`label`,`kind`,`value`,`facets`,`units`,`tags`,`notes`,`file`,`pathway`,`created`,`updated`],at=[`id`,`from`,`to`,`type`,`weight`,`directed`,`branch`,`label`,`perspectives`,`created`],ot=[`id`,`label`,`description`,`accent`,`positions`];function st(e){let r=[],i=[],a=(e,t)=>r.push({path:e,message:t}),o=(e,t)=>i.push({path:e,message:t});if(!$e(e))return a(``,`That file isn't a Constellation memory (it holds ${nt(e)}, not an object).`),{ok:!1,errors:r};if(u(e,`schema`)?e.schema!==`constellation.memory`&&a(`schema`,`That file isn't a Constellation memory (its schema is ${JSON.stringify(e.schema)}, expected "${t}").`):a(`schema`,`That file isn't a Constellation memory (missing "schema").`),u(e,`nodes`)||a(`nodes`,`That file isn't a Constellation memory (missing "nodes").`),u(e,`version`)?!Number.isInteger(e.version)||e.version<1?a(`version`,`The version ${JSON.stringify(e.version)} isn't one this app knows. It should be 1.`):e.version>1&&a(`version`,`This memory is from a newer version (v${e.version}). Update the app to open it.`):a(`version`,`That file has no "version", so it can't be read safely. Add "version": 1.`),r.length)return{ok:!1,errors:r};for(let t of Object.keys(e))rt.includes(t)||o(t,`"${t}" isn't part of the memory format, so it was ignored.`);let s=new Set,l=[];Array.isArray(e.perspectives)?e.perspectives.length===0?a(`perspectives`,`The memory needs at least one perspective in "perspectives".`):e.perspectives.forEach((e,t)=>{let n=`perspectives[${t}]`;if(!$e(e)){a(n,`${n} should be an object with an id and a label, but it is ${nt(e)}.`);return}let r=`${n}${w(e.label)}`,i=!0;!et(e.id)||!e.id.trim()?(a(`${n}.id`,`${r} has no id.`),i=!1):s.has(e.id)&&(a(`${n}.id`,`${r} uses the id "${e.id}", which another perspective already has.`),i=!1),et(e.label)&&e.label.trim()||(a(`${n}.label`,`${r} has no label.`),i=!1),e.description!==void 0&&!et(e.description)&&(a(`${n}.description`,`${r} has a description that isn't text.`),i=!1),e.accent===void 0||et(e.accent)&&y.test(e.accent)||(a(`${n}.accent`,`${r} has the accent colour ${JSON.stringify(e.accent).slice(0,40)}. Use a hex colour like "#FF9F5A" or "#f95", or leave it out.`),i=!1),e.positions!==void 0&&!$e(e.positions)&&(a(`${n}.positions`,`${r} has "positions" that aren't an object of node id → {x, y, z}.`),i=!1);for(let t of Object.keys(e))ot.includes(t)||o(`${n}.${t}`,`"${t}" isn't part of a perspective, so it was ignored.`);et(e.id)&&s.add(e.id),i&&l.push(e)}):a(`perspectives`,`The memory needs a "perspectives" list with at least one perspective.`);let d=new Map,f=[],p=[];Array.isArray(e.nodes)?e.nodes.forEach((e,t)=>{let i=`nodes[${t}]`;if(!$e(e)){a(i,`${i} should be an object, but it is ${nt(e)}.`);return}let l=`${i}${w(e.label)}`,u=r.length;if(!et(e.id)||!e.id.trim()?a(`${i}.id`,`${l} has no id.`):d.has(e.id)?a(`${i}.id`,`${l} uses the id "${e.id}", which nodes[${d.get(e.id)}] already has. Ids must be unique.`):d.set(e.id,t),et(e.label)&&e.label.trim()||a(`${i}.label`,`${l} has no label. Give it a name, even one word.`),T.includes(e.kind)||a(`${i}.kind`,`${l} has the kind ${JSON.stringify(e.kind)}. Use one of: ${T.join(`, `)}.`),ct(e.value,`${i}.value`,`The value of ${l}`,a),!$e(e.facets))a(`${i}.facets`,`${l} needs "facets" (an object, even if empty).`);else for(let[t,n]of Object.entries(e.facets))s.has(t)||a(`${i}.facets.${t}`,`${l} has a value for the perspective "${t}", which doesn't exist in this memory.`),ct(n,`${i}.facets.${t}`,`The "${t}" value of ${l}`,a);if(e.units!==void 0){if(!$e(e.units))a(`${i}.units`,`${l} has "units" that aren't an object of perspective id → unit text (use "*" for every lens).`);else for(let[t,n]of Object.entries(e.units))t!==`*`&&!s.has(t)&&a(`${i}.units.${t}`,`${l} has a unit for the perspective "${t}", which doesn't exist in this memory.`),!et(n)||!n.trim()?a(`${i}.units.${t}`,`${l} has a "${t}" unit that isn't text. A unit is short text like "°C".`):n.length>40&&a(`${i}.units.${t}`,`${l} has a "${t}" unit of ${n.length} characters. Units hold up to 40 characters.`)}if((!Array.isArray(e.tags)||e.tags.some(e=>!et(e)))&&a(`${i}.tags`,`${l} needs "tags" as a list of words (it can be empty).`),e.notes!==void 0&&!et(e.notes)&&a(`${i}.notes`,`${l} has notes that aren't text.`),e.file!==void 0){let t=e.file;if(!$e(t))a(`${i}.file`,`${l} has a "file" that isn't an object.`);else{et(t.name)&&t.name.trim()||a(`${i}.file.name`,`${l} refers to a file without a name.`);for(let e of[`path`,`mime`,`sizeNote`])t[e]!==void 0&&!et(t[e])&&a(`${i}.file.${e}`,`${l} has a file ${e} that isn't text.`);t.content!==void 0&&(et(t.content)?t.content.length>65536&&a(`${i}.file.content`,`${l} holds ${Math.ceil(t.content.length/1024)} KB of file text; the limit is 64 KB. Store a path to bigger files instead.`):a(`${i}.file.content`,`${l} has file contents that aren't text.`))}}if(e.pathway!==void 0){let t=e.pathway;if(e.kind!==`pathway`&&a(`${i}.pathway`,`${l} has a pathway step but its kind is ${JSON.stringify(e.kind)}. Set the kind to "pathway".`),!$e(t))a(`${i}.pathway`,`${l} has a pathway step that isn't an object.`);else{if(D.includes(t.op)||a(`${i}.pathway.op`,`${l} has the step ${JSON.stringify(t.op)}. Use one of: ${D.join(`, `)}.`),t.op!==`assign`&&t.op!==`read`||c(t.target)||a(`${i}.pathway.target`,`${l} writes to ${t.target===void 0?`no variable`:JSON.stringify(t.target)}. A variable name is letters, digits and _, starting with a letter.`),t.op!==`assign`&&t.op!==`if`&&t.op!==`while`||et(t.expr)||a(`${i}.pathway.expr`,`${l} is a "${t.op}" step without an expression.`),t.expr!==void 0){if(!et(t.expr))a(`${i}.pathway.expr`,`${l} has an expression that isn't text.`);else try{Ae(t.expr)}catch(e){a(`${i}.pathway.expr`,`${l} has an expression that can't be read: ${e instanceof n?e.message:String(e)}.`)}}t.op===`read`&&(!et(t.source)||!t.source?a(`${i}.pathway.source`,`${l} is a "read" step that doesn't say which node to read.`):p.push({at:`${i}.pathway.source`,name:l,source:t.source}))}}for(let t of[`created`,`updated`])tt(e[t])||a(`${i}.${t}`,`${l} needs "${t}" as a time in milliseconds (a number).`);for(let t of Object.keys(e))it.includes(t)||o(`${i}.${t}`,`"${t}" isn't part of a node, so it was ignored.`);r.length===u&&f.push(e)}):a(`nodes`,`"nodes" should be a list, but it is ${nt(e.nodes)}.`);for(let e of p)d.has(e.source)||o(e.at,`${e.name} reads "${e.source}", which isn't in this memory any more. Running the pathway will stop there.`);Array.isArray(e.perspectives)&&e.perspectives.forEach((e,t)=>{if(!$e(e)||!$e(e.positions))return;let n=`perspectives[${t}]${w(e.label)}`;for(let[r,i]of Object.entries(e.positions)){let e=`perspectives[${t}].positions.${r}`;d.has(r)||a(e,`${n} places "${r}", but no node has that id.`),$e(i)&&tt(i.x)&&tt(i.y)&&tt(i.z)||a(e,`${n} has a position for "${r}" that isn't {x, y, z} with finite numbers.`)}});let m=new Map,h=[];u(e,`relations`)?Array.isArray(e.relations)?e.relations.forEach((e,t)=>{let n=`relations[${t}]`;if(!$e(e)){a(n,`${n} should be an object, but it is ${nt(e)}.`);return}let i=r.length;!et(e.id)||!e.id.trim()?a(`${n}.id`,`${n} has no id.`):m.has(e.id)?a(`${n}.id`,`${n} uses the id "${e.id}", which relations[${m.get(e.id)}] already has. Ids must be unique.`):m.set(e.id,t);for(let t of[`from`,`to`])et(e[t])?d.has(e[t])||a(`${n}.${t}`,`${n} ${t===`from`?`starts at`:`ends at`} "${e[t]}", but no node has that id.`):a(`${n}.${t}`,`${n} has no "${t}" node.`);et(e.from)&&e.from===e.to&&a(`${n}.to`,`${n} joins "${e.from}" to itself. A line needs two different ends.`),E.includes(e.type)||a(`${n}.type`,`${n} has the type ${JSON.stringify(e.type)}. Use one of: ${E.join(`, `)}.`),(!tt(e.weight)||e.weight<=0||e.weight>1)&&a(`${n}.weight`,`${n} has the weight ${JSON.stringify(e.weight)}. A weight is a number above 0 and at most 1.`),typeof e.directed==`boolean`?e.type===`flow`&&!e.directed&&a(`${n}.directed`,`${n} is a pathway (flow) line, so it must be directed.`):a(`${n}.directed`,`${n} needs "directed": true or false.`),e.branch!==void 0&&(e.type===`flow`?O.includes(e.branch)||a(`${n}.branch`,`${n} has the branch ${JSON.stringify(e.branch)}. Use next, true or false.`):a(`${n}.branch`,`${n} has a branch, but only pathway (flow) lines take one.`)),e.label!==void 0&&!et(e.label)&&a(`${n}.label`,`${n} has a label that isn't text.`),e.perspectives!==void 0&&(!Array.isArray(e.perspectives)||e.perspectives.length===0?a(`${n}.perspectives`,`${n} has "perspectives" that aren't a list of perspective ids. Leave it out to show the line in every lens.`):e.perspectives.forEach((e,t)=>{et(e)&&s.has(e)||a(`${n}.perspectives[${t}]`,`${n} appears in the perspective ${JSON.stringify(e)}, which doesn't exist in this memory.`)})),tt(e.created)||a(`${n}.created`,`${n} needs "created" as a time in milliseconds (a number).`);for(let t of Object.keys(e))at.includes(t)||o(`${n}.${t}`,`"${t}" isn't part of a line, so it was ignored.`);r.length===i&&h.push(e)}):a(`relations`,`"relations" should be a list, but it is ${nt(e.relations)}.`):a(`relations`,`The memory needs a "relations" list (it can be empty).`);let g=e.meta;if(!$e(g))a(`meta`,`The memory needs "meta" with at least a title and a default perspective.`);else{et(g.title)&&g.title.trim()||a(`meta.title`,`The memory has no title. Give it one in meta.title.`),g.description!==void 0&&!et(g.description)&&a(`meta.description`,`meta.description should be text.`),et(g.defaultPerspective)?s.has(g.defaultPerspective)||a(`meta.defaultPerspective`,`The memory opens in the perspective "${g.defaultPerspective}", which doesn't exist in it.`):a(`meta.defaultPerspective`,`meta.defaultPerspective should name the perspective to open with.`);let t=g.featured;if(t!==void 0){if(!$e(t))a(`meta.featured`,`meta.featured should be an object.`);else{if(t.route!==void 0){if(!$e(t.route))a(`meta.featured.route`,`meta.featured.route should be {from, to}.`);else for(let e of[`from`,`to`])et(t.route[e])&&d.has(t.route[e])||a(`meta.featured.route.${e}`,`The featured route ${e===`from`?`starts at`:`ends at`} ${JSON.stringify(t.route[e])}, but no node has that id.`)}if(t.pathway!==void 0){let n=et(t.pathway)?d.get(t.pathway):void 0,r=n===void 0?void 0:e.nodes[n];r?$e(r.pathway)&&r.pathway.op===`start`||a(`meta.featured.pathway`,`The featured pathway "${t.pathway}" isn't the start of a pathway.`):a(`meta.featured.pathway`,`The featured pathway ${JSON.stringify(t.pathway)} isn't a node in this memory.`)}t.query!==void 0&&!et(t.query)&&a(`meta.featured.query`,`meta.featured.query should be text.`)}}}return r.length?{ok:!1,errors:r}:{ok:!0,doc:{schema:t,version:1,meta:C(g),perspectives:l.map(S),nodes:f.map(b),relations:h.map(x)},warnings:i}}function ct(e,t,n,r){e===void 0?r(t,`${n} is missing. Use null for "no value".`):l(e)?typeof e==`string`&&e.length>500&&r(t,`${n} is ${e.length} characters long. Values hold up to 500 characters. Put longer text in a File.`):r(t,`${n} is ${nt(e)}. Values are text, numbers, true/false or null.`)}function lt(e){if(typeof e!=`string`||!e.trim())return{ok:!1,errors:[{path:``,message:`That file is empty, so there is no memory in it.`}]};let t;try{t=JSON.parse(e)}catch(e){return{ok:!1,errors:[{path:``,message:`That file isn't valid JSON, so it can't be a Constellation memory (${e instanceof Error?e.message:String(e)}).`}]}}return st(t)}function ut(e){let n=new Set(e.nodes().map(e=>e.id)),r=C(e.meta);return r.featured&&(r.featured.route&&!(n.has(r.featured.route.from)&&n.has(r.featured.route.to))&&delete r.featured.route,r.featured.pathway!==void 0&&e.getNode(r.featured.pathway)?.pathway?.op!==`start`&&delete r.featured.pathway),{schema:t,version:1,meta:r,perspectives:e.perspectives().map(e=>{let t=S(e);if(t.positions)for(let e of Object.keys(t.positions))n.has(e)||delete t.positions[e];return t}),nodes:e.nodes().map(b),relations:e.relations().map(x)}}function dt(e){return JSON.stringify(ut(e),null,2)+`
`}function ft(e,t=Qe){let n;try{n=e.getItem(t)}catch{return{ok:!1,errors:[{path:``,message:`Couldn't read this browser's storage (it is blocked). Your memory opened from the seed instead.`}]}}return n===null?null:lt(n)}function pt(e,t,n={}){let r=n.key??`constellation.memory.v1`,i=n.debounceMs??400,a=null,o=!1,s=()=>{a=null;try{t.setItem(r,dt(e))}catch(e){n.onError?.(e)}},c=e.on(()=>{o||(a!==null&&clearTimeout(a),a=setTimeout(s,i))});return()=>{o||(o=!0,c(),a!==null&&(clearTimeout(a),s()))}}var mt=1e3,ht=1001,gt=1002,_t=1003,vt=1004,yt=1005,bt=1006,xt=1007,St=1008,Ct=1009,wt=1010,Tt=1011,Et=1012,Dt=1013,Ot=1014,kt=1015,At=1016,jt=1017,Mt=1018,Nt=1020,Pt=35902,Ft=35899,It=1021,Lt=1022,Rt=1023,zt=1026,Bt=1027,Vt=1028,Ht=1029,Ut=1030,Wt=1031,Gt=1033,Kt=33776,qt=33777,Jt=33778,Yt=33779,Xt=35840,Zt=35841,Qt=35842,$t=35843,en=36196,tn=37492,nn=37496,rn=37488,an=37489,on=37490,sn=37491,cn=37808,ln=37809,un=37810,dn=37811,fn=37812,pn=37813,mn=37814,hn=37815,gn=37816,_n=37817,vn=37818,yn=37819,bn=37820,xn=37821,Sn=36492,Cn=36494,wn=36495,Tn=36283,En=36284,Dn=36285,On=36286,kn=2300,An=2301,jn=2302,Mn=2303,Nn=2400,Pn=2401,Fn=2402,In=3200,Ln=`srgb`,Rn=`srgb-linear`,zn=`linear`,Bn=`srgb`,Vn=7680,Hn=35044,Un=35048,Wn=2e3;function Gn(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function Kn(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function qn(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Jn(){let e=qn(`canvas`);return e.style.display=`block`,e}var Yn={};function Xn(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Zn(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function G(...e){e=Zn(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function K(...e){e=Zn(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Qn(...e){let t=e.join(` `);t in Yn||(Yn[t]=!0,G(...e))}function $n(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var er={0:0,2:6,4:4,3:5,1:1,6:2,7:7,5:3},tr=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},nr=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),rr=Math.PI/180,ir=180/Math.PI;function ar(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(nr[e&255]+nr[e>>8&255]+nr[e>>16&255]+nr[e>>24&255]+`-`+nr[t&255]+nr[t>>8&255]+`-`+nr[t>>16&15|64]+nr[t>>24&255]+`-`+nr[n&63|128]+nr[n>>8&255]+`-`+nr[n>>16&255]+nr[n>>24&255]+nr[r&255]+nr[r>>8&255]+nr[r>>16&255]+nr[r>>24&255]).toLowerCase()}function or(e,t,n){return Math.max(t,Math.min(n,e))}function sr(e,t){return(e%t+t)%t}function cr(e,t,n){return(1-n)*e+n*t}function lr(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function ur(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function dr(e,t){if(t.constructor===Float32Array)return e;let n=ur(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.max(e/n,-1)}function fr(e,t){if(t.constructor===Float32Array)return e;let n=ur(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.round(e*n)}var pr=class{static{this.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=or(this.x,e.x,t.x),this.y=or(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=or(this.x,e,t),this.y=or(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(or(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(or(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},mr=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:G(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(or(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},q=class{static{this.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(gr.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(gr.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=or(this.x,e.x,t.x),this.y=or(this.y,e.y,t.y),this.z=or(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=or(this.x,e,t),this.y=or(this.y,e,t),this.z=or(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(or(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return hr.copy(this).projectOnVector(e),this.sub(hr)}reflect(e){return this.sub(hr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(or(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},hr=new q,gr=new mr,J=class{static{this.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return Qn(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(_r.makeScale(e,t)),this}rotate(e){return Qn(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(_r.makeRotation(-e)),this}translate(e,t){return Qn(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(_r.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},_r=new J,vr=new J().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),yr=new J().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function br(){let e={enabled:!0,workingColorSpace:Rn,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=Sr(e.r),e.g=Sr(e.g),e.b=Sr(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Cr(e.r),e.g=Cr(e.g),e.b=Cr(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?zn:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[n].fromXYZ).multiply(this.spaces[t].toXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[Rn]:{primaries:t,whitePoint:r,transfer:zn,toXYZ:vr,fromXYZ:yr,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Ln},outputColorSpaceConfig:{drawingBufferColorSpace:Ln}},[Ln]:{primaries:t,whitePoint:r,transfer:Bn,toXYZ:vr,fromXYZ:yr,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Ln}}}),e}var xr=br();function Sr(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Cr(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var wr,Tr=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{wr===void 0&&(wr=qn(`canvas`)),wr.width=e.width,wr.height=e.height;let t=wr.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=wr}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=qn(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Sr(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Sr(t[e]/255)*255):t[e]=Sr(t[e]);return{data:t,width:e.width,height:e.height}}return G(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Er=0,Dr=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Er++}),this.uuid=ar(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width||0,t.height||0,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Or(r[t].image)):e.push(Or(r[t]))}else e=Or(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Or(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?Tr.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(G(`Texture: Unable to serialize Texture.`),{})}var kr=0,Ar=new q,jr=class e extends tr{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=ht,i=ht,a=bt,o=St,s=Rt,c=Ct,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:kr++}),this.uuid=ar(),this.name=``,this.source=new Dr(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new pr(0,0),this.repeat=new pr(1,1),this.center=new pr(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new J,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(Ar).x}get height(){return this.source.getSize(Ar).y}get depth(){return this.source.getSize(Ar).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){G(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?G(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case mt:e.x-=Math.floor(e.x);break;case ht:e.x=e.x<0?0:1;break;case gt:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case mt:e.y-=Math.floor(e.y);break;case ht:e.y=e.y<0?0:1;break;case gt:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};jr.DEFAULT_IMAGE=null,jr.DEFAULT_MAPPING=300,jr.DEFAULT_ANISOTROPY=1;var Mr=class{static{this.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=or(this.x,e.x,t.x),this.y=or(this.y,e.y,t.y),this.z=or(this.z,e.z,t.z),this.w=or(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=or(this.x,e,t),this.y=or(this.y,e,t),this.z=or(this.z,e,t),this.w=or(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(or(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Nr=class extends tr{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:bt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Mr(0,0,e,t),this.scissorTest=!1,this.viewport=new Mr(0,0,e,t),this.textures=[];let r=n.count;for(let i=0;i<r;i++)this.textures[i]=new jr({width:e,height:t,depth:n.depth}),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:bt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Dr(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},Pr=class extends Nr{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Fr=class extends jr{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=_t,this.minFilter=_t,this.wrapR=ht,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Ir=class extends jr{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=_t,this.minFilter=_t,this.wrapR=ht,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},Lr=class e{static{this.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/Rr.setFromMatrixColumn(e,0).length(),i=1/Rr.setFromMatrixColumn(e,1).length(),a=1/Rr.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Br,e,Vr)}lookAt(e,t,n){let r=this.elements;return Wr.subVectors(e,t),Wr.lengthSq()===0&&(Wr.z=1),Wr.normalize(),Hr.crossVectors(n,Wr),Hr.lengthSq()===0&&(Math.abs(n.z)===1?Wr.x+=1e-4:Wr.z+=1e-4,Wr.normalize(),Hr.crossVectors(n,Wr)),Hr.normalize(),Ur.crossVectors(Wr,Hr),r[0]=Hr.x,r[4]=Ur.x,r[8]=Wr.x,r[1]=Hr.y,r[5]=Ur.y,r[9]=Wr.y,r[2]=Hr.z,r[6]=Ur.z,r[10]=Wr.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],M=r[14],N=r[3],P=r[7],F=r[11],I=r[15];return i[0]=a*x+o*T+s*k+c*N,i[4]=a*S+o*E+s*A+c*P,i[8]=a*C+o*D+s*j+c*F,i[12]=a*w+o*O+s*M+c*I,i[1]=l*x+u*T+d*k+f*N,i[5]=l*S+u*E+d*A+f*P,i[9]=l*C+u*D+d*j+f*F,i[13]=l*w+u*O+d*M+f*I,i[2]=p*x+m*T+h*k+g*N,i[6]=p*S+m*E+h*A+g*P,i[10]=p*C+m*D+h*j+g*F,i[14]=p*w+m*O+h*M+g*I,i[3]=_*x+v*T+y*k+b*N,i[7]=_*S+v*E+y*A+b*P,i[11]=_*C+v*D+y*j+b*F,i[15]=_*w+v*O+y*M+b*I,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=Rr.set(r[0],r[1],r[2]).length(),o=Rr.set(r[4],r[5],r[6]).length(),s=Rr.set(r[8],r[9],r[10]).length();i<0&&(a=-a),zr.copy(this);let c=1/a,l=1/o,u=1/s;return zr.elements[0]*=c,zr.elements[1]*=c,zr.elements[2]*=c,zr.elements[4]*=l,zr.elements[5]*=l,zr.elements[6]*=l,zr.elements[8]*=u,zr.elements[9]*=u,zr.elements[10]*=u,t.setFromRotationMatrix(zr),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=Wn,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=Wn,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Rr=new q,zr=new Lr,Br=new q(0,0,0),Vr=new q(1,1,1),Hr=new q,Ur=new q,Wr=new q,Gr=new Lr,Kr=new mr,qr=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(or(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-or(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(or(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-or(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(or(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-or(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:G(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Gr.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Gr,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Kr.setFromEuler(this),this.setFromQuaternion(Kr,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};qr.DEFAULT_ORDER=`XYZ`;var Jr=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},Yr=0,Xr=new q,Zr=new mr,Qr=new Lr,$r=new q,ei=new q,ti=new q,ni=new mr,ri=new q(1,0,0),ii=new q(0,1,0),ai=new q(0,0,1),oi={type:`added`},si={type:`removed`},ci={type:`childadded`,child:null},li={type:`childremoved`,child:null},ui=class e extends tr{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Yr++}),this.uuid=ar(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new q,n=new qr,r=new mr,i=new q(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Lr},normalMatrix:{value:new J}}),this.matrix=new Lr,this.matrixWorld=new Lr,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Jr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Zr.setFromAxisAngle(e,t),this.quaternion.multiply(Zr),this}rotateOnWorldAxis(e,t){return Zr.setFromAxisAngle(e,t),this.quaternion.premultiply(Zr),this}rotateX(e){return this.rotateOnAxis(ri,e)}rotateY(e){return this.rotateOnAxis(ii,e)}rotateZ(e){return this.rotateOnAxis(ai,e)}translateOnAxis(e,t){return Xr.copy(e).applyQuaternion(this.quaternion),this.position.add(Xr.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ri,e)}translateY(e){return this.translateOnAxis(ii,e)}translateZ(e){return this.translateOnAxis(ai,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Qr.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?$r.copy(e):$r.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),ei.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qr.lookAt(ei,$r,this.up):Qr.lookAt($r,ei,this.up),this.quaternion.setFromRotationMatrix(Qr),r&&(Qr.extractRotation(r.matrixWorld),Zr.setFromRotationMatrix(Qr),this.quaternion.premultiply(Zr.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(K(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(oi),ci.child=e,this.dispatchEvent(ci),ci.child=null):K(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(si),li.child=e,this.dispatchEvent(li),li.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Qr.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Qr.multiply(e.parent.matrixWorld)),e.applyMatrix4(Qr),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(oi),ci.child=e,this.dispatchEvent(ci),ci.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ei,e,ti),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ei,ni,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};ui.DEFAULT_UP=new q(0,1,0),ui.DEFAULT_MATRIX_AUTO_UPDATE=!0,ui.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var di=class extends ui{constructor(){super(),this.isGroup=!0,this.type=`Group`}},fi={type:`move`},pi=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new di,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new di,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new q,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new q),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new di,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new q,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new q,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.quaternion,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.quaternion,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(fi)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new di;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},mi={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},hi={h:0,s:0,l:0},gi={h:0,s:0,l:0};function _i(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var vi=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Ln){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,xr.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=xr.workingColorSpace){return this.r=e,this.g=t,this.b=n,xr.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=xr.workingColorSpace){if(e=sr(e,1),t=or(t,0,1),n=or(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=_i(i,r,e+1/3),this.g=_i(i,r,e),this.b=_i(i,r,e-1/3)}return xr.colorSpaceToWorking(this,r),this}setStyle(e,t=Ln){function n(t){t!==void 0&&parseFloat(t)<1&&G(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseFloat(i[1]))/100,Math.min(100,parseFloat(i[2]))/100,Math.min(100,parseFloat(i[3]))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:G(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);G(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Ln){let n=mi[e.toLowerCase()];return n===void 0?G(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Sr(e.r),this.g=Sr(e.g),this.b=Sr(e.b),this}copyLinearToSRGB(e){return this.r=Cr(e.r),this.g=Cr(e.g),this.b=Cr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Ln){return xr.workingToColorSpace(yi.copy(this),e),Math.round(or(yi.r*255,0,255))*65536+Math.round(or(yi.g*255,0,255))*256+Math.round(or(yi.b*255,0,255))}getHexString(e=Ln){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=xr.workingColorSpace){xr.workingToColorSpace(yi.copy(this),t);let n=yi.r,r=yi.g,i=yi.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=xr.workingColorSpace){return xr.workingToColorSpace(yi.copy(this),t),e.r=yi.r,e.g=yi.g,e.b=yi.b,e}getStyle(e=Ln){xr.workingToColorSpace(yi.copy(this),e);let t=yi.r,n=yi.g,r=yi.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(hi),this.setHSL(hi.h+e,hi.s+t,hi.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(hi),e.getHSL(gi);let n=cr(hi.h,gi.h,t),r=cr(hi.s,gi.s,t),i=cr(hi.l,gi.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},yi=new vi;vi.NAMES=mi;var bi=class extends ui{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new qr,this.environmentIntensity=1,this.environmentRotation=new qr,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background===null?null:e.background.clone(),this.environment=e.environment===null?null:e.environment.clone(),this.fog=e.fog===null?null:e.fog.clone(),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial===null?null:e.overrideMaterial.clone(),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},xi=new q,Si=new q,Ci=new q,wi=new q,Ti=new q,Ei=new q,Di=new q,Oi=new q,ki=new q,Ai=new q,ji=new Mr,Mi=new Mr,Ni=new Mr,Pi=class e{constructor(e=new q,t=new q,n=new q){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),xi.subVectors(e,t),r.cross(xi);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){xi.subVectors(r,t),Si.subVectors(n,t),Ci.subVectors(e,t);let a=xi.dot(xi),o=xi.dot(Si),s=xi.dot(Ci),c=Si.dot(Si),l=Si.dot(Ci),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,wi)!==null&&wi.x>=0&&wi.y>=0&&wi.x+wi.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,wi)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,wi.x),s.addScaledVector(a,wi.y),s.addScaledVector(o,wi.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return ji.setScalar(0),Mi.setScalar(0),Ni.setScalar(0),ji.fromBufferAttribute(e,t),Mi.fromBufferAttribute(e,n),Ni.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ji,i.x),a.addScaledVector(Mi,i.y),a.addScaledVector(Ni,i.z),a}static isFrontFacing(e,t,n,r){return xi.subVectors(n,t),Si.subVectors(e,t),xi.cross(Si).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return xi.subVectors(this.c,this.b),Si.subVectors(this.a,this.b),xi.cross(Si).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Ti.subVectors(r,n),Ei.subVectors(i,n),Oi.subVectors(e,n);let s=Ti.dot(Oi),c=Ei.dot(Oi);if(s<=0&&c<=0)return t.copy(n);ki.subVectors(e,r);let l=Ti.dot(ki),u=Ei.dot(ki);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0&&s-l>0)return a=s/(s-l),t.copy(n).addScaledVector(Ti,a);Ai.subVectors(e,i);let f=Ti.dot(Ai),p=Ei.dot(Ai);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Ei,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Di.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Di,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Ti,a).addScaledVector(Ei,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Fi=class{constructor(e=new q(1/0,1/0,1/0),t=new q(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Li.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Li.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Li.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,Li):Li.fromBufferAttribute(r,t),Li.applyMatrix4(e.matrixWorld),this.expandByPoint(Li);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),Ri.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),Ri.copy(e.boundingBox)),Ri.applyMatrix4(e.matrixWorld),this.union(Ri)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Li),Li.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Gi),Ki.subVectors(this.max,Gi),zi.subVectors(e.a,Gi),Bi.subVectors(e.b,Gi),Vi.subVectors(e.c,Gi),Hi.subVectors(Bi,zi),Ui.subVectors(Vi,Bi),Wi.subVectors(zi,Vi);let t=[0,-Hi.z,Hi.y,0,-Ui.z,Ui.y,0,-Wi.z,Wi.y,Hi.z,0,-Hi.x,Ui.z,0,-Ui.x,Wi.z,0,-Wi.x,-Hi.y,Hi.x,0,-Ui.y,Ui.x,0,-Wi.y,Wi.x,0];return!Yi(t,zi,Bi,Vi,Ki)||(t=[1,0,0,0,1,0,0,0,1],!Yi(t,zi,Bi,Vi,Ki))?!1:(qi.crossVectors(Hi,Ui),t=[qi.x,qi.y,qi.z],Yi(t,zi,Bi,Vi,Ki))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Li).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Li).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Ii[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ii[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ii[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ii[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ii[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ii[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ii[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ii[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ii)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Ii=[new q,new q,new q,new q,new q,new q,new q,new q],Li=new q,Ri=new Fi,zi=new q,Bi=new q,Vi=new q,Hi=new q,Ui=new q,Wi=new q,Gi=new q,Ki=new q,qi=new q,Ji=new q;function Yi(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){Ji.fromArray(e,a);let o=i.x*Math.abs(Ji.x)+i.y*Math.abs(Ji.y)+i.z*Math.abs(Ji.z),s=t.dot(Ji),c=n.dot(Ji),l=r.dot(Ji);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Xi=new q,Zi=new pr,Qi=0,$i=class extends tr{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Qi++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=Hn,this.updateRanges=[],this.gpuType=kt,this.version=0,this._normalizationScale=e===void 0?void 0:ur(e)}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Zi.fromBufferAttribute(this,t),Zi.applyMatrix3(e),this.setXY(t,Zi.x,Zi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Xi.fromBufferAttribute(this,t),Xi.applyMatrix3(e),this.setXYZ(t,Xi.x,Xi.y,Xi.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Xi.fromBufferAttribute(this,t),Xi.applyMatrix4(e),this.setXYZ(t,Xi.x,Xi.y,Xi.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Xi.fromBufferAttribute(this,t),Xi.applyNormalMatrix(e),this.setXYZ(t,Xi.x,Xi.y,Xi.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Xi.fromBufferAttribute(this,t),Xi.transformDirection(e),this.setXYZ(t,Xi.x,Xi.y,Xi.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}_denormalize(e){let t=this._normalizationScale;return t===void 0?dr(e,this.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?fr(e,this.array):Math.round(e*t)}},ea=class extends $i{constructor(e,t,n){super(new Uint16Array(e),t,n)}},ta=class extends $i{constructor(e,t,n){super(new Uint32Array(e),t,n)}},na=class extends $i{constructor(e,t,n){super(new Float32Array(e),t,n)}},ra=new Fi,ia=new q,aa=new q,oa=class{constructor(e=new q,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?ra.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ia.subVectors(e,this.center);let t=ia.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(ia,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(aa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ia.copy(e.center).add(aa)),this.expandByPoint(ia.copy(e.center).sub(aa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},sa=0,ca=new Lr,la=new ui,ua=new q,da=new Fi,fa=new Fi,pa=new q,ma=class e extends tr{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:sa++}),this.uuid=ar(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Gn(e)?ta:ea)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new J().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return ca.makeRotationFromQuaternion(e),this.applyMatrix4(ca),this}rotateX(e){return ca.makeRotationX(e),this.applyMatrix4(ca),this}rotateY(e){return ca.makeRotationY(e),this.applyMatrix4(ca),this}rotateZ(e){return ca.makeRotationZ(e),this.applyMatrix4(ca),this}translate(e,t,n){return ca.makeTranslation(e,t,n),this.applyMatrix4(ca),this}scale(e,t,n){return ca.makeScale(e,t,n),this.applyMatrix4(ca),this}lookAt(e){return la.lookAt(e),la.updateMatrix(),this.applyMatrix4(la.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ua).negate(),this.translate(ua.x,ua.y,ua.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new na(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&G(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Fi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)K(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new q(-1/0,-1/0,-1/0),new q(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];da.setFromBufferAttribute(n),this.morphTargetsRelative?(pa.addVectors(this.boundingBox.min,da.min),this.boundingBox.expandByPoint(pa),pa.addVectors(this.boundingBox.max,da.max),this.boundingBox.expandByPoint(pa)):(this.boundingBox.expandByPoint(da.min),this.boundingBox.expandByPoint(da.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&K(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oa);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)K(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new q,1/0);else if(e){let n=this.boundingSphere.center;if(da.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];fa.setFromBufferAttribute(n),this.morphTargetsRelative?(pa.addVectors(da.min,fa.min),da.expandByPoint(pa),pa.addVectors(da.max,fa.max),da.expandByPoint(pa)):(da.expandByPoint(fa.min),da.expandByPoint(fa.max))}da.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)pa.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(pa));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)pa.fromBufferAttribute(a,t),o&&(ua.fromBufferAttribute(e,t),pa.add(ua)),r=Math.max(r,n.distanceToSquared(pa))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&K(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){K(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new $i(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[],c=new Uint8Array(n.count);for(let e=0;e<n.count;e++)o[e]=new q,s[e]=new q;let l=new q,u=new q,d=new q,f=new pr,p=new pr,m=new pr,h=new q,g=new q;function _(e,t,r){c[e]=c[t]=c[r]=1,l.fromBufferAttribute(n,e),u.fromBufferAttribute(n,t),d.fromBufferAttribute(n,r),f.fromBufferAttribute(i,e),p.fromBufferAttribute(i,t),m.fromBufferAttribute(i,r),u.sub(l),d.sub(l),p.sub(f),m.sub(f);let a=1/(p.x*m.y-m.x*p.y);isFinite(a)&&(h.copy(u).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(a),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-m.x).multiplyScalar(a),o[e].add(h),o[t].add(h),o[r].add(h),s[e].add(g),s[t].add(g),s[r].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let t=0,n=v.length;t<n;++t){let n=v[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)_(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let y=new q,b=new q,x=new q,S=new q;function C(e){x.fromBufferAttribute(r,e),S.copy(x);let t=o[e];y.copy(t),y.sub(x.multiplyScalar(x.dot(t))).normalize(),b.crossVectors(S,t);let n=b.dot(s[e])<0?-1:1;a.setXYZW(e,y.x,y.y,y.z,n)}for(let e=0,t=n.count;e<t;++e)c[e]&&C(e);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new $i(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new q,i=new q,a=new q,o=new q,s=new q,c=new q,l=new q,u=new q;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)pa.fromBufferAttribute(e,t),pa.normalize(),e.setXYZ(t,pa.x,pa.y,pa.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new $i(a,r,i)}if(this.index===null)return G(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},ha=new q,ga=new q,_a=new J,va=class{constructor(e=new q(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=ha.subVectors(n,t).cross(ga.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(ha),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||_a.getNormalMatrix(e),r=this.coplanarPoint(ha).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},ya=0,ba=class extends tr{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ya++}),this.uuid=ar(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new vi(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Vn,this.stencilZFail=Vn,this.stencilZPass=Vn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){G(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?G(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new vi().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new va().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new pr().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new pr().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},xa=new q,Sa=new q,Ca=new q,wa=new q,Ta=class{constructor(e=new q,t=new q(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,xa)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=xa.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(xa.copy(this.origin).addScaledVector(this.direction,t),xa.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Sa.copy(e).add(t).multiplyScalar(.5),Ca.copy(t).sub(e).normalize(),wa.copy(this.origin).sub(Sa);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Ca),o=wa.dot(this.direction),s=-wa.dot(Ca),c=wa.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Sa).addScaledVector(Ca,d),f}intersectSphere(e,t){if(e.radius<0)return null;xa.subVectors(e.center,this.origin);let n=xa.dot(this.direction),r=xa.dot(xa)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,xa)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,M,N;if(y>=b&&y>=x?(w=s,D=u,A=p,N=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,M=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,M=_)):b>=x?(w=c,D=d,A=m,N=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,M=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,M=v)):(w=l,D=f,A=h,N=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,M=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,M=g)),w===0)return null;let P=S/w,F=C/w,I=1/w,L=T-P*D,ee=E-F*D,te=O-P*A,ne=k-F*A,R=j-P*N,z=M-F*N,B=R*ne-z*te,re=L*z-ee*R,ie=te*ee-ne*L;if(r){if(B<0||re<0||ie<0)return null}else if((B<0||re<0||ie<0)&&(B>0||re>0||ie>0))return null;let ae=B+re+ie;if(ae===0)return null;let oe=I*(B*D+re*A+ie*N);return(ae>0?oe<0:oe>0)?null:this.at(oe/ae,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ea=class extends ba{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new vi(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new qr,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Da=new Lr,Oa=new Ta,ka=new oa,Aa=new q,ja=new q,Ma=new q,Na=new q,Pa=new q,Fa=new q,Ia=new q,La=new q,Ra=class extends ui{constructor(e=new ma,t=new Ea){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Fa.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Pa.fromBufferAttribute(s,e),a?Fa.addScaledVector(Pa,r):Fa.addScaledVector(Pa.sub(t),r))}t.add(Fa)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ka.copy(n.boundingSphere),ka.applyMatrix4(i),Oa.copy(e.ray).recast(e.near),ka.containsPoint(Oa.origin)===!1&&(Oa.intersectSphere(ka,Aa)===null||Oa.origin.distanceToSquared(Aa)>(e.far-e.near)**2)||(Da.copy(i).invert(),Oa.copy(e.ray).applyMatrix4(Da),(n.boundingBox===null||Oa.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,Oa)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=Ba(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=Ba(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=Ba(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=Ba(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function za(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;La.copy(s),La.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(La);return l<n.near||l>n.far?null:{distance:l,point:La.clone(),object:e}}function Ba(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,ja),e.getVertexPosition(c,Ma),e.getVertexPosition(l,Na);let u=za(e,t,n,r,ja,Ma,Na,Ia);if(u){let e=new q;Pi.getBarycoord(Ia,ja,Ma,Na,e),i&&(u.uv=Pi.getInterpolatedAttribute(i,s,c,l,e,new pr)),a&&(u.uv1=Pi.getInterpolatedAttribute(a,s,c,l,e,new pr)),o&&(u.normal=Pi.getInterpolatedAttribute(o,s,c,l,e,new q),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new q,materialIndex:0};Pi.getNormal(ja,Ma,Na,t.normal),u.face=t,u.barycoord=e}return u}var Va=class extends jr{constructor(e=null,t=1,n=1,r,i,a,o,s,c=_t,l=_t,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ha=class extends $i{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Ua=new oa,Wa=new pr(.5,.5),Ga=new q,Ka=class{constructor(e=new va,t=new va,n=new va,r=new va,i=new va,a=new va){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Wn,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Ua.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Ua.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Ua)}intersectsSprite(e){return Ua.center.set(0,0,0),Ua.radius=.7071067811865476+Wa.distanceTo(e.center),Ua.applyMatrix4(e.matrixWorld),this.intersectsSphere(Ua)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(Ga.x=r.normal.x>0?e.max.x:e.min.x,Ga.y=r.normal.y>0?e.max.y:e.min.y,Ga.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ga)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},qa=new Lr,Ja=class e{constructor(){this.coordinateSystem=Wn,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let e=0;e<t.length;e++){let r=t[e];qa.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[e]===void 0&&(n[e]=new Ka),n[e].setFromProjectionMatrix(qa,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new Ka),t[r].copy(n[r]);return this._count=e._count,this}clone(){return new e().copy(this)}},Ya=class extends ba{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new vi(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Xa=new q,Za=new q,Qa=new Lr,$a=new Ta,eo=new oa,to=new q,no=new q,ro=class extends ui{constructor(e=new ma,t=new Ya){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)Xa.fromBufferAttribute(t,e-1),Za.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=Xa.distanceTo(Za);e.setAttribute(`lineDistance`,new na(n,1))}else G(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),eo.copy(n.boundingSphere),eo.applyMatrix4(r),eo.radius+=i,e.ray.intersectsSphere(eo)===!1)return;Qa.copy(r).invert(),$a.copy(e.ray).applyMatrix4(Qa);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=io(this,e,$a,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=io(this,e,$a,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=io(this,e,$a,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=io(this,e,$a,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function io(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(Xa.fromBufferAttribute(s,i),Za.fromBufferAttribute(s,a),n.distanceSqToSegment(Xa,Za,to,no)>r)return;to.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(to);if(!(c<t.near||c>t.far))return{distance:c,point:no.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var ao=new q,oo=new q,so=class extends ro{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type=`LineSegments`}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let e=0,r=t.count;e<r;e+=2)ao.fromBufferAttribute(t,e),oo.fromBufferAttribute(t,e+1),n[e]=e===0?0:n[e-1],n[e+1]=n[e]+ao.distanceTo(oo);e.setAttribute(`lineDistance`,new na(n,1))}else G(`LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}},co=class extends ba{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new vi(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},lo=new Lr,uo=new Ta,fo=new oa,po=new q,mo=class extends ui{constructor(e=new ma,t=new co){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),fo.copy(n.boundingSphere),fo.applyMatrix4(r),fo.radius+=i,e.ray.intersectsSphere(fo)===!1)return;lo.copy(r).invert(),uo.copy(e.ray).applyMatrix4(lo);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);po.fromBufferAttribute(l,n),ho(po,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)po.fromBufferAttribute(l,a),ho(po,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function ho(e,t,n,r,i,a,o){let s=uo.distanceSqToPoint(e);if(s<n){let n=new q;uo.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var go=class extends jr{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},_o=class extends jr{constructor(e,t,n=Ot,r,i,a,o=_t,s=_t,c,l=zt,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Dr(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},vo=class extends _o{constructor(e,t=Ot,n=301,r,i,a=_t,o=_t,s,c=zt){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},yo=class extends jr{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},bo=class e extends ma{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new na(c,3)),this.setAttribute(`normal`,new na(l,3)),this.setAttribute(`uv`,new na(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new q;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},xo=class e extends ma{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new na(p,3)),this.setAttribute(`normal`,new na(m,3)),this.setAttribute(`uv`,new na(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};function So(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(wo(i))i.isRenderTargetTexture?(G(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(wo(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function Co(e){let t={};for(let n=0;n<e.length;n++){let r=So(e[n]);for(let e in r)t[e]=r[e]}return t}function wo(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function To(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Eo(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:xr.workingColorSpace}var Do={clone:So,merge:Co},Oo=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ko=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ao=class extends ba{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Oo,this.fragmentShader=ko,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=So(e.uniforms),this.uniformsGroups=To(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new vi().setHex(r.value);break;case`v2`:this.uniforms[n].value=new pr().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new q().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new Mr().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new J().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new Lr().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},jo=class extends Ao{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},Mo=class extends ba{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=In,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},No=class extends ba{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Po(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function Fo(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Io=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},Lo=class extends Io{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Nn,endingEnd:Nn}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Pn:i=e,o=2*t-n;break;case Fn:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case Pn:a=e,s=2*n-t;break;case Fn:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},Ro=class extends Io{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},zo=class extends Io{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Bo=class extends Io{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=Uo(n,t,g,y,r);i[p]=Vo(x,o,_,b,m)}return i}};function Vo(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function Ho(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function Uo(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=Vo(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=Ho(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var Wo=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Po(t,this.TimeBufferType),this.values=Po(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Po(e.times,Array),values:Po(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),Fo(e.settings)&&(n.settings={inTangents:Po(e.settings.inTangents,Array),outTangents:Po(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new zo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ro(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Lo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Bo(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case kn:t=this.InterpolantFactoryMethodDiscrete;break;case An:t=this.InterpolantFactoryMethodLinear;break;case jn:t=this.InterpolantFactoryMethodSmooth;break;case Mn:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return G(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return kn;case this.InterpolantFactoryMethodLinear:return An;case this.InterpolantFactoryMethodSmooth:return jn;case this.InterpolantFactoryMethodBezier:return Mn}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e;Fo(this.settings)&&(Go(this.settings.inTangents,e),Go(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;Fo(this.settings)&&(Ko(this.settings.inTangents,e),Ko(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(K(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(K(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){K(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){K(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&Kn(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){K(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===jn,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,Fo(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Go(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]+=t}function Ko(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}Wo.prototype.ValueTypeName=``,Wo.prototype.TimeBufferType=Float32Array,Wo.prototype.ValueBufferType=Float32Array,Wo.prototype.DefaultInterpolation=An;var qo=class extends Wo{constructor(e,t,n){super(e,t,n)}};qo.prototype.ValueTypeName=`bool`,qo.prototype.ValueBufferType=Array,qo.prototype.DefaultInterpolation=kn,qo.prototype.InterpolantFactoryMethodLinear=void 0,qo.prototype.InterpolantFactoryMethodSmooth=void 0;var Jo=class extends Wo{constructor(e,t,n,r){super(e,t,n,r)}};Jo.prototype.ValueTypeName=`color`;var Yo=class extends Wo{constructor(e,t,n,r){super(e,t,n,r)}};Yo.prototype.ValueTypeName=`number`;var Xo=class extends Io{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)mr.slerpFlat(i,0,a,c-o,a,c,s);return i}},Zo=class extends Wo{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Xo(this.times,this.values,this.getValueSize(),e)}};Zo.prototype.ValueTypeName=`quaternion`,Zo.prototype.InterpolantFactoryMethodSmooth=void 0;var Qo=class extends Wo{constructor(e,t,n){super(e,t,n)}};Qo.prototype.ValueTypeName=`string`,Qo.prototype.ValueBufferType=Array,Qo.prototype.DefaultInterpolation=kn,Qo.prototype.InterpolantFactoryMethodLinear=void 0,Qo.prototype.InterpolantFactoryMethodSmooth=void 0;var $o=class extends Wo{constructor(e,t,n,r){super(e,t,n,r)}};$o.prototype.ValueTypeName=`vector`;var es=new q,ts=new mr,ns=new q,rs=class extends ui{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new Lr,this.projectionMatrix=new Lr,this.projectionMatrixInverse=new Lr,this.coordinateSystem=Wn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(es,ts,ns),ns.x===1&&ns.y===1&&ns.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(es,ts,ns.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(es,ts,ns),ns.x===1&&ns.y===1&&ns.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(es,ts,ns.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},is=new q,as=new pr,os=new pr,ss=class extends rs{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ir*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(rr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ir*2*Math.atan(Math.tan(rr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){is.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(is.x,is.y).multiplyScalar(-e/is.z),is.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(is.x,is.y).multiplyScalar(-e/is.z)}getViewSize(e,t){return this.getViewBounds(e,as,os),t.subVectors(os,as)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(rr*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},cs=class extends rs{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},ls=class extends ma{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type=`InstancedBufferGeometry`,this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){let e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}},us=-90,ds=1,fs=class extends ui{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new ss(us,ds,e,t);r.layers=this.layers,this.add(r);let i=new ss(us,ds,e,t);i.layers=this.layers,this.add(i);let a=new ss(us,ds,e,t);a.layers=this.layers,this.add(a);let o=new ss(us,ds,e,t);o.layers=this.layers,this.add(o);let s=new ss(us,ds,e,t);s.layers=this.layers,this.add(s);let c=new ss(us,ds,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},ps=class extends ss{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}},ms=`\\[\\]\\.:\\/`,hs=RegExp(`[\\[\\]\\.:\\/]`,`g`),gs=`[^\\[\\]\\.:\\/]`,_s=`[^`+ms.replace(`\\.`,``)+`]`,vs=`((?:WC+[\\/:])*)`.replace(`WC`,gs),ys=`(WCOD+)?`.replace(`WCOD`,_s),bs=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,gs),xs=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,gs),Ss=RegExp(`^`+vs+ys+bs+xs+`$`),Cs=[`material`,`materials`,`bones`,`map`],ws=class{constructor(e,t,n){let r=n||Ts.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},Ts=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(hs,``)}static parseTrackName(e){let t=Ss.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);Cs.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){G(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){K(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){K(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){K(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){K(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){K(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){K(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){K(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;K(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){K(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){K(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ts.Composite=ws,Ts.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},Ts.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},Ts.prototype.GetterByBindingType=[Ts.prototype._getValue_direct,Ts.prototype._getValue_array,Ts.prototype._getValue_arrayElement,Ts.prototype._getValue_toArray],Ts.prototype.SetterByBindingTypeAndVersioning=[[Ts.prototype._setValue_direct,Ts.prototype._setValue_direct_setNeedsUpdate,Ts.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ts.prototype._setValue_array,Ts.prototype._setValue_array_setNeedsUpdate,Ts.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ts.prototype._setValue_arrayElement,Ts.prototype._setValue_arrayElement_setNeedsUpdate,Ts.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ts.prototype._setValue_fromArray,Ts.prototype._setValue_fromArray_setNeedsUpdate,Ts.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],class{static{this.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}};function Es(e,t,n,r){let i=Ds(r);switch(n){case It:return e*t;case Vt:return e*t/i.components*i.byteLength;case Ht:return e*t/i.components*i.byteLength;case Ut:return e*t*2/i.components*i.byteLength;case Wt:return e*t*2/i.components*i.byteLength;case Lt:return e*t*3/i.components*i.byteLength;case Rt:return e*t*4/i.components*i.byteLength;case Gt:return e*t*4/i.components*i.byteLength;case Kt:case qt:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Jt:case Yt:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Zt:case $t:return Math.max(e,16)*Math.max(t,8)/4;case Xt:case Qt:return Math.max(e,8)*Math.max(t,8)/2;case en:case tn:case rn:case an:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case nn:case on:case sn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case cn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case ln:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case un:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case dn:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case fn:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case pn:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case mn:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case hn:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case gn:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case _n:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case vn:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case yn:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case bn:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case xn:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Sn:case Cn:case wn:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Tn:case En:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Dn:case On:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function Ds(e){switch(e){case Ct:case wt:return{byteLength:1,components:1};case Et:case Tt:case At:return{byteLength:2,components:1};case jt:case Mt:return{byteLength:2,components:4};case Ot:case Dt:case kt:return{byteLength:4,components:1};case Pt:case Ft:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`187`}})),typeof window<`u`&&(window.__THREE__?G(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`187`);function Os(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function ks(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Y={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},X={common:{diffuse:{value:new vi(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new J},alphaMap:{value:null},alphaMapTransform:{value:new J},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new J}},envmap:{envMap:{value:null},envMapRotation:{value:new J},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new J}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new J}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new J},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new J},normalScale:{value:new pr(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new J},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new J}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new J}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new J}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new vi(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new vi(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new J},alphaTest:{value:0},uvTransform:{value:new J}},sprite:{diffuse:{value:new vi(16777215)},opacity:{value:1},center:{value:new pr(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new J},alphaMap:{value:null},alphaMapTransform:{value:new J},alphaTest:{value:0}}},As={basic:{uniforms:Co([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.fog]),vertexShader:Y.meshbasic_vert,fragmentShader:Y.meshbasic_frag},lambert:{uniforms:Co([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new vi(0)},envMapIntensity:{value:1}}]),vertexShader:Y.meshlambert_vert,fragmentShader:Y.meshlambert_frag},phong:{uniforms:Co([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new vi(0)},specular:{value:new vi(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Y.meshphong_vert,fragmentShader:Y.meshphong_frag},standard:{uniforms:Co([X.common,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.roughnessmap,X.metalnessmap,X.fog,X.lights,{emissive:{value:new vi(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag},toon:{uniforms:Co([X.common,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.gradientmap,X.fog,X.lights,{emissive:{value:new vi(0)}}]),vertexShader:Y.meshtoon_vert,fragmentShader:Y.meshtoon_frag},matcap:{uniforms:Co([X.common,X.bumpmap,X.normalmap,X.displacementmap,X.fog,{matcap:{value:null}}]),vertexShader:Y.meshmatcap_vert,fragmentShader:Y.meshmatcap_frag},points:{uniforms:Co([X.points,X.fog]),vertexShader:Y.points_vert,fragmentShader:Y.points_frag},dashed:{uniforms:Co([X.common,X.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Y.linedashed_vert,fragmentShader:Y.linedashed_frag},depth:{uniforms:Co([X.common,X.displacementmap]),vertexShader:Y.depth_vert,fragmentShader:Y.depth_frag},normal:{uniforms:Co([X.common,X.bumpmap,X.normalmap,X.displacementmap,{opacity:{value:1}}]),vertexShader:Y.meshnormal_vert,fragmentShader:Y.meshnormal_frag},sprite:{uniforms:Co([X.sprite,X.fog]),vertexShader:Y.sprite_vert,fragmentShader:Y.sprite_frag},background:{uniforms:{uvTransform:{value:new J},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Y.background_vert,fragmentShader:Y.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new J}},vertexShader:Y.backgroundCube_vert,fragmentShader:Y.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Y.cube_vert,fragmentShader:Y.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Y.equirect_vert,fragmentShader:Y.equirect_frag},distance:{uniforms:Co([X.common,X.displacementmap,{referencePosition:{value:new q},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Y.distance_vert,fragmentShader:Y.distance_frag},shadow:{uniforms:Co([X.lights,X.fog,{color:{value:new vi(0)},opacity:{value:1}}]),vertexShader:Y.shadow_vert,fragmentShader:Y.shadow_frag}};As.physical={uniforms:Co([As.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new J},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new J},clearcoatNormalScale:{value:new pr(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new J},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new J},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new J},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new J},sheen:{value:0},sheenColor:{value:new vi(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new J},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new J},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new J},transmissionSamplerSize:{value:new pr},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new J},attenuationDistance:{value:0},attenuationColor:{value:new vi(0)},specularColor:{value:new vi(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new J},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new J},anisotropyVector:{value:new pr},anisotropyMap:{value:null},anisotropyMapTransform:{value:new J}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag};var js={r:0,b:0,g:0},Ms=new Lr,Ns=new J;Ns.set(-1,0,0,0,1,0,0,0,1);function Ps(e,t,n,r,i,a){let o=new vi(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&i.isCubeTexture?(l===void 0&&(l=new Ra(new bo(1,1,1),new Ao({name:`BackgroundCubeMaterial`,uniforms:So(As.backgroundCube.uniforms),vertexShader:As.backgroundCube.vertexShader,fragmentShader:As.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Ms.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Ns),l.material.toneMapped=xr.getTransfer(i.colorSpace)!==Bn,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new Ra(new xo(2,2),new Ao({name:`BackgroundMaterial`,uniforms:So(As.background.uniforms),vertexShader:As.background.vertexShader,fragmentShader:As.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=xr.getTransfer(i.colorSpace)!==Bn,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(js,Eo(e)),n.buffers.color.setClear(js.r,js.g,js.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function Fs(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.isInterleavedBuffer===!0?t.stride:t.itemSize,p=s.offset;if(t.isInstancedInterleavedBuffer||t.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function Is(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function Ls(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(G(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),f=n.logarithmicDepthBuffer===!0&&d===!1;n.reversedDepthBuffer===!0&&d===!1&&G(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),n.logarithmicDepthBuffer===!0&&d===!0&&G(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function Rs(e){let t=this,n=null,r=0,i=!1,a=!1,o=new va,s=new J,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var zs=class extends Pr{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new go(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new bo(5,5,5),i=new Ao({name:`CubemapFromEquirect`,uniforms:So(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new Ra(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=bt),new fs(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},Bs=256,Vs=3,Hs=20,Us=256,Ws=16,Gs=3,Ks=new q,qs=new vi,Js=class e{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new fs(1,10,null),this._boxMesh=new Ra(new bo(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Ks}=i,s=this._renderer;this._setSize(a);let c=this._allocateTarget(),l=this._getSourceTarget(!0);t>0&&(l.texture.mipmapsAutoUpdate=!1);let u=s.autoClear,d=s.autoClearColor,f=s.autoClearDepth,p=s.autoClearStencil,m=e.background;s.autoClear=!0,s.autoClearColor=!0,s.autoClearDepth=!0,s.autoClearStencil=!0,m===null&&(e.background=s.getClearColor(qs));let h=new fs(n,r,l);return h.position.copy(o),h.update(s,e),s.autoClear=u,s.autoClearColor=d,s.autoClearDepth=f,s.autoClearStencil=p,e.background=m,t>0&&(l.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=tc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ec(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(Bs,lr(e))}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?Bs:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=Ys(e,!1,!1),n=Math.log2(e)-Vs;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name=`PMREM`,t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Ys(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let r=this._boxMesh,i=this._cubeCamera;r.material=n,i.renderTarget=e,i.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),i.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===301||e.mapping===302?(this._cubemapMaterial===null&&(this._cubemapMaterial=tc()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=ec()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Zs(),this._integrationMaterial=Qs());let n=this._cubeSize,r=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/Ws);for(let o=0;o<=r;o++){let s=e.lodToRoughness(o,r);if(o>r-Gs)a.roughness.value=s,this._renderCube(t,o,this._integrationMaterial);else{let e=s>0?Math.log2(n)+.5*Math.log2(6/(Us*s**4))+.5:0;i.roughness.value=s,i.lodBias.value=e,this._renderCube(t,o,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=$s());let n=this._blurMaterial,r=n.uniforms,i=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=i.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(i,0,n)}};function Ys(e,t,n){return new zs(e,{minFilter:St,generateMipmaps:t,type:At,colorSpace:Rn,depthBuffer:n})}function Xs(e,t,n){return new Ao({name:e,uniforms:t,vertexShader:Y.cube_vert,fragmentShader:n,side:1,blending:0,depthTest:!1,depthWrite:!1})}function Zs(){return Xs(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Us}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Qs(){return Xs(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Ws}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function $s(){return Xs(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Hs}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function ec(){return Xs(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function tc(){return Xs(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function nc(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new zs(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture&&t.isPMREMTexture!==!0){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Js(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Js(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function rc(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&Qn(`WebGLRenderer: `+e+` extension not supported.`),t}}}function ic(e,t,n,r){let i={},a=new WeakMap,o=new FinalizationRegistry(e=>delete i[e]);function s(e){c(e.target)}function c(e){e.index!==null&&t.remove(e.index);for(let n in e.attributes)t.remove(e.attributes[n]);e.removeEventListener(`dispose`,s),delete i[e.id],o.unregister(e);let c=a.get(e);c&&(t.remove(c),a.delete(e)),r.releaseStatesOfGeometry(e),e.isInstancedBufferGeometry===!0&&delete e._maxInstanceCount,n.memory.geometries--}function l(e,t){return i[t.id]===void 0&&(t.addEventListener(`dispose`,s),i[t.id]=new WeakRef(t),o.register(t,t.id,t),n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=e.index,r=e.attributes.position,i=0;if(r===void 0)return;let o=n===null?r.array.length/3-1:n.array.length,s=new(r.count>=65535?ta:ea)(Math.ceil(o/3)*6,1),c=s.array;if(n!==null){let e=n.array;i=n.version;for(let t=0,n=0;t<o;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];c[n++]=r,c[n++]=i,c[n++]=i,c[n++]=a,c[n++]=a,c[n++]=r}}else{i=r.version;for(let e=0,t=0;e<o;e+=3){let n=e+0,r=e+1,i=e+2;c[t++]=n,c[t++]=r,c[t++]=r,c[t++]=i,c[t++]=i,c[t++]=n}}s.version=i;let l=a.get(e);l&&t.remove(l),a.set(e,s)}function f(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return a.get(e)}function p(){for(let e in i){let t=i[e].deref();t!==void 0&&c(t)}}return{get:l,update:u,getWireframeAttribute:f,dispose:p}}function ac(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function oc(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:K(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function sc(e,t,n){let r=new WeakMap,i=new Mr;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new Fr(h,p,m,u);g.type=kt,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new pr(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function cc(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var lc={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function uc(e,t,n,r,i,a){let o=new Pr(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=null,u=new ma;u.setAttribute(`position`,new na([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute(`uv`,new na([0,2,0,0,2,0],2));let d=new jo({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new Ra(u,d),p=new cs(-1,1,1,-1,0,1),m=null,h=null,g=!1,_,v=null,y=[],b=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<y.length;n++){let r=y[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){y=e,b=y.length>0&&y[0].isRenderPass===!0;let t=o.width,n=o.height;y.length>0&&s===null&&(s=new Pr(t,n,{type:At,depthBuffer:!1,stencilBuffer:!1}),c=new Pr(t,n,{type:At,depthBuffer:!1,stencilBuffer:!1}));let r=i===!0&&y.some(e=>e.needsDepthTexture===!0);r!==(o.depthTexture!==null)&&(r===!0&&l===null&&(l=new _o(t,n),a===!0&&(l.format=Bt,l.type=Nt)),o.dispose(),o.depthTexture=r?l:null,o.resolveDepthBuffer=r,o.storeMultisampledDepthBuffer=r);for(let e=0;e<y.length;e++){let i=y[e];i.setSize&&i.setSize(t,n),r&&i.needsDepthTexture===!0&&i.setDepthTexture&&i.setDepthTexture(l)}},this.begin=function(e,t){if(g||e.toneMapping===0&&y.length===0)return!1;if(v=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return b===!1&&e.setRenderTarget(o),_=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return b},this.end=function(e,t){e.toneMapping=_,g=!0;let n=o,r=s;for(let i=0;i<y.length;i++){let a=y[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(m!==e.outputColorSpace||h!==e.toneMapping){m=e.outputColorSpace,h=e.toneMapping,d.defines={},xr.getTransfer(m)===`srgb`&&(d.defines.SRGB_TRANSFER=``);let t=lc[h];t&&(d.defines[t]=``),d.needsUpdate=!0}d.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(v),e.render(f,p),v=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),u.dispose(),d.dispose()}}var dc=new jr,fc=new _o(1,1),pc=new vo(1),mc=new Fr,hc=new Ir,gc=new go,_c=[],vc=[],yc=new Float32Array(16),bc=new Float32Array(9),xc=new Float32Array(4);function Sc(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=_c[i];if(a===void 0&&(a=new Float32Array(i),_c[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function Cc(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function wc(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function Tc(e,t){let n=vc[t];n===void 0&&(n=new Int32Array(t),vc[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function Ec(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function Dc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Cc(n,t))return;e.uniform2fv(this.addr,t),wc(n,t)}}function Oc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(Cc(n,t))return;e.uniform3fv(this.addr,t),wc(n,t)}}function kc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Cc(n,t))return;e.uniform4fv(this.addr,t),wc(n,t)}}function Ac(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Cc(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),wc(n,t)}else{if(Cc(n,r))return;xc.set(r),e.uniformMatrix2fv(this.addr,!1,xc),wc(n,r)}}function jc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Cc(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),wc(n,t)}else{if(Cc(n,r))return;bc.set(r),e.uniformMatrix3fv(this.addr,!1,bc),wc(n,r)}}function Mc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(Cc(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),wc(n,t)}else{if(Cc(n,r))return;yc.set(r),e.uniformMatrix4fv(this.addr,!1,yc),wc(n,r)}}function Nc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Pc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Cc(n,t))return;e.uniform2iv(this.addr,t),wc(n,t)}}function Fc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Cc(n,t))return;e.uniform3iv(this.addr,t),wc(n,t)}}function Ic(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Cc(n,t))return;e.uniform4iv(this.addr,t),wc(n,t)}}function Lc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Rc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(Cc(n,t))return;e.uniform2uiv(this.addr,t),wc(n,t)}}function zc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(Cc(n,t))return;e.uniform3uiv(this.addr,t),wc(n,t)}}function Bc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(Cc(n,t))return;e.uniform4uiv(this.addr,t),wc(n,t)}}function Vc(e){return e.version===0&&(e.compareFunction=519,e.needsUpdate=!0),e}function Hc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_2D_SHADOW?Vc(fc):dc,n.setTexture2D(t||a,i)}function Uc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||hc,i)}function Wc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_CUBE_SHADOW?Vc(pc):gc,n.setTextureCube(t||a,i)}function Gc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||mc,i)}function Kc(e){switch(e){case 5126:return Ec;case 35664:return Dc;case 35665:return Oc;case 35666:return kc;case 35674:return Ac;case 35675:return jc;case 35676:return Mc;case 5124:case 35670:return Nc;case 35667:case 35671:return Pc;case 35668:case 35672:return Fc;case 35669:case 35673:return Ic;case 5125:return Lc;case 36294:return Rc;case 36295:return zc;case 36296:return Bc;case 35678:case 36198:case 36298:case 36306:case 35682:return Hc;case 35679:case 36299:case 36307:return Uc;case 35680:case 36300:case 36308:case 36293:return Wc;case 36289:case 36303:case 36311:case 36292:return Gc}}function qc(e,t){e.uniform1fv(this.addr,t)}function Jc(e,t){let n=Sc(t,this.size,2);e.uniform2fv(this.addr,n)}function Yc(e,t){let n=Sc(t,this.size,3);e.uniform3fv(this.addr,n)}function Xc(e,t){let n=Sc(t,this.size,4);e.uniform4fv(this.addr,n)}function Zc(e,t){let n=Sc(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Qc(e,t){let n=Sc(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function $c(e,t){let n=Sc(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function el(e,t){e.uniform1iv(this.addr,t)}function tl(e,t){e.uniform2iv(this.addr,t)}function nl(e,t){e.uniform3iv(this.addr,t)}function rl(e,t){e.uniform4iv(this.addr,t)}function il(e,t){e.uniform1uiv(this.addr,t)}function al(e,t){e.uniform2uiv(this.addr,t)}function ol(e,t){e.uniform3uiv(this.addr,t)}function sl(e,t){e.uniform4uiv(this.addr,t)}function cl(e,t,n){let r=this.cache,i=t.length,a=Tc(n,i);Cc(r,a)||(e.uniform1iv(this.addr,a),wc(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?Vc(fc):dc;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function ll(e,t,n){let r=this.cache,i=t.length,a=Tc(n,i);Cc(r,a)||(e.uniform1iv(this.addr,a),wc(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||hc,a[e])}function ul(e,t,n){let r=this.cache,i=t.length,a=Tc(n,i);Cc(r,a)||(e.uniform1iv(this.addr,a),wc(r,a));let o;o=this.type===e.SAMPLER_CUBE_SHADOW?Vc(pc):gc;for(let e=0;e!==i;++e)n.setTextureCube(t[e]||o,a[e])}function dl(e,t,n){let r=this.cache,i=t.length,a=Tc(n,i);Cc(r,a)||(e.uniform1iv(this.addr,a),wc(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||mc,a[e])}function fl(e){switch(e){case 5126:return qc;case 35664:return Jc;case 35665:return Yc;case 35666:return Xc;case 35674:return Zc;case 35675:return Qc;case 35676:return $c;case 5124:case 35670:return el;case 35667:case 35671:return tl;case 35668:case 35672:return nl;case 35669:case 35673:return rl;case 5125:return il;case 36294:return al;case 36295:return ol;case 36296:return sl;case 35678:case 36198:case 36298:case 36306:case 35682:return cl;case 35679:case 36299:case 36307:return ll;case 35680:case 36300:case 36308:case 36293:return ul;case 36289:case 36303:case 36311:case 36292:return dl}}var pl=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Kc(t.type)}},ml=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=fl(t.type)}},hl=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},gl=/(\w+)(\])?(\[|\.)?/g;function _l(e,t){e.seq.push(t),e.map[t.id]=t}function vl(e,t,n){let r=e.name,i=r.length;for(gl.lastIndex=0;;){let a=gl.exec(r),o=gl.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){_l(n,l===void 0?new pl(s,e,t):new ml(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new hl(s),_l(n,e)),n=e}}}var yl=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);vl(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function bl(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var xl=37297,Sl=0;function Cl(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var wl=new J;function Tl(e){xr._getMatrix(wl,xr.workingColorSpace,e);let t=`mat3( ${wl.elements.map(e=>e.toFixed(4))} )`;switch(xr.getTransfer(e)){case zn:return[t,`LinearTransferOETF`];case Bn:return[t,`sRGBTransferOETF`];default:return G(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function El(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+Cl(e.getShaderSource(t),r)}return i}function Dl(e,t){let n=Tl(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var Ol={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function kl(e,t){let n=Ol[t];return n===void 0?(G(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var Al=new q;function jl(){return xr.getLuminanceCoefficients(Al),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${Al.x.toFixed(4)}, ${Al.y.toFixed(4)}, ${Al.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function Ml(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(Fl).join(`
`)}function Nl(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function Pl(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function Fl(e){return e!==``}function Il(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function Ll(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Rl=/^[ \t]*#include +<([\w\d./]+)>/gm;function zl(e){return e.replace(Rl,Bl)}function Bl(e,t){let n=Y[t];if(n===void 0)throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return zl(n)}var Vl=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Hl(e){return e.replace(Vl,Ul)}function Ul(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Wl(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var Gl={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Kl(e){return Gl[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var ql={302:`ENVMAP_MODE_REFRACTION`};function Jl(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:ql[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Yl={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Xl(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Yl[e.combine]||`ENVMAP_BLENDING_NONE`}function Zl(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Kl(n),l=n.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,u=Jl(n),d=Xl(n),f=Ml(n),p=Nl(a),m=i.createProgram(),h,g,_=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(h=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(Fl).join(`
`),h.length>0&&(h+=`
`),g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(Fl).join(`
`),g.length>0&&(g+=`
`)):(h=[Wl(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+n.diffuseRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(Fl).join(`
`),g=[Wl(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,n.envMapPMREM?`#define ENVMAP_MAX_LOD `+n.envMapMaxLod+`.0`:``,n.envMapPMREM?`#define ENVMAP_SIZE `+n.envMapSize+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Y.tonemapping_pars_fragment,n.toneMapping===0?``:kl(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Y.colorspace_pars_fragment,Dl(`linearToOutputTexel`,n.outputColorSpace),jl(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(Fl).join(`
`)),o=zl(o),o=Il(o,n),o=Ll(o,n),s=zl(s),s=Il(s,n),s=Ll(s,n),o=Hl(o),s=Hl(s),n.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,h=[f,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+h,g=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+g);let v=_+h+o,y=_+g+s,b=bl(i,i.VERTEX_SHADER,v),x=bl(i,i.FRAGMENT_SHADER,y);i.attachShader(m,b),i.attachShader(m,x),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(m,0,`position`):i.bindAttribLocation(m,0,n.index0AttributeName),i.linkProgram(m);function S(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(m)||``,r=i.getShaderInfoLog(b)||``,a=i.getShaderInfoLog(x)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,m,b,x);else{let e=El(i,b,`vertex`),n=El(i,x,`fragment`);K(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):G(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:h},fragmentShader:{log:c,prefix:g}})}i.deleteShader(b),i.deleteShader(x),C=new yl(i,m),w=Pl(i,m)}let C;this.getUniforms=function(){return C===void 0&&S(this),C};let w;this.getAttributes=function(){return w===void 0&&S(this),w};let T=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=i.getProgramParameter(m,xl)),T},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=Sl++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=x,this}var Ql=0,$l=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new eu(e),t.set(e,n)),n}},eu=class{constructor(e){this.id=Ql++,this.code=e,this.usedTimes=0}};function tu(e){return e===1030||e===37490||e===36285}function nu(e,t,n,r,i,a){let o=new Jr,s=new $l,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function p(e){return c.add(e),e===0?`uv`:`uv${e}`}function m(i,o,l,u,m,h){let g=u.fog,_=m.geometry,v=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,b=t.get(i.envMap||v,y),x=f[i.type],S=r.precision;i.precision!==null&&(S=r.getMaxPrecision(i.precision),S!==i.precision&&G(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,S,`instead.`));let C=_.morphAttributes.position||_.morphAttributes.normal||_.morphAttributes.color,w=C===void 0?0:C.length,T=0;_.morphAttributes.position!==void 0&&(T=1),_.morphAttributes.normal!==void 0&&(T=2),_.morphAttributes.color!==void 0&&(T=3);let E,D,O,k;if(x){let e=As[x];E=e.vertexShader,D=e.fragmentShader}else{E=i.vertexShader,D=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),O=e.id,k=t.id}let A=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),M=m.isInstancedMesh===!0,N=m.isBatchedMesh===!0,P=!!i.map,F=!!i.matcap,I=!!b,L=I&&b.isPMREMTexture===!0,ee=!!i.aoMap,te=!!i.lightMap,ne=!!i.bumpMap&&i.wireframe===!1,R=!!i.normalMap,z=!!i.displacementMap,B=!!i.emissiveMap,re=!!i.metalnessMap,ie=!!i.roughnessMap,ae=i.anisotropy>0,oe=i.clearcoat>0,se=i.diffuseRoughness>0,ce=i.dispersion>0,le=i.retroreflectivity>0,ue=i.iridescence>0,de=i.sheen>0,fe=i.transmission>0,pe=ae&&!!i.anisotropyMap,me=oe&&!!i.clearcoatMap,he=oe&&!!i.clearcoatNormalMap,ge=oe&&!!i.clearcoatRoughnessMap,_e=se&&!!i.diffuseRoughnessMap,V=ue&&!!i.iridescenceMap,ve=ue&&!!i.iridescenceThicknessMap,ye=de&&!!i.sheenColorMap,be=de&&!!i.sheenRoughnessMap,H=!!i.specularMap,xe=!!i.specularColorMap,U=!!i.specularIntensityMap,W=fe&&!!i.transmissionMap,Se=fe&&!!i.thicknessMap,Ce=!!i.gradientMap,we=!!i.alphaMap,Te=i.alphaTest>0,Ee=!!i.alphaHash,De=!!i.extensions,Oe=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Oe=e.toneMapping);let ke=L?b.isCompressedCubeTexture?b.image[0].mipmaps:b.mipmaps:null,Ae={shaderID:x,shaderType:i.type,shaderName:i.name,vertexShader:E,fragmentShader:D,defines:i.defines,customVertexShaderID:O,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:S,batching:N,batchingColor:N&&m._colorsTexture!==null,instancing:M,instancingColor:M&&m.instanceColor!==null,instancingMorph:M&&m.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:xr.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:P,matcap:F,envMap:I,envMapMode:I&&b.mapping,envMapPMREM:L,envMapMaxLod:L?ke.length-1:null,envMapSize:L?ke[0].width:null,aoMap:ee,lightMap:te,bumpMap:ne,normalMap:R,displacementMap:z,emissiveMap:B,normalMapObjectSpace:R&&i.normalMapType===1,normalMapTangentSpace:R&&i.normalMapType===0,packedNormalMap:R&&i.normalMapType===0&&tu(i.normalMap.format),metalnessMap:re,roughnessMap:ie,anisotropy:ae,anisotropyMap:pe,clearcoat:oe,clearcoatMap:me,clearcoatNormalMap:he,clearcoatRoughnessMap:ge,diffuseRoughness:se,diffuseRoughnessMap:_e,dispersion:ce,retroreflection:le,iridescence:ue,iridescenceMap:V,iridescenceThicknessMap:ve,sheen:de,sheenColorMap:ye,sheenRoughnessMap:be,specularMap:H,specularColorMap:xe,specularIntensityMap:U,transmission:fe,transmissionMap:W,thicknessMap:Se,gradientMap:Ce,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:we,alphaTest:Te,alphaHash:Ee,combine:i.combine,mapUv:P&&p(i.map.channel),aoMapUv:ee&&p(i.aoMap.channel),lightMapUv:te&&p(i.lightMap.channel),bumpMapUv:ne&&p(i.bumpMap.channel),normalMapUv:R&&p(i.normalMap.channel),displacementMapUv:z&&p(i.displacementMap.channel),emissiveMapUv:B&&p(i.emissiveMap.channel),metalnessMapUv:re&&p(i.metalnessMap.channel),roughnessMapUv:ie&&p(i.roughnessMap.channel),anisotropyMapUv:pe&&p(i.anisotropyMap.channel),clearcoatMapUv:me&&p(i.clearcoatMap.channel),clearcoatNormalMapUv:he&&p(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ge&&p(i.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:_e&&p(i.diffuseRoughnessMap.channel),iridescenceMapUv:V&&p(i.iridescenceMap.channel),iridescenceThicknessMapUv:ve&&p(i.iridescenceThicknessMap.channel),sheenColorMapUv:ye&&p(i.sheenColorMap.channel),sheenRoughnessMapUv:be&&p(i.sheenRoughnessMap.channel),specularMapUv:H&&p(i.specularMap.channel),specularColorMapUv:xe&&p(i.specularColorMap.channel),specularIntensityMapUv:U&&p(i.specularIntensityMap.channel),transmissionMapUv:W&&p(i.transmissionMap.channel),thicknessMapUv:Se&&p(i.thicknessMap.channel),alphaMapUv:we&&p(i.alphaMap.channel),vertexTangents:!!_.attributes.tangent&&(R||ae),vertexNormals:!!_.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!_.attributes.color&&_.attributes.color.itemSize===4,pointsUvs:m.isPoints===!0&&!!_.attributes.uv&&(P||we),fog:!!g,useFog:i.fog===!0,fogExp2:!!g&&g.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||_.attributes.normal===void 0&&R===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:m.isSkinnedMesh===!0,hasPositionAttribute:_.attributes.position!==void 0,morphTargets:_.morphAttributes.position!==void 0,morphNormals:_.morphAttributes.normal!==void 0,morphColors:_.morphAttributes.color!==void 0,morphTargetsCount:w,morphTextureStride:T,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:h.filter(e=>e.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:Oe,decodeVideoTexture:P&&i.map.isVideoTexture===!0&&xr.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:B&&i.emissiveMap.isVideoTexture===!0&&xr.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:De&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(De&&i.extensions.multiDraw===!0||N)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Ae.vertexUv1s=c.has(1),Ae.vertexUv2s=c.has(2),Ae.vertexUv3s=c.has(3),c.clear(),Ae}function h(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(g(n,t),_(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function g(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapPMREM),e.push(t.envMapMaxLod),e.push(t.envMapSize),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.diffuseRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.numLightProbeGrids),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function _(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.diffuseRoughness&&o.enable(25),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function v(e){let t=f[e.type],n;if(t){let e=As[t];n=Do.clone(e.uniforms)}else n=e.uniforms;return n}function y(t,n){let r=u.get(n);return r===void 0?(r=new Zl(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function b(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function x(e){s.remove(e)}function S(){s.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:v,acquireProgram:y,releaseProgram:b,releaseShaderCache:x,programs:l,dispose:S}}function ru(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function iu(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function au(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function ou(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||iu),r.length>1&&r.sort(t||au),i.length>1&&i.sort(t||au)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function su(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new ou,e.set(t,[i])):n>=r.length?(i=new ou,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function cu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new q,color:new vi};break;case`SpotLight`:n={position:new q,direction:new q,color:new vi,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new q,color:new vi,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new q,skyColor:new vi,groundColor:new vi};break;case`RectAreaLight`:n={color:new vi,position:new q,halfWidth:new q,halfHeight:new q}}return e[t.id]=n,n}}}function lu(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new pr};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new pr};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new pr,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var uu=0;function du(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function fu(e){let t=new cu,n=lu(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new q);let i=new q,a=new Lr,o=new Lr;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(du);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=X.LTC_FLOAT_1,r.rectAreaLTC2=X.LTC_FLOAT_2):(r.rectAreaLTC1=X.LTC_HALF_1,r.rectAreaLTC2=X.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=uu++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function pu(e){let t=new fu(e),n=[],r=[],i=[];function a(e){u.camera=e,n.length=0,r.length=0,i.length=0}function o(e){e.isLightProbeGrid?i.push(e):n.push(e)}function s(e){r.push(e)}function c(){t.setup(n),i.sort((e,t)=>e.priority-t.priority||e.id-t.id)}function l(e){t.setupView(n,e)}let u={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:u,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:s}}function mu(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new pu(e),t.set(n,[a])):r>=i.length?(a=new pu(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var hu=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,gu=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,_u=[new q(1,0,0),new q(-1,0,0),new q(0,1,0),new q(0,-1,0),new q(0,0,1),new q(0,0,-1)],vu=[new q(0,-1,0),new q(0,-1,0),new q(0,0,1),new q(0,0,-1),new q(0,-1,0),new q(0,-1,0)],yu=new Lr,bu=new q,xu=new q;function Su(e,t,n){let r=new Ka,i=new pr,a=new pr,o=new Mr,s=new Mo,c=new No,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new Ao({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new pr},radius:{value:4}},vertexShader:hu,fragmentShader:gu}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new ma;m.setAttribute(`position`,new $i(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new Ra(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(G(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){G(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){G(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new Pr(i.x,i.y,{format:Ut,type:At,minFilter:bt,magFilter:bt,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new _o(i.x,i.y,kt),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=zt,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=_t,d.map.depthTexture.magFilter=_t}else l.isPointLight?(d.map=new zs(i.x),d.map.depthTexture=new vo(i.x,Ot)):(d.map=new Pr(i.x,i.y),d.map.depthTexture=new _o(i.x,i.y,Ot)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=zt,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=bt,d.map.depthTexture.magFilter=bt):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=_t,d.map.depthTexture.magFilter=_t);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);let _=d.camera.layers.mask&4294967294?d.camera.layers:s.layers;for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),bu.setFromMatrixPosition(l.matrixWorld),e.position.copy(bu),xu.copy(e.position),xu.add(_u[t]),e.up.copy(vu[t]),e.lookAt(xu),e.updateMatrixWorld(),n.makeTranslation(-bu.x,-bu.y,-bu.z),yu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(yu,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,_,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new Pr(i.x,i.y,{format:Ut,type:At}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s,c){if(n.visible===!1)return;if(n.layers.test(s)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&c===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),s=n.material;if(Array.isArray(s)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=s[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,c);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(s.visible){let t=y(n,s,o,c);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let l=n.children;for(let e=0,t=l.length;e<t;e++)b(l[e],i,a,o,s,c)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function Cu(e,t){function n(){let t=!1,n=new Mr,r=null,i=new Mr(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?re(e.DEPTH_TEST):ie(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=er[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?re(e.STENCIL_TEST):ie(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c={},l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new vi(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,M=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),N=!1,P=0,F=e.getParameter(e.VERSION);F.indexOf(`WebGL`)===-1?F.indexOf(`OpenGL ES`)!==-1&&(P=parseFloat(/^OpenGL ES (\d)/.exec(F)[1]),N=P>=2):(P=parseFloat(/^WebGL (\d)/.exec(F)[1]),N=P>=1);let I=null,L={},ee=e.getParameter(e.SCISSOR_BOX),te=e.getParameter(e.VIEWPORT),ne=new Mr().fromArray(ee),R=new Mr().fromArray(te);function z(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let B={};B[e.TEXTURE_2D]=z(e.TEXTURE_2D,e.TEXTURE_2D,1),B[e.TEXTURE_CUBE_MAP]=z(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),B[e.TEXTURE_2D_ARRAY]=z(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),B[e.TEXTURE_3D]=z(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),re(e.DEPTH_TEST),o.setFunc(3),fe(!1),pe(1),re(e.CULL_FACE),ue(0);function re(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function ie(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function ae(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function oe(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function se(t){return h!==t&&(e.useProgram(t),h=t,!0)}let ce={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};ce[103]=e.MIN,ce[104]=e.MAX;let le={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function ue(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(ie(e.BLEND),g=!1);else if(g===!1&&(re(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:K(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:K(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:K(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:K(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(ce[n],ce[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(le[r],le[i],le[o],le[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function de(t,n){t.side===2?ie(e.CULL_FACE):re(e.CULL_FACE);let r=t.side===1;n&&(r=!r),fe(r),t.blending===1&&t.transparent===!1?ue(0):ue(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),he(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?re(e.SAMPLE_ALPHA_TO_COVERAGE):ie(e.SAMPLE_ALPHA_TO_COVERAGE)}function fe(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function pe(t){t===0?ie(e.CULL_FACE):(re(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function me(t){t!==k&&(N&&e.lineWidth(t),k=t)}function he(t,n,r){t?(re(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n,r=-r),e.polygonOffset(n,r))):ie(e.POLYGON_OFFSET_FILL)}function ge(t){t?re(e.SCISSOR_TEST):ie(e.SCISSOR_TEST)}function _e(t){t===void 0&&(t=e.TEXTURE0+M-1),I!==t&&(e.activeTexture(t),I=t)}function V(t,n,r){r===void 0&&(r=I===null?e.TEXTURE0+M-1:I);let i=L[r];i===void 0&&(i={type:void 0,texture:void 0},L[r]=i),(i.type!==t||i.texture!==n)&&(I!==r&&(e.activeTexture(r),I=r),e.bindTexture(t,n||B[t]),i.type=t,i.texture=n)}function ve(){let t=L[I];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function ye(){try{e.compressedTexImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function be(){try{e.compressedTexImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function H(){try{e.texSubImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function xe(){try{e.texSubImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function U(){try{e.compressedTexSubImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function W(){try{e.compressedTexSubImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Se(){try{e.texStorage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Ce(){try{e.texStorage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function we(){try{e.texImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Te(){try{e.texImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Ee(t){return d[t]===void 0?e.getParameter(t):d[t]}function De(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function Oe(t){ne.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),ne.copy(t))}function ke(t){R.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),R.copy(t))}function Ae(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),e.uniformBlockBinding(n,i,i),r.set(t,i))}function je(t,n,r){let i=l.get(n).get(t);c[i]!==r&&(e.bindBufferBase(e.UNIFORM_BUFFER,i,r),c[i]=r)}function Me(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},I=null,L={},f={},c={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new vi(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ne.set(0,0,e.canvas.width,e.canvas.height),R.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:re,disable:ie,bindFramebuffer:ae,drawBuffers:oe,useProgram:se,setBlending:ue,setMaterial:de,setFlipSided:fe,setCullFace:pe,setLineWidth:me,setPolygonOffset:he,setScissorTest:ge,activeTexture:_e,bindTexture:V,unbindTexture:ve,compressedTexImage2D:ye,compressedTexImage3D:be,texImage2D:we,texImage3D:Te,pixelStorei:De,getParameter:Ee,updateUBOMapping:Ae,uniformBlockBinding:je,texStorage2D:Se,texStorage3D:Ce,texSubImage2D:H,texSubImage3D:xe,compressedTexSubImage2D:U,compressedTexSubImage3D:W,scissor:Oe,viewport:ke,reset:Me}}function wu(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new pr,u=new WeakMap,d=new Set,f,p=new WeakMap,m=new Set,h=new FinalizationRegistry(e=>m.delete(e)),g=!1;try{g=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function _(e,t){return g?new OffscreenCanvas(e,t):qn(`canvas`)}function v(e,t,n){let r=1,i=Se(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=_(n,a));let o=t?_(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),G(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&G(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function y(e){return e.generateMipmaps}function b(t){e.generateMipmap(t)}function x(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function S(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];G(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||G(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?zn:xr.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function C(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,G(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function w(e,t){return y(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function T(e){let t=new WeakRef(e);r.get(e).__ref=t,m.add(t),h.register(e,t,t)}function E(e){let t=r.get(e).__ref;t!==void 0&&(m.delete(t),h.unregister(t))}function D(e){k(e.target)}function O(e){A(e.target)}function k(e){e.removeEventListener(`dispose`,D),E(e),M(e),e.isVideoTexture&&u.delete(e),e.isHTMLTexture&&d.delete(e)}function A(e){e.removeEventListener(`dispose`,O),E(e),P(e)}function j(){for(let e of m){let t=e.deref();t!==void 0&&(t.isRenderTarget===!0?A(t):k(t))}m.clear(),d.clear()}function M(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&N(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function N(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function P(t){let n=r.get(t);n.__depthDisposeCallback&&n.__depthDisposeCallback();let i=t.depthTexture;if(i&&i.renderTarget===t&&k(i),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let a=t.textures;for(let t=0,n=a.length;t<n;t++){let n=r.get(a[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(a[t])}r.remove(t)}let F=0;function I(){F=0}function L(){return F}function ee(e){F=e}function te(){let e=F;return e>=i.maxTextures&&G(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),F+=1,e}function ne(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.mipmapsAutoUpdate),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function R(t,i){let a=r.get(t);if(t.isVideoTexture&&U(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)G(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)G(`WebGLRenderer: Texture marked for update but image is incomplete`);else{de(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function z(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?de(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function B(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?de(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function re(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?fe(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let ie={[mt]:e.REPEAT,[ht]:e.CLAMP_TO_EDGE,[gt]:e.MIRRORED_REPEAT},ae={[_t]:e.NEAREST,[vt]:e.NEAREST_MIPMAP_NEAREST,[yt]:e.NEAREST_MIPMAP_LINEAR,[bt]:e.LINEAR,[xt]:e.LINEAR_MIPMAP_NEAREST,[St]:e.LINEAR_MIPMAP_LINEAR},oe={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function se(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&G(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,ie[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,ie[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,ie[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,ae[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,ae[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,oe[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function ce(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,D),T(n));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=ne(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&N(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function le(e,t,n){return Math.floor(Math.floor(e/n)/t)}function ue(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=le(n.start,r.width,4),c=le(t.start,r.width,4);n.start<=i+1&&a===c&&le(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function de(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=ce(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=xr.getPrimaries(xr.workingColorSpace),r=o.colorSpace===``?null:xr.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=v(o.image,!1,i.maxTextureSize);t=W(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=S(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);se(c,o);let h,g=o.mipmaps,_=o.isVideoTexture!==!0,x=f.__version===void 0||l===!0,T=u.dataReady,E=w(o,t);if(o.isDepthTexture)m=C(o.format===Bt,o.type),x&&(_?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(g.length>0){_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else _?(x&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&ue(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){_&&x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,g[0].width,g[0].height,t.depth);for(let i=0,a=g.length;i<a;i++)if(h=g[i],o.format!==1023){if(r!==null){if(_){if(T){if(o.layerUpdates.size>0){let t=Es(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else G(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else _?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],o.format===1023?_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?G(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):_?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(_){if(x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=Es(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)_?(x&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(x){if(_)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(g.length>0){if(_&&x){let t=Se(g[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(_){if(x){let r=Se(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);y(o)&&o.mipmapsAutoUpdate===!0&&b(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function fe(t,o,s){if(o.image.length!==6)return;let c=ce(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=xr.getPrimaries(xr.workingColorSpace),r=o.colorSpace===``?null:xr.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=v(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=W(o,m[e]);let h=m[0],g=a.convert(o.format,o.colorSpace),_=a.convert(o.type),x=S(o.internalFormat,g,_,o.normalized,o.colorSpace),T=o.isVideoTexture!==!0,E=u.__version===void 0||c===!0,D=l.dataReady,O=w(o,h);se(e.TEXTURE_CUBE_MAP,o);let k;if(o.isDepthTexture){if(x=C(o.format===Bt,o.type),E){if(T)n.texStorage2D(e.TEXTURE_CUBE_MAP,1,x,h.width,h.height);else for(let t=0;t<6;t++)n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,h.width,h.height,0,g,_,null)}}else if(f){T&&E&&n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,h.width,h.height);for(let t=0;t<6;t++){k=m[t].mipmaps;for(let r=0;r<k.length;r++){let i=k[r];o.format===1023?T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,g,_,i.data):g===null?G(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):T?D&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,i.data)}}}else{if(k=o.mipmaps,T&&E){k.length>0&&O++;let t=Se(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,t.width,t.height)}for(let t=0;t<6;t++)if(p){T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,g,_,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,m[t].width,m[t].height,0,g,_,m[t].data);for(let r=0;r<k.length;r++){let i=k[r].image[t].image;T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,i.width,i.height,0,g,_,i.data)}}else{T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,g,_,m[t]);for(let r=0;r<k.length;r++){let i=k[r];T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,g,_,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,g,_,i.image[t])}}}y(o)&&o.mipmapsAutoUpdate===!0&&b(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function pe(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=S(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),xe(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,H(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function me(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=C(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;xe(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,H(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,H(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=S(o.internalFormat,c,l,o.normalized,o.colorSpace);xe(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,H(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,H(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function he(t,i,a){let o=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let c=r.get(i.depthTexture);c.__renderTarget=i;let l=o?i.depthTexture.image[0]:i.depthTexture.image;c.__webglTexture&&l.width===i.width&&l.height===i.height||(l.width=i.width,l.height=i.height,i.depthTexture.needsUpdate=!0),o?re(i.depthTexture,0):R(i.depthTexture,0);let u=c.__webglTexture,d=H(i),f=o?e.TEXTURE_CUBE_MAP_POSITIVE_X+a:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)xe(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)xe(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function ge(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)he(i.__webglFramebuffer[e],t,e);else t.texture.mipmaps.length>0?he(i.__webglFramebuffer[0],t,0):he(i.__webglFramebuffer,t,0)}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),me(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else if(t.texture.mipmaps.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),me(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function _e(t,n,i){let a=r.get(t);n!==void 0&&pe(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&ge(t)}function V(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,O),T(t);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&xe(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=S(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=H(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),me(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),se(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)pe(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else pe(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);y(i)?b(e.TEXTURE_CUBE_MAP):i.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),se(c,a),pe(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),y(a)&&b(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),se(r,i),i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)pe(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else pe(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);y(i)?b(r):i.mipmaps.length>0&&e.texParameteri(r,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}t.depthBuffer&&ge(t)}function ve(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(y(a)&&a.mipmapsAutoUpdate===!0){let t=x(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),b(t),n.unbindTexture()}}}let ye=[];function be(t){if(t.samples>0){if(xe(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer),t.texture.mipmaps.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(ye.length=0,ye.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&ye.push(l),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,ye))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function H(e){return Math.min(i.maxSamples,e.samples)}function xe(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function U(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function W(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(xr.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&G(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):K(`WebGLTextures: Unsupported texture color space:`,n)),t}function Se(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=te,this.resetTextureUnits=I,this.getTextureUnits=L,this.setTextureUnits=ee,this.setTexture2D=R,this.setTexture2DArray=z,this.setTexture3D=B,this.setTextureCube=re,this.rebindTextures=_e,this.setupRenderTarget=V,this.updateRenderTargetMipmap=ve,this.updateMultisampleRenderTarget=be,this.setupDepthRenderbuffer=ge,this.setupFrameBufferTexture=pe,this.useMultisampledRTT=xe,this.dispose=j}function Tu(e,t){function n(n,r=``){let i,a=xr.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var Eu=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Du=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Ou=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new yo(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Ao({vertexShader:Eu,fragmentShader:Du,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ra(new xo(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ku=class extends tr{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new Ou,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new pr,C=null,w=null,T=new ss;T.viewport=new Mr;let E=new ss;E.viewport=new Mr;let D=[T,E],O=new ps,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new pi,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new pi,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new pi,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function M(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,M),r.removeEventListener(`inputsourceschange`,N);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,ee.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&G(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&G(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,M),r.addEventListener(`inputsourceschange`,N),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?Bt:zt,a=_.stencil?Nt:Ot);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Pr(d.textureWidth,d.textureHeight,{format:Rt,type:Ct,depthTexture:new _o(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new Pr(f.framebufferWidth,f.framebufferHeight,{format:Rt,type:Ct,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),ee.setContext(r),ee.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function N(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}function P(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;P(O,i);for(let e=0;e<a.length;e++)P(a[e],i);O.projectionMatrix.copy(T.projectionMatrix),O.projectionMatrixInverse.copy(T.projectionMatrixInverse),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),F(e,O,i)};function F(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=ir*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let I=null;function L(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new ss,o.layers.enable(n),o.viewport=new Mr,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new yo,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}I&&I(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let ee=new Os;ee.setAnimationLoop(L),this.setAnimationLoop=function(e){I=e},this.dispose=function(){}}},Au=new Lr,ju=new J;ju.set(-1,0,0,0,1,0,0,0,1);function Mu(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Eo(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(Au.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(ju),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.diffuseRoughness>0&&(e.diffuseRoughness.value=t.diffuseRoughness,t.diffuseRoughnessMap&&(e.diffuseRoughnessMap.value=t.diffuseRoughnessMap,n(t.diffuseRoughnessMap,e.diffuseRoughnessMapTransform))),t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessMinimum,e.iridescenceThicknessMaximum.value=t.iridescenceThicknessMaximum,t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Nu(e,t,n,r){let i={},a={};function o(e,t){let n=t.program;r.uniformBlockBinding(e,n,i[e.id])}function s(e,n){let o=i[e.id];o===void 0&&(m(e),o=c(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let u=t.render.frame;a[e.id]!==u&&(l(e),a[e.id]=u)}function c(t){let n=e.createBuffer(),r=t.__size,i=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,n),e.bufferData(e.UNIFORM_BUFFER,r,i),e.bindBuffer(e.UNIFORM_BUFFER,null),n}function l(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)u(t[n],e,n,a);else u(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function u(t,n,r,i){if(f(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=h(i,!0);d(i,t.__data,e),e+=a.storage/Float32Array.BYTES_PER_ELEMENT}}else d(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function d(e,t,n){typeof e==`number`||typeof e==`boolean`?t[n]=e:e.isMatrix3?(t[n]=e.elements[0],t[n+1]=e.elements[1],t[n+2]=e.elements[2],t[n+3]=0,t[n+4]=e.elements[3],t[n+5]=e.elements[4],t[n+6]=e.elements[5],t[n+7]=0,t[n+8]=e.elements[6],t[n+9]=e.elements[7],t[n+10]=e.elements[8],t[n+11]=0):ArrayBuffer.isView(e)?t.set(e.subarray(0,t.length-n),n):e.toArray(t,n)}function f(e,t,n,r){let i=e.value,a=t+`_`+n;if(Array.isArray(i)){r[a]===void 0&&(r[a]=[]);let e=r[a],t=!1;for(let n=0;n<i.length;n++)p(i[n],e,n)===!0&&(t=!0);return t}return p(i,r,a)}function p(e,t,n){if(t[n]===void 0)return t[n]=typeof e==`number`||typeof e==`boolean`?e:ArrayBuffer.isView(e)?e.slice():e.clone(),!0;{let r=t[n];if(typeof e==`number`||typeof e==`boolean`){if(r!==e)return t[n]=e,!0}else if(ArrayBuffer.isView(e))return!0;else if(r.equals(e)===!1)return r.copy(e),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let i=0,a=r.length;i<a;i++){let a=r[i],o=Array.isArray(a.value)?a.value:[a.value],s=Array.isArray(t[e])||Array.isArray(a.value),c=n;for(let e=0,t=o.length;e<t;e++){let t=o[e],r=h(t,s),i=n%16,a=i%r.boundary,l=i+a;n+=a,l!==0&&16-l<r.storage&&(n+=16-l),e===0&&(c=n),n+=r.storage}a.__data=new(a.type===`int`?Int32Array:a.type===`uint`?Uint32Array:Float32Array)((n-c)/Float32Array.BYTES_PER_ELEMENT),a.__offset=c}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e,t){let n={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(n.boundary=4,n.storage=4):e.isVector2?(n.boundary=8,n.storage=8):e.isVector3||e.isColor?(n.boundary=16,n.storage=12):e.isVector4?(n.boundary=16,n.storage=16):e.isMatrix3?(n.boundary=16,n.storage=48):e.isMatrix4?(n.boundary=16,n.storage=64):e.isTexture?G(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(n.boundary=16,n.storage=e.byteLength):G(`WebGLRenderer: Unsupported uniform value type.`,e),t===!0&&(n.boundary=16,n.storage=Math.ceil(n.storage/16)*16),n}function g(t){let n=t.target;n.removeEventListener(`dispose`,g),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);i={},a={}}return{bind:o,update:s,dispose:_}}var Pu=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Fu=null;function Iu(){return Fu===null&&(Fu=new Va(Pu,16,16,Ut,At),Fu.name=`DFG_LUT`,Fu.minFilter=bt,Fu.magFilter=bt,Fu.wrapS=ht,Fu.wrapT=ht,Fu.generateMipmaps=!1,Fu.needsUpdate=!0),Fu}var Lu=class{constructor(e={}){let{canvas:t=Jn(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Ct}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([Gt,Wt,Ht]),g=new Set([Ct,Ot,Et,Nt,jt,Mt]),_=new Uint32Array(4),v=new Int32Array(4),y={textures:[],min:[],max:[],resolution:[]},b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=Ln;let j=0,M=0,N=null,P=-1,F=null,I=new Mr,L=new Mr,ee=null,te=new vi(0),ne=0,R=t.width,z=t.height,B=1,re=null,ie=null,ae=new Mr(0,0,R,z),oe=new Mr(0,0,R,z),se=!1,ce=new Ka,le=new Ja,ue=!1,de=!1,fe=new Lr,pe=new q,me=new Mr,he={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ge=!1;function _e(){return N===null?B:1}let V=n;function ve(e,n){return t.getContext(e,n)}let ye,be,H,xe,U,W,Se,Ce,we,Te,Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r187`),t.addEventListener(`webglcontextlost`,Ve,!1),t.addEventListener(`webglcontextrestored`,He,!1),t.addEventListener(`webglcontextcreationerror`,Ue,!1),V===null){let t=`webgl2`;if(V=ve(t,e),V===null)throw ve(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}ze()}catch(e){throw t.removeEventListener(`webglcontextlost`,Ve,!1),t.removeEventListener(`webglcontextrestored`,He,!1),t.removeEventListener(`webglcontextcreationerror`,Ue,!1),K(`WebGLRenderer: `+e.message),e}function ze(){ye=new rc(V),ye.init(),Ie=new Tu(V,ye),be=new Ls(V,ye,e,Ie),H=new Cu(V,ye),be.reversedDepthBuffer&&d&&H.buffers.depth.setReversed(!0),O=V.createFramebuffer(),k=V.createFramebuffer(),A=V.createFramebuffer(),xe=new oc(V),U=new ru,W=new wu(V,ye,H,U,be,Ie,xe),Se=new nc(T),Ce=new ks(V),Le=new Fs(V,Ce),we=new ic(V,Ce,xe,Le),Te=new cc(V,we,Ce,Le,xe),Ne=new sc(V,be,W),Ae=new Rs(U),Ee=new nu(T,Se,ye,be,Le,Ae),De=new Mu(T,U),Oe=new su,ke=new mu(ye),Me=new Ps(T,Se,H,Te,p,s),je=new Su(T,Te,be),Re=new Nu(V,xe,be,H),Pe=new Is(V,ye,xe),Fe=new ac(V,ye,xe),xe.programs=Ee.programs,T.capabilities=be,T.extensions=ye,T.properties=U,T.renderLists=Oe,T.shadowMap=je,T.state=H,T.info=xe}m!==1009&&(w=new uc(m,t.width,t.height,o,r,i));let Be=new ku(T,V);this.xr=Be,this.getContext=function(){return V},this.getContextAttributes=function(){return V.getContextAttributes()},this.forceContextLoss=function(){let e=ye.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=ye.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return B},this.setPixelRatio=function(e){e!==void 0&&(B=e,this.setSize(R,z,!1))},this.getSize=function(e){return e.set(R,z)},this.setSize=function(e,n,r=!0){Be.isPresenting?G(`WebGLRenderer: Can't change size while VR device is presenting.`):(R=e,z=n,t.width=Math.floor(e*B),t.height=Math.floor(n*B),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(R*B,z*B).floor()},this.setDrawingBufferSize=function(e,n,r){R=e,z=n,B=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)K(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){G(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(I)},this.getViewport=function(e){return e.copy(ae)},this.setViewport=function(e,t,n,r){e.isVector4?ae.set(e.x,e.y,e.z,e.w):ae.set(e,t,n,r),H.viewport(I.copy(ae).multiplyScalar(_e()).round())},this.getScissor=function(e){return e.copy(oe)},this.setScissor=function(e,t,n,r){e.isVector4?oe.set(e.x,e.y,e.z,e.w):oe.set(e,t,n,r),H.scissor(L.copy(oe).multiplyScalar(_e()).round())},this.getScissorTest=function(){return se},this.setScissorTest=function(e){H.setScissorTest(se=e)},this.setOpaqueSort=function(e){re=e},this.setTransparentSort=function(e){ie=e},this.getClearColor=function(e){return e.copy(Me.getClearColor())},this.setClearColor=function(){Me.setClearColor(...arguments)},this.getClearAlpha=function(){return Me.getClearAlpha()},this.setClearAlpha=function(){Me.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(N!==null){let t=N.texture.format;e=h.has(t)}if(e){let e=N.texture.type,t=g.has(e),n=Me.getClearColor(),r=Me.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,V.clearBufferuiv(V.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,V.clearBufferiv(V.COLOR,0,v))}else r|=V.COLOR_BUFFER_BIT}t&&(r|=V.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=V.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&V.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,Ve,!1),t.removeEventListener(`webglcontextrestored`,He,!1),t.removeEventListener(`webglcontextcreationerror`,Ue,!1),Me.dispose(),Oe.dispose(),ke.dispose(),W.dispose(),U.dispose(),Se.dispose(),Te.dispose(),we.dispose(),Le.dispose(),Re.dispose(),Ee.dispose(),Be.dispose(),Be.removeEventListener(`sessionstart`,Xe),Be.removeEventListener(`sessionend`,Ze),Qe.stop()};function Ve(e){e.preventDefault(),Xn(`WebGLRenderer: Context Lost.`),E=!0}function He(){Xn(`WebGLRenderer: Context Restored.`),E=!1;let e=xe.autoReset,t=je.enabled,n=je.autoUpdate,r=je.needsUpdate,i=je.type;ze(),xe.autoReset=e,je.enabled=t,je.autoUpdate=n,je.needsUpdate=r,je.type=i}function Ue(e){K(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function We(e){let t=e.target;t.removeEventListener(`dispose`,We),Ge(t)}function Ge(e){Ke(e),U.remove(e)}function Ke(e){let t=U.get(e).programs;t!==void 0&&(t.forEach(function(e){Ee.releaseProgram(e)}),e.isShaderMaterial&&Ee.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=he);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=lt(e,t,n,r,i);H.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=we.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Le.setup(i,r,s,n,c);let h,g=Pe;if(c!==null&&(h=Ce.get(c),g=Fe,g.setIndex(h)),i.isMesh)r.wireframe===!0?(H.setLineWidth(r.wireframeLinewidth*_e()),g.setMode(V.LINES)):g.setMode(V.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),H.setLineWidth(e*_e()),i.isLineSegments?g.setMode(V.LINES):i.isLineLoop?g.setMode(V.LINE_LOOP):g.setMode(V.LINE_STRIP)}else i.isPoints?g.setMode(V.POINTS):i.isSprite&&g.setMode(V.TRIANGLES);if(i.isBatchedMesh){if(ye.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?Ce.get(c).bytesPerElement:1,o=U.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(V,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function qe(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),ue===!0&&Ae.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,at(e,t,r),e.side=0,e.needsUpdate=!0,at(e,t,r),e.side=2):at(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=ke.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),de=this.localClippingEnabled,ue=Ae.init(this.clippingPlanes,de),ue===!0&&Ae.setGlobalState(this.clippingPlanes,t),D!==null&&je.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];qe(o,n,t,e),r.add(o)}else qe(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=U.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}ye.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let Je=null;function Ye(e){Je&&Je(e)}function Xe(){Qe.stop()}function Ze(){Qe.start()}let Qe=new Os;Qe.setAnimationLoop(Ye),typeof self<`u`&&Qe.setContext(self),this.setAnimationLoop=function(e){Je=e,Be.setAnimationLoop(e),e===null?Qe.stop():Qe.start()},Be.addEventListener(`sessionstart`,Xe),Be.addEventListener(`sessionend`,Ze),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){K(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=Be.enabled===!0&&Be.isPresenting===!0,r=w!==null&&(N===null||n)&&w.begin(T,N);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),Be.enabled===!0&&Be.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Be.cameraAutoUpdate===!0&&Be.updateCamera(t),t=Be.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,N),x=ke.get(e,C.length),x.init(t),x.state.textureUnits=W.getTextureUnits(),C.push(x),fe.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),t.isArrayCamera?le.setFromArrayCamera(t):ce.setFromProjectionMatrix(fe,Wn,t.reversedDepth),de=this.localClippingEnabled,ue=Ae.init(this.clippingPlanes,de),b=Oe.get(e,S.length),b.init(),S.push(b),this.info.render.frame++,Be.enabled===!0&&Be.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&$e(e,t,-1/0,T.sortObjects)}$e(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(re,ie),ge=Be.enabled===!1||Be.isPresenting===!1||Be.hasDepthSensing()===!1,ge&&Me.addToRenderList(b,e),this.info.autoReset===!0&&this.info.reset(),ue===!0&&Ae.beginShadows();let i=x.state.shadowsArray;if(je.render(i,e,t),ue===!0&&Ae.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];tt(n,r,e,a)}ge&&Me.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];et(b,e,n,n.viewport)}}else r.length>0&&tt(n,r,e,t),ge&&Me.render(e),et(b,e,t)}N!==null&&M===0&&(W.updateMultisampleRenderTarget(N),W.updateRenderTargetMipmap(N)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Le.resetDefaultState(),P=-1,F=null,C.pop(),C.length>0?(x=C[C.length-1],W.setTextureUnits(x.state.textureUnits),ue===!0&&Ae.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function $e(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){let i=t.isArrayCamera?le:ce;if(!e.frustumCulled||e.intersectsFrustum(i)){r&&me.setFromMatrixPosition(e.matrixWorld).applyMatrix4(fe);let i=Te.update(e),a=e.material;a.visible&&b.push(e,i,a,n,me.z,null,t)}}else if(e.isMesh||e.isLine||e.isPoints){let i=t.isArrayCamera?le:ce;if(!e.frustumCulled||e.intersectsFrustum(i)){let i=Te.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),me.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),me.copy(e.boundingSphere.center)),me.applyMatrix4(e.matrixWorld).applyMatrix4(fe)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,me.z,s,t)}}else a.visible&&b.push(e,i,a,n,me.z,null,t)}}}let i=e.children;for(let e=0,a=i.length;e<a;e++)$e(i[e],t,n,r)}function et(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),ue===!0&&Ae.setGlobalState(T.clippingPlanes,n),r&&H.viewport(I.copy(r)),i.length>0&&nt(i,t,n),a.length>0&&nt(a,t,n),o.length>0&&nt(o,t,n),H.buffers.depth.setTest(!0),H.buffers.depth.setMask(!0),H.buffers.color.setMask(!0),H.setPolygonOffset(!1)}function tt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=ye.has(`EXT_color_buffer_half_float`)||ye.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new Pr(1,1,{generateMipmaps:!0,type:e?At:Ct,minFilter:St,samples:Math.max(4,be.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:xr.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||I;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(te),ne=T.getClearAlpha(),ne<1&&T.setClearColor(16777215,.5),T.clear(),ge&&Me.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),ue===!0&&Ae.setGlobalState(T.clippingPlanes,r),nt(e,n,r),W.updateMultisampleRenderTarget(a),W.updateRenderTargetMipmap(a),ye.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,rt(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(W.updateMultisampleRenderTarget(a),W.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(te,ne),d!==void 0&&(r.viewport=d),T.toneMapping=u}function nt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&rt(o,t,n,s,l,c)}}function rt(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function it(e){let t=0;for(let n of e)n.texture!==null&&t++;return t}function at(e,t,n){t.isScene!==!0&&(t=he);let r=U.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=Ee.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=Ee.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Se.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,We),l=new Map,r.programs=l,r.programVariants=new Map);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return ct(e,s),d}else s.uniforms=Ee.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=Ee.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ae.uniform),ct(e,s),r.needsLights=dt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.numLightProbeGrids=it(x.state.lightProbeGridArray),r.currentProgram=d,r.uniformsList=null,d}function ot(e,t,n,r,i){let a=U.get(e),o=a.currentProgram.id+`,`+r+`,`+i,s=a.programVariants.get(o);return s===void 0?(s=at(e,t,n),a.programVariants.set(o,s)):(a.currentProgram=s,a.uniformsList=null,a.outputColorSpace=r,a.toneMapping=i),s}function st(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=yl.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function ct(e,t){let n=U.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function lt(e,t,n,r,i){t.isScene!==!0&&(t=he),W.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=N===null?T.outputColorSpace:N.isXRRenderTarget===!0?N.texture.colorSpace:xr.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Se.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(N===null||N.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=U.get(r),b=x.state.lights;if(ue===!0&&(de===!0||e!==F)){let t=e===F&&r.id===P;Ae.setState(r,e,t)}let S=!1,C=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==b.state.version||i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?S=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ae.numPlanes||v.numIntersection!==Ae.numIntersection)?S=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.morphTargetsCount===_&&v.numLightProbeGrids===it(x.state.lightProbeGridArray)?(v.outputColorSpace!==s||v.toneMapping!==h)&&(C=!0):S=!0:S=!0:(S=!0,v.__version=r.version);let w=v.currentProgram;(S===!0||C===!0)&&(w=C===!0?ot(r,t,i,s,h):at(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,w,v));let E=!1,O=!1,k=!1,A=w.getUniforms(),j=v.uniforms;if(H.useProgram(w.program)&&(E=!0,O=!0,k=!0),r.id!==P&&(P=r.id,O=!0),E||F!==e){H.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),A.setValue(V,`projectionMatrix`,e.projectionMatrix),A.setValue(V,`viewMatrix`,e.matrixWorldInverse);let t=A.map.cameraPosition;t!==void 0&&t.setValue(V,pe.setFromMatrixPosition(e.matrixWorld)),be.logarithmicDepthBuffer&&A.setValue(V,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&A.setValue(V,`isOrthographic`,e.isOrthographicCamera===!0),F!==e&&(F=e,O=!0,k=!0)}if(v.needsLights&&(b.state.sunShadowMap.length>0&&A.setValue(V,`sunShadowMap`,b.state.sunShadowMap,W),b.state.directionalShadowMap.length>0&&A.setValue(V,`directionalShadowMap`,b.state.directionalShadowMap,W),b.state.spotShadowMap.length>0&&A.setValue(V,`spotShadowMap`,b.state.spotShadowMap,W),b.state.pointShadowMap.length>0&&A.setValue(V,`pointShadowMap`,b.state.pointShadowMap,W)),i.isSkinnedMesh){A.setOptional(V,i,`bindMatrix`),A.setOptional(V,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),A.setValue(V,`boneTexture`,e.boneTexture,W))}i.isBatchedMesh&&(A.setOptional(V,i,`batchingTexture`),A.setValue(V,`batchingTexture`,i._matricesTexture,W),A.setOptional(V,i,`batchingIdTexture`),A.setValue(V,`batchingIdTexture`,i._indirectTexture,W),A.setOptional(V,i,`batchingColorTexture`),i._colorsTexture!==null&&A.setValue(V,`batchingColorTexture`,i._colorsTexture,W));let M=n.morphAttributes;if((M.position!==void 0||M.normal!==void 0||M.color!==void 0)&&Ne.update(i,n,w),(O||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,A.setValue(V,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(j.envMapIntensity.value=t.environmentIntensity),j.dfgLUT!==void 0&&(j.dfgLUT.value=Iu()),O){if(A.setValue(V,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&ut(j,k),a&&r.fog===!0&&De.refreshFogUniforms(j,a),De.refreshMaterialUniforms(j,r,B,z,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.numLightProbeGrids>0){let e=y,t=0;for(let n of x.state.lightProbeGridArray)n.texture!==null&&(e.textures[t]=n.texture,e.min[t]=n.boundingBox.min,e.max[t]=n.boundingBox.max,e.resolution[t]=n.resolution,t++);for(let n in e)e[n].length=t;j.probesSH.value=e.textures,j.probesMin.value=e.min,j.probesMax.value=e.max,j.probesResolution.value=e.resolution}yl.upload(V,st(v),j,W)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(yl.upload(V,st(v),j,W),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&A.setValue(V,`center`,i.center),A.setValue(V,`modelViewMatrix`,i.modelViewMatrix),A.setValue(V,`normalMatrix`,i.normalMatrix),A.setValue(V,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];Re.update(n,w),Re.bind(n,w)}}return w}function ut(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function dt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return M},this.getRenderTarget=function(){return N},this.setRenderTargetTextures=function(e,t,n){let r=U.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),U.get(e.texture).__webglTexture=t,U.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=U.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){N=e,j=t,M=n;let r=null,i=!1,a=!1;if(e){let o=U.get(e);if(o.__useDefaultFramebuffer!==void 0){H.bindFramebuffer(V.FRAMEBUFFER,o.__webglFramebuffer),I.copy(e.viewport),L.copy(e.scissor),ee=e.scissorTest,H.viewport(I),H.scissor(L),H.setScissorTest(ee),P=-1;return}if(o.__webglFramebuffer===void 0)W.setupRenderTarget(e);else if(o.__hasExternalTextures)W.rebindTextures(e,U.get(e.texture).__webglTexture,U.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&U.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);W.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=U.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&W.useMultisampledRTT(e)===!1?U.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,I.copy(e.viewport),L.copy(e.scissor),ee=e.scissorTest}else I.copy(ae).multiplyScalar(B).floor(),L.copy(oe).multiplyScalar(B).floor(),ee=se;if(n!==0&&(r=O),H.bindFramebuffer(V.FRAMEBUFFER,r)&&H.drawBuffers(e,r),H.viewport(I),H.scissor(L),H.setScissorTest(ee),i){let r=U.get(e.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=U.get(e.textures[t]);V.framebufferTextureLayer(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=U.get(e.texture);V.framebufferTexture2D(V.FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,t.__webglTexture,n)}P=-1};function ft(e){let t=U.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=be.textureFormatReadable(e.format),t.__typeReadable=be.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){K(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=U.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){H.bindFramebuffer(V.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+s);let u=ft(o);if(u.__formatReadable===!1){K(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){K(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&V.readPixels(t,n,r,i,Ie.convert(c),Ie.convert(l),a)}finally{let e=N===null?null:U.get(N).__webglFramebuffer;H.bindFramebuffer(V.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=U.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){H.bindFramebuffer(V.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&V.readBuffer(V.COLOR_ATTACHMENT0+s);let d=ft(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=V.createBuffer();V.bindBuffer(V.PIXEL_PACK_BUFFER,f),V.bufferData(V.PIXEL_PACK_BUFFER,a.byteLength,V.STREAM_READ),V.readPixels(t,n,r,i,Ie.convert(l),Ie.convert(u),0),V.bindBuffer(V.PIXEL_PACK_BUFFER,null);let p=N===null?null:U.get(N).__webglFramebuffer;H.bindFramebuffer(V.FRAMEBUFFER,p);let m=V.fenceSync(V.SYNC_GPU_COMMANDS_COMPLETE,0);return V.flush(),await $n(V,m,4),V.bindBuffer(V.PIXEL_PACK_BUFFER,f),V.getBufferSubData(V.PIXEL_PACK_BUFFER,0,a),V.bindBuffer(V.PIXEL_PACK_BUFFER,null),V.deleteBuffer(f),V.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;W.setTexture2D(e,0),V.copyTexSubImage2D(V.TEXTURE_2D,n,0,0,o,s,i,a),H.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Ie.convert(t.format),_=Ie.convert(t.type),v;t.isData3DTexture?(W.setTexture3D(t,0),v=V.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(W.setTexture2DArray(t,0),v=V.TEXTURE_2D_ARRAY):(W.setTexture2D(t,0),v=V.TEXTURE_2D),H.activeTexture(V.TEXTURE0),H.pixelStorei(V.UNPACK_FLIP_Y_WEBGL,t.flipY),H.pixelStorei(V.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),H.pixelStorei(V.UNPACK_ALIGNMENT,t.unpackAlignment);let y=H.getParameter(V.UNPACK_ROW_LENGTH),b=H.getParameter(V.UNPACK_IMAGE_HEIGHT),x=H.getParameter(V.UNPACK_SKIP_PIXELS),S=H.getParameter(V.UNPACK_SKIP_ROWS),C=H.getParameter(V.UNPACK_SKIP_IMAGES);H.pixelStorei(V.UNPACK_ROW_LENGTH,h.width),H.pixelStorei(V.UNPACK_IMAGE_HEIGHT,h.height),H.pixelStorei(V.UNPACK_SKIP_PIXELS,l),H.pixelStorei(V.UNPACK_SKIP_ROWS,u),H.pixelStorei(V.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=U.get(e),r=U.get(t),h=U.get(n.__renderTarget),g=U.get(r.__renderTarget);H.bindFramebuffer(V.READ_FRAMEBUFFER,h.__webglFramebuffer),H.bindFramebuffer(V.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,U.get(e).__webglTexture,i,d+n),V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,U.get(t).__webglTexture,a,m+n)),V.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,V.DEPTH_BUFFER_BIT,V.NEAREST);H.bindFramebuffer(V.READ_FRAMEBUFFER,null),H.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||U.has(e)){let n=U.get(e),r=U.get(t);H.bindFramebuffer(V.READ_FRAMEBUFFER,k),H.bindFramebuffer(V.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?V.framebufferTextureLayer(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):V.framebufferTexture2D(V.READ_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,n.__webglTexture,i),T?V.framebufferTextureLayer(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):V.framebufferTexture2D(V.DRAW_FRAMEBUFFER,V.COLOR_ATTACHMENT0,V.TEXTURE_2D,r.__webglTexture,a),i===0?T?V.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):V.copyTexSubImage2D(v,a,f,p,l,u,o,s):V.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,V.COLOR_BUFFER_BIT,V.NEAREST);H.bindFramebuffer(V.READ_FRAMEBUFFER,null),H.bindFramebuffer(V.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?V.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?V.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):V.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?V.texSubImage2D(V.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?V.compressedTexSubImage2D(V.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):V.texSubImage2D(V.TEXTURE_2D,a,f,p,o,s,g,_,h);H.pixelStorei(V.UNPACK_ROW_LENGTH,y),H.pixelStorei(V.UNPACK_IMAGE_HEIGHT,b),H.pixelStorei(V.UNPACK_SKIP_PIXELS,x),H.pixelStorei(V.UNPACK_SKIP_ROWS,S),H.pixelStorei(V.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps===!0&&t.mipmapsAutoUpdate===!0&&V.generateMipmap(v),H.unbindTexture()},this.initRenderTarget=function(e){U.get(e).__webglFramebuffer===void 0&&W.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?W.setTextureCube(e,0):e.isData3DTexture?W.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?W.setTexture2DArray(e,0):W.setTexture2D(e,0),H.unbindTexture()},this.resetState=function(){j=0,M=0,N=null,H.reset(),Le.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return Wn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=xr._getDrawingBufferColorSpace(e),t.unpackColorSpace=xr._getUnpackColorSpace()}};function Ru(e,t,n){return n<=t?+(e>=n):Math.min(1,Math.max(0,(e-t)/(n-t)))}var zu=(e,t,n)=>Math.min(n,Math.max(t,e)),Z=(e,t,n)=>e+(t-e)*n;function Bu(e,t,n,r){let i=3*e,a=3*(n-e)-i,o=1-i-a,s=3*t,c=3*(r-t)-s,l=1-s-c,u=e=>((o*e+a)*e+i)*e,d=e=>((l*e+c)*e+s)*e,f=e=>(3*o*e+2*a)*e+i;return e=>{if(e<=0)return 0;if(e>=1)return 1;let t=e;for(let n=0;n<6;n++){let n=u(t)-e,r=f(t);if(Math.abs(n)<1e-5)return d(t);if(Math.abs(r)<1e-6)break;t-=n/r}let n=0,r=1;t=e;for(let i=0;i<24;i++){let i=u(t);if(Math.abs(i-e)<1e-5)break;i<e?n=t:r=t,t=(n+r)/2}return d(t)}}var Vu=Bu(.22,1,.36,1),Hu=Bu(.34,1.56,.64,1),Uu=e=>e<.5?4*e*e*e:1-(-2*e+2)**3/2,Wu=e=>-(Math.cos(Math.PI*e)-1)/2;function Gu(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return(t>>>0)%1e5/1e5}function Ku(){let e=performance.now(),t=null;return{now:()=>t??performance.now()-e,pause(){t===null&&(t=performance.now()-e)},resume(){t!==null&&(e=performance.now()-t,t=null)},set(e){t=e},get paused(){return t!==null}}}var qu=1600,Ju=45,Yu=Math.PI/180,Xu=class{camera=new ss(Ju,1,.5,4e3);cur={tx:0,ty:0,tz:0,dist:300,az:0,el:12*Yu};goal={...this.cur};fly=null;width=1;height=1;insets={left:0,right:0,top:0,bottom:0};lastInput=0;driftGain=0;driftAllowed=!0;dragging=!1;liftY=0;setSize(e,t){this.width=Math.max(1,e),this.height=Math.max(1,t),this.applyProjection()}setInsets(e){this.insets=e,this.applyProjection()}freeArea(){return{w:Math.max(80,this.width-this.insets.left-this.insets.right),h:Math.max(80,this.height-this.insets.top-this.insets.bottom)}}applyProjection(){let e=this.camera;e.aspect=this.width/this.height;let t=(this.insets.left-this.insets.right)/2,n=(this.insets.top-this.insets.bottom)/2;t!==0||n!==0?e.setViewOffset(this.width,this.height,-t,-n,this.width,this.height):e.clearViewOffset(),e.updateProjectionMatrix()}pxScale(){return this.height/2/Math.tan(Ju*Yu/2)}fitDistance(e){let{w:t,h:n}=this.freeArea(),r=Ju*Yu*(n/this.height),i=2*Math.atan(Math.tan(Ju*Yu/2)*(t/this.height));return zu(e/Math.sin(Math.min(i,r)/2),25,qu)}pose(){return{...this.cur}}get distance(){return this.cur.dist}get busy(){return this.fly!==null}snap(e){this.cancelFly(),Object.assign(this.cur,e),Object.assign(this.goal,e)}cancelFly(){if(this.fly){let e=this.fly.resolve;this.fly=null,e()}}flyTo(e,t,n,r=.15){this.cancelFly();let i={...this.goal,...e};return n<=0?(this.snap(i),Promise.resolve()):new Promise(e=>{let a={...this.cur};for(;i.az-a.az>Math.PI;)i.az-=Math.PI*2;for(;i.az-a.az<-Math.PI;)i.az+=Math.PI*2;let o=Math.hypot(i.tx-a.tx,i.ty-a.ty,i.tz-a.tz)+Math.abs(i.dist-a.dist);this.fly={from:a,to:i,t0:t,dur:n,lift:r*o,resolve:e}})}input(e){this.lastInput=e}beginDrag(){this.dragging=!0}endDrag(){this.dragging=!1}orbitBy(e,t,n){this.input(n),this.cancelFly(),this.goal.az-=e*.005,this.goal.el=zu(this.goal.el+t*.005,-1.35,1.35)}panBy(e,t,n){this.input(n),this.cancelFly();let r=this.goal.dist/this.pxScale()*1,i=new q,a=new q;this.camera.matrixWorld.extractBasis(i,a,new q),this.goal.tx+=(-i.x*e+a.x*t)*r,this.goal.ty+=(-i.y*e+a.y*t)*r,this.goal.tz+=(-i.z*e+a.z*t)*r}dolly(e,t){this.input(t),this.cancelFly(),this.goal.dist=zu(this.goal.dist*.92**e,25,qu)}update(e,t,n){if(this.fly){let t=this.fly,n=Uu(Ru(e,t.t0,t.t0+t.dur));for(let e of[`tx`,`ty`,`tz`,`dist`,`az`,`el`])this.cur[e]=Z(t.from[e],t.to[e],n);this.liftY=t.lift*Math.sin(Math.PI*n),Object.assign(this.goal,this.cur),n>=1&&(this.liftY=0,Object.assign(this.cur,t.to),Object.assign(this.goal,t.to),this.fly=null,t.resolve())}else{let r=n&&this.driftAllowed&&!this.dragging&&e-this.lastInput>8e3?1:0,i=r>this.driftGain?t/1200:t/300;this.driftGain=r>this.driftGain?Math.min(r,this.driftGain+i):Math.max(r,this.driftGain-i),this.driftGain>0&&(this.goal.az+=.6*Yu/1e3*t*this.driftGain);let a=1-.92**(Math.max(0,t)/(1e3/60));for(let e of[`tx`,`ty`,`tz`,`dist`,`az`,`el`])this.cur[e]=Z(this.cur[e],this.goal[e],a)}let r=this.cur,i=Math.cos(r.el);this.camera.position.set(r.tx+Math.sin(r.az)*i*r.dist,r.ty+Math.sin(r.el)*r.dist+this.liftY,r.tz+Math.cos(r.az)*i*r.dist),this.camera.lookAt(r.tx,r.ty,r.tz),this.camera.updateMatrixWorld()}get drifting(){return this.driftGain>.001}},Zu={transparent:!0,depthTest:!1,depthWrite:!1,blending:2};function Qu(e,t){if(e.length>=t)return e;let n=Math.max(64,e.length);for(;n<t;)n*=2;return new Float32Array(n)}var $u={concept:0,variable:1,file:2,pathway:3,note:4,road:5},ed={start:0,read:1,assign:2,if:3,while:4,end:5},td=`
attribute float aSize;   // world radius r
attribute vec3 aCore;
attribute vec3 aHalo;
attribute vec4 aMisc;    // x brightness, y scale, z halo scale, w selection ring
attribute vec2 aKind;    // x kind code, y op code
uniform float uPxScale;  // (viewport h / 2) / tan(vfov / 2), CSS px
uniform float uDpr;
varying vec3 vCore;
varying vec3 vHalo;
varying float vR;
varying float vSprite;
varying vec4 vMisc;
varying vec2 vKind;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float depth = max(0.1, -mv.z);
  float kindV = floor(aKind.x + 0.5);
  float minR = kindV == 3.0 ? 4.5 : 3.0;
  float r = clamp(aSize * uPxScale / depth, minR, 18.0) * aMisc.y;
  float haloK = kindV == 2.0 ? 0.6 : 1.0;
  // The halo is visually spent by ~2.7r; a tighter sprite saves fill rate at 500 points.
  float ext = max(max(r * 2.7, 11.0) * aMisc.z * haloK, aMisc.w > 0.0 ? max(r * 2.4, r + 7.0) + 2.0 : 0.0);
  vSprite = max(ext, r * 2.4) + 2.0;
  vR = r;
  vCore = aCore;
  vHalo = aHalo;
  vMisc = aMisc;
  vKind = aKind;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = vSprite * 2.0 * uDpr;
  if (aMisc.x <= 0.001) gl_PointSize = 0.0;
}`,nd=`
uniform float uDpr;
varying vec3 vCore;
varying vec3 vHalo;
varying float vR;
varying float vSprite;
varying vec4 vMisc;
varying vec2 vKind;
float fill(float sd) { return 1.0 - smoothstep(-0.6, 0.6, sd); }
float stroke(float sd, float w) { return 1.0 - smoothstep(w * 0.5 - 0.6, w * 0.5 + 0.6, abs(sd)); }
float sdTri(vec2 p, float s) {
  // equilateral triangle pointing +x, circumradius s
  p = vec2(-p.y, p.x);
  const float k = 1.7320508;
  p.x = abs(p.x) - s * 0.866;
  p.y = p.y + s * 0.5;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * s * 0.866, 0.0);
  return -length(p) * sign(p.y);
}
void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0 * vSprite;
  p.y = -p.y;
  float d = length(p);
  float R = vR;
  // Codes arrive as varyings: round before comparing (interpolation error broke glyphs, F-021).
  float kind = floor(vKind.x + 0.5);
  float core = 0.0;
  float glyph = 0.0;
  float haloK = 1.0;
  vec3 coreCol = vCore;
  if (kind == 1.0) {
    // variable: diamond core 0.9r + 1 px ring at 1.8r
    core = fill((abs(p.x) + abs(p.y)) * 0.7071 - 0.9 * R * 0.7071 * 1.25);
    core = max(core, stroke(d - 1.8 * R, 1.0) * 0.8);
  } else if (kind == 2.0) {
    // file: 1.5 px square outline (side 2r) with a dog-ear notch, centre dot
    float box = max(abs(p.x), abs(p.y)) - R;
    float notch = (p.x + p.y) - 1.25 * R;
    float outline = stroke(box, 1.5) * step(notch, 0.0);
    float ear = stroke(notch * 0.7071, 1.5) * step(box, 0.6);
    core = max(max(outline, ear), fill(d - 1.3));
    haloK = 0.6;
  } else if (kind == 3.0) {
    // pathway: glyph inside a ring
    float ringR = R * 1.5;
    core = stroke(d - ringR, 1.4);
    float op = floor(vKind.y + 0.5);
    float g = R * 0.95;
    if (op == 0.0) glyph = fill(sdTri(p + vec2(g * 0.12, 0.0), g * 0.72));
    else if (op == 1.0) glyph = max(stroke(d - g * 0.62, 1.3), fill(d - g * 0.24));
    else if (op == 2.0) glyph = fill(max(abs(abs(p.y) - g * 0.3) - 0.9, abs(p.x) - g * 0.62));
    else if (op == 3.0) glyph = stroke((abs(p.x) + abs(p.y)) * 0.7071 - g * 0.62, 1.4);
    else if (op == 4.0) {
      float a = atan(p.y, p.x);
      float arc = stroke(d - g * 0.62, 1.4) * step(0.52, abs(a - 1.5708) < 3.1416 ? abs(a - 1.5708) : 6.2832 - abs(a - 1.5708));
      vec2 tip = vec2(cos(2.1), sin(2.1)) * g * 0.62;
      glyph = max(arc, fill(sdTri((p - tip) * mat2(cos(0.53), -sin(0.53), sin(0.53), cos(0.53)), g * 0.3)));
    } else glyph = max(stroke(d - g * 0.66, 1.3), fill(d - g * 0.32));
    core = max(core, glyph);
    haloK = 0.7;
  } else {
    // Small stars stay crisp; close-up cores get a hot 0.4r centre with a soft falloff (F-027).
    core = fill(d - R);
    if (R > 6.0) {
      float t = max(0.0, d - 0.4 * R) / (0.35 * R);
      float soft = max(fill(d - 0.4 * R), exp(-t * t)) * step(d, R + 1.0);
      core = mix(core, soft, smoothstep(6.0, 12.0, R));
    }
  }
  // Gaussian-shaped falloff without exp/pow: (1 - x²)³ over the halo extent.
  float hx = clamp(d / (max(R * 2.7, 11.0) * vMisc.z * haloK), 0.0, 1.0); // ≥11 px so small stars still carry the lens
  float hq = 1.0 - hx * hx;
  float halo = hq * hq * hq * (kind == 3.0 ? 0.14 : 0.72); // strong enough that the lens tint reads at overview (F-019)
  float ring = vMisc.w > 0.0 ? stroke(d - max(R * 2.4, R + 7.0), 1.5) * vMisc.w : 0.0;
  float b = vMisc.x;
  vec3 col = coreCol * core * b + vHalo * halo * min(b, 1.4) + vec3(0.96, 0.97, 1.0) * ring;
  float a = clamp(max(max(core, halo), ring), 0.0, 1.0);
  if (a < 0.003) discard;
  gl_FragColor = vec4(col, 1.0);
}`,rd=class{points;geo=new ma;pos=new Float32Array;size=new Float32Array;core=new Float32Array;halo=new Float32Array;misc=new Float32Array;kind=new Float32Array;material;count=0;constructor(){this.material=new Ao({vertexShader:td,fragmentShader:nd,uniforms:{uPxScale:{value:500},uDpr:{value:1}},...Zu}),this.points=new mo(this.geo,this.material),this.points.frustumCulled=!1,this.ensure(64)}ensure(e){if(this.pos.length>=e*3)return;this.pos=Qu(this.pos,e*3);let t=this.pos.length/3;this.size=new Float32Array(t),this.core=new Float32Array(t*3),this.halo=new Float32Array(t*3),this.misc=new Float32Array(t*4),this.kind=new Float32Array(t*2);let n=(e,t,n)=>{let r=new $i(t,n);r.setUsage(Un),this.geo.setAttribute(e,r)};n(`position`,this.pos,3),n(`aSize`,this.size,1),n(`aCore`,this.core,3),n(`aHalo`,this.halo,3),n(`aMisc`,this.misc,4),n(`aKind`,this.kind,2)}begin(e){this.ensure(e),this.count=0}push(e,t,n,r,i,a,o,s,c,l,u,d){let f=this.count++;this.pos[f*3]=e,this.pos[f*3+1]=t,this.pos[f*3+2]=n,this.size[f]=r,this.core.set(i,f*3),this.halo.set(a,f*3),this.misc[f*4]=o,this.misc[f*4+1]=s,this.misc[f*4+2]=c,this.misc[f*4+3]=l,this.kind[f*2]=u,this.kind[f*2+1]=d}end(){for(let e of[`position`,`aSize`,`aCore`,`aHalo`,`aMisc`,`aKind`]){let t=this.geo.getAttribute(e);t.needsUpdate=!0}this.geo.setDrawRange(0,this.count)}dispose(){this.geo.dispose(),this.material.dispose()}},id={glow:0,ring:1,bead:2,spark:3},ad=`
attribute vec4 aCol;   // rgb, alpha
attribute vec2 aShape; // x radius px, y shape code
uniform float uDpr;
varying vec4 vCol;
varying float vR;
varying float vShape;
varying float vSprite;
void main() {
  vCol = aCol;
  vR = aShape.x;
  vShape = floor(aShape.y + 0.5);
  vSprite = vShape == 0.0 || vShape == 3.0 ? vR * 3.0 + 2.0 : vR + 2.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aCol.a <= 0.001 ? 0.0 : vSprite * 2.0 * uDpr;
}`,od=`
varying vec4 vCol;
varying float vR;
varying float vShape;
varying float vSprite;
void main() {
  vec2 p = (gl_PointCoord - 0.5) * 2.0 * vSprite;
  float d = length(p);
  float a = 0.0;
  if (vShape == 1.0) a = 1.0 - smoothstep(0.15, 1.1, abs(d - vR + 1.0));
  else if (vShape == 2.0) a = 1.0 - smoothstep(vR - 0.8, vR + 0.6, d);
  else {
    float core = 1.0 - smoothstep(vR - 0.7, vR + 0.7, d);
    float halo = exp(-pow(d / (vR * (vShape == 3.0 ? 1.8 : 1.3)), 2.0)) * 0.55;
    a = max(core, halo);
  }
  a *= vCol.a;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vCol.rgb * a, 1.0);
}`,sd=class{points;geo=new ma;pos=new Float32Array;col=new Float32Array;shape=new Float32Array;material;count=0;constructor(){this.material=new Ao({vertexShader:ad,fragmentShader:od,uniforms:{uDpr:{value:1}},...Zu}),this.points=new mo(this.geo,this.material),this.points.frustumCulled=!1,this.ensure(64)}ensure(e){if(this.pos.length>=e*3)return;let[t,n,r]=[this.pos,this.col,this.shape];this.pos=Qu(this.pos,e*3);let i=this.pos.length/3;this.col=new Float32Array(i*4),this.shape=new Float32Array(i*2),this.pos.set(t),this.col.set(n),this.shape.set(r);for(let[e,t,n]of[[`position`,this.pos,3],[`aCol`,this.col,4],[`aShape`,this.shape,2]]){let r=new $i(t,n);r.setUsage(Un),this.geo.setAttribute(e,r)}}begin(){this.count=0}push(e,t,n,r,i,a,o){if(a<=.002)return;this.ensure(this.count+1);let s=this.count++;this.pos[s*3]=e,this.pos[s*3+1]=t,this.pos[s*3+2]=n,this.col[s*4]=i[0]??1,this.col[s*4+1]=i[1]??1,this.col[s*4+2]=i[2]??1,this.col[s*4+3]=a,this.shape[s*2]=r,this.shape[s*2+1]=o}end(){for(let e of[`position`,`aCol`,`aShape`])this.geo.getAttribute(e).needsUpdate=!0;this.geo.setDrawRange(0,this.count)}dispose(){this.geo.dispose(),this.material.dispose()}},cd={solid:0,dashed:1,dotted:2,fine:3,dots:4},ld={none:0,isa:1,road:2},ud=`
// position.x: t (0|1), position.y: side (-1|1) — named 'position' so three.js draws it.
attribute vec3 iA;
attribute vec3 iB;
attribute vec4 iColA;   // rgb + alpha
attribute vec3 iColM;   // midpoint colour (lens-only lines)
attribute vec4 iStyle;  // x width px, y dash code, z draw from, w draw to
attribute vec3 iSheen;  // x kind, y phase (world u along the road), z world length
uniform vec2 uViewport;
varying float vT;
varying float vSide;
varying float vHalfW;
varying float vLenPx;
varying vec4 vColA;
varying vec3 vColM;
varying vec4 vStyle;
varying vec3 vSheen;
void main() {
  vec4 a = projectionMatrix * modelViewMatrix * vec4(iA, 1.0);
  vec4 b = projectionMatrix * modelViewMatrix * vec4(iB, 1.0);
  vec2 corner = position.xy;
  vT = corner.x;
  vColA = iColA;
  vColM = iColM;
  vStyle = iStyle;
  vSheen = iSheen;
  if (a.w <= 0.05 || b.w <= 0.05 || iColA.a <= 0.001) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  vec2 sa = a.xy / a.w * uViewport * 0.5;
  vec2 sb = b.xy / b.w * uViewport * 0.5;
  vec2 dv = sb - sa;
  float len = length(dv);
  vec2 dir = len > 0.0001 ? dv / len : vec2(1.0, 0.0);
  vec2 n = vec2(-dir.y, dir.x);
  vLenPx = len;
  vHalfW = iStyle.x * 0.5;
  float hw = max(vHalfW, 0.5) + 0.6; // tight AA margin: long faint lines are the fill cost
  vSide = corner.y * hw;
  vec4 p = mix(a, b, corner.x);
  p.xy += n * corner.y * hw * 2.0 / uViewport * p.w;
  gl_Position = p;
}`,dd=`
uniform float uTime;
uniform float uSheen;
uniform float uRoad;
varying float vT;
varying float vSide;
varying float vHalfW;
varying float vLenPx;
varying vec4 vColA;
varying vec3 vColM;
varying vec4 vStyle;
varying vec3 vSheen;
void main() {
  if (vT < vStyle.z || vT > vStyle.w) discard;
  float w = max(vHalfW, 0.5);
  float aa = 1.0 - smoothstep(w - 0.6, w + 0.6, abs(vSide));
  aa *= min(1.0, vHalfW * 2.0);
  float s = vT * vLenPx;
  float dash = floor(vStyle.y + 0.5);
  float sheenKind = floor(vSheen.x + 0.5);
  if (dash == 1.0) aa *= step(mod(s, 10.0), 6.0);
  else if (dash == 2.0) aa *= 1.0 - smoothstep(0.6, 1.4, abs(mod(s, 4.0) - 1.0));
  else if (dash == 3.0) aa *= step(mod(s, 6.0), 3.0);
  else if (dash == 4.0) aa *= step(mod(s, 5.0), 2.2);
  float m = 1.0 - abs(vT * 2.0 - 1.0);
  vec3 col = mix(vColA.rgb, vColM, smoothstep(0.0, 1.0, m));
  float sheen = 0.0;
  if (uSheen > 0.5 && sheenKind == 1.0) {
    float head = mod(uTime / 4000.0, 1.0) * (vSheen.z + 6.0) - 3.0;
    sheen = 1.0 - smoothstep(0.0, 3.0, abs(vT * vSheen.z - head));
  } else if (uSheen > 0.5 && sheenKind == 2.0) {
    float head = mod(uTime * 0.03, uRoad);
    sheen = 1.0 - smoothstep(0.0, 3.0, abs(vSheen.y + vT * vSheen.z - head));
  }
  float alpha = vColA.a * aa * (1.0 + sheen * 3.0);
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col * alpha, 1.0);
}`,fd=class{mesh;geo=new ls;iA=new Float32Array;iB=new Float32Array;iColA=new Float32Array;iColM=new Float32Array;iStyle=new Float32Array;iSheen=new Float32Array;material;count=0;constructor(){this.geo.setAttribute(`position`,new $i(new Float32Array([0,-1,0,1,-1,0,1,1,0,0,-1,0,1,1,0,0,1,0]),3)),this.material=new Ao({vertexShader:ud,fragmentShader:dd,uniforms:{uViewport:{value:new pr(1,1)},uTime:{value:0},uSheen:{value:1},uRoad:{value:400}},...Zu}),this.mesh=new Ra(this.geo,this.material),this.mesh.frustumCulled=!1,this.ensure(64)}ensure(e){if(this.iA.length>=e*3)return;let t=[this.iA,this.iB,this.iColA,this.iColM,this.iStyle,this.iSheen];this.iA=Qu(this.iA,e*3);let n=this.iA.length/3;this.iB=new Float32Array(n*3),this.iColA=new Float32Array(n*4),this.iColM=new Float32Array(n*3),this.iStyle=new Float32Array(n*4),this.iSheen=new Float32Array(n*3),[this.iA,this.iB,this.iColA,this.iColM,this.iStyle,this.iSheen].forEach((e,n)=>e.set(t[n]));for(let[e,t,n]of[[`iA`,this.iA,3],[`iB`,this.iB,3],[`iColA`,this.iColA,4],[`iColM`,this.iColM,3],[`iStyle`,this.iStyle,4],[`iSheen`,this.iSheen,3]]){let r=new Ha(t,n);r.setUsage(Un),this.geo.setAttribute(e,r)}this.geo._maxInstanceCount=void 0}begin(){this.count=0}push(e){if(e.alpha<=.002)return;this.ensure(this.count+1);let t=this.count++;this.iA[t*3]=e.ax,this.iA[t*3+1]=e.ay,this.iA[t*3+2]=e.az,this.iB[t*3]=e.bx,this.iB[t*3+1]=e.by,this.iB[t*3+2]=e.bz,this.iColA[t*4]=e.rgb[0]??1,this.iColA[t*4+1]=e.rgb[1]??1,this.iColA[t*4+2]=e.rgb[2]??1,this.iColA[t*4+3]=e.alpha;let n=e.mid??e.rgb;this.iColM[t*3]=n[0]??1,this.iColM[t*3+1]=n[1]??1,this.iColM[t*3+2]=n[2]??1,this.iStyle[t*4]=e.width,this.iStyle[t*4+1]=e.dash,this.iStyle[t*4+2]=e.from??0,this.iStyle[t*4+3]=e.to??1,this.iSheen[t*3]=e.sheen??0,this.iSheen[t*3+1]=e.phase??-1,this.iSheen[t*3+2]=e.len??1}end(){for(let e of[`iA`,`iB`,`iColA`,`iColM`,`iStyle`,`iSheen`])this.geo.getAttribute(e).needsUpdate=!0;this.geo.instanceCount=this.count,this.mesh.visible=this.count>0}dispose(){this.geo.dispose(),this.material.dispose()}},pd=`
attribute vec2 aDust; // x size px, y alpha
uniform float uDpr;
uniform float uFade;
varying float vA;
void main() {
  vA = aDust.y * uFade;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = (aDust.x + 1.0) * uDpr;
}`,md=`
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(0.3, 1.0, d)) * vA;
  gl_FragColor = vec4(vec3(0.91, 0.93, 0.96) * a, 1.0);
}`;function hd(e=7){let t=1200,n=new Float32Array(t*3),r=new Float32Array(t*2),i=e>>>0,a=()=>{i=i+1831565813>>>0;let e=i;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296};for(let e=0;e<t;e++){let t=a()*2-1,i=a()*Math.PI*2,o=Math.sqrt(1-t*t),s=900*(.85+.15*a());n[e*3]=Math.cos(i)*o*s,n[e*3+1]=t*s,n[e*3+2]=Math.sin(i)*o*s,r[e*2]=.6+.4*a(),r[e*2+1]=.05+.1*a()}let o=new ma;o.setAttribute(`position`,new $i(n,3)),o.setAttribute(`aDust`,new $i(r,2));let s=new mo(o,new Ao({vertexShader:pd,fragmentShader:md,uniforms:{uDpr:{value:1},uFade:{value:1}},...Zu}));return s.frustumCulled=!1,s}var gd=`
attribute vec3 aCol; // premultiplied rgb
varying vec3 vCol;
void main() {
  vCol = aCol;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,_d=`
varying vec3 vCol;
void main() { gl_FragColor = vec4(vCol, 1.0); }`,vd=class{lines;geo=new ma;pos=new Float32Array;col=new Float32Array;count=0;constructor(){let e=new Ao({vertexShader:gd,fragmentShader:_d,...Zu});this.lines=new so(this.geo,e),this.lines.frustumCulled=!1,this.ensure(64)}ensure(e){if(this.pos.length>=e*6)return;let t=this.pos,n=this.col;this.pos=Qu(this.pos,e*6),this.col=new Float32Array(this.pos.length),this.pos.set(t),this.col.set(n);for(let[e,t]of[[`position`,this.pos],[`aCol`,this.col]]){let n=new $i(t,3);n.setUsage(Un),this.geo.setAttribute(e,n)}}begin(){this.count=0}push(e){this.ensure(this.count+1);let t=this.count++*6;this.pos[t]=e.ax,this.pos[t+1]=e.ay,this.pos[t+2]=e.az,this.pos[t+3]=e.bx,this.pos[t+4]=e.by,this.pos[t+5]=e.bz;let n=Math.min(1,e.alpha);for(let r=0;r<2;r++)this.col[t+r*3]=(e.rgb[0]??1)*n,this.col[t+r*3+1]=(e.rgb[1]??1)*n,this.col[t+r*3+2]=(e.rgb[2]??1)*n}end(){for(let e of[`position`,`aCol`])this.geo.getAttribute(e).needsUpdate=!0;this.geo.setDrawRange(0,this.count*2),this.lines.visible=this.count>0}dispose(){this.geo.dispose(),this.lines.material.dispose()}},yd={lbl:{font:`500 12px Manrope, system-ui, sans-serif`,pad:0,h:16,track:.24},chip:{font:`400 11px "IBM Plex Mono", ui-monospace, monospace`,pad:12,h:17,track:0},flowchip:{font:`400 10px "IBM Plex Mono", ui-monospace, monospace`,pad:8,h:13,track:0},condchip:{font:`500 12px "IBM Plex Mono", ui-monospace, monospace`,pad:18,h:24,track:0},readchip:{font:`500 11px "IBM Plex Mono", ui-monospace, monospace`,pad:12,h:15,track:0},badge:{font:`700 12px "IBM Plex Mono", ui-monospace, monospace`,pad:12,h:18,track:0},trailchip:{font:`500 12px Manrope, system-ui, sans-serif`,pad:18,h:22,track:0}},bd=4,xd=class{root;pool=new Map;ctx;widths=new Map;frame=0;placed=[];labelsShown=0;constructor(e){this.root=document.createElement(`div`),this.root.className=`overlay-layer`,this.root.setAttribute(`aria-hidden`,`true`),Object.assign(this.root.style,{position:`absolute`,inset:`0`,pointerEvents:`none`,overflow:`hidden`}),e.appendChild(this.root),this.ctx=document.createElement(`canvas`).getContext(`2d`),document.fonts?.ready.then(()=>this.widths.clear()).catch(()=>{})}measure(e,t){let n=e+`\0`+t,r=this.widths.get(n);if(r!==void 0)return r;let i=yd[e],a=t.length*7;return this.ctx&&(this.ctx.font=i.font,a=this.ctx.measureText(t).width),a=Math.ceil(a+i.track*t.length+i.pad),this.widths.size>2e3&&this.widths.clear(),this.widths.set(n,a),a}place(e,t,n,r,i=[],a=2){this.frame++,e.sort((e,t)=>t.priority-e.priority);let o=[],s=i.map(e=>({x:e.x-e.r,y:e.y-e.r,w:e.r*2,h:e.r*2})),c=0,l=new Set,u=(e,t,n,r,i=!0)=>{for(let i of o)if(e<i.x+i.w+bd&&e+n+bd>i.x&&t<i.y+i.h+bd&&t+r+bd>i.y)return!0;if(i){for(let i of s)if(e<i.x+i.w&&e+n>i.x&&t<i.y+i.h&&t+r>i.y)return!0}return!1};for(let i of e){if(i.isLabel&&c>=t||i.opacity<=.02)continue;let e=yd[i.kind],d=this.measure(i.kind,i.text),f=e.h,p=null;for(let e of i.anchors){let t=Sd(e,i.x,i.y,i.offset,d,f);if(!(t.x<8||t.y<a||t.x+d>n-8||t.y+f>r-8)&&(i.force||!u(t.x,t.y,d,f,!i.overCores))){p=t;break}}if(!p&&i.coreFallback){let e=1/0;for(let t of i.anchors){let o=Sd(t,i.x,i.y,i.offset,d,f);if(o.x<8||o.y<a||o.x+d>n-8||o.y+f>r-8||u(o.x,o.y,d,f,!1))continue;let c=0;for(let e of s)o.x<e.x+e.w&&o.x+d>e.x&&o.y<e.y+e.h&&o.y+f>e.y&&c++;c<e&&(e=c,p=o)}}!p&&i.force&&(p=Sd(i.anchors[0]??`center`,i.x,i.y,i.offset,d,f)),p&&(o.push({key:i.key,nodeId:i.nodeId,kind:i.kind,x:p.x,y:p.y,w:d,h:f}),i.isLabel&&c++,l.add(i.key),this.show(i,p.x,p.y))}for(let[e,t]of this.pool)l.has(e)||(t.on&&(t.on=!1,t.el.classList.remove(`on`)),this.frame-t.lastSeen>30&&(t.el.remove(),this.pool.delete(e)));this.placed=o,this.labelsShown=c}show(e,t,n){let r=this.pool.get(e.key);if(!r){let t=document.createElement(`div`);r={el:t,text:``,cls:``,on:!1,lastSeen:this.frame,color:``,op:``},this.root.appendChild(t),this.pool.set(e.key,r)}let i=`${e.kind}${e.cls?` `+e.cls:``}`;r.cls!==i&&(r.cls=i,r.el.className=i+(r.on?` on`:``)),r.text!==e.text&&(r.text=e.text,r.el.textContent=e.text);let a=e.color??``;r.color!==a&&(r.color=a,r.el.style.setProperty(`--c`,a||null));let o=e.opacity.toFixed(2);r.op!==o&&(r.op=o,r.el.style.setProperty(`--o`,o)),r.el.style.transform=`translate3d(${Math.round(t)}px, ${Math.round(n)}px, 0)`,r.lastSeen=this.frame,r.on||(r.on=!0,requestAnimationFrame(()=>{(r&&r.lastSeen===this.frame||r?.on)&&r.el.classList.add(`on`)}))}clear(){for(let e of this.pool.values())e.el.remove();this.pool.clear(),this.placed=[],this.labelsShown=0}dispose(){this.clear(),this.root.remove()}};function Sd(e,t,n,r,i,a){switch(e){case`right`:return{x:t+r,y:n-a/2};case`left`:return{x:t-r-i,y:n-a/2};case`upright`:return{x:t+r*.7,y:n-r*.7-a};case`downright`:return{x:t+r*.7,y:n+r*.7};case`upleft`:return{x:t-r*.7-i,y:n-r*.7-a};case`downleft`:return{x:t-r*.7-i,y:n+r*.7};case`farright`:return{x:t+r+14,y:n-a/2};case`farleft`:return{x:t-r-14-i,y:n-a/2};case`above`:return{x:t-i/2,y:n-r-a};case`below`:return{x:t-i/2,y:n+r};default:return{x:t-i/2,y:n-a/2}}}var Cd=e=>{let t=/^#?([0-9a-f]{6})$/i.exec(e.trim());if(!t){let t=new vi().setStyle(e);return[t.r,t.g,t.b]}let n=parseInt(t[1],16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]},wd=(e,t,n)=>[Z(e[0],t[0],n),Z(e[1],t[1],n),Z(e[2],t[2],n)],Td=e=>`rgb(${Math.round(e[0]*255)}, ${Math.round(e[1]*255)}, ${Math.round(e[2]*255)})`,Ed=Cd(`#F4F6FF`),Dd=Cd(`#E8ECF5`),Od=Cd(`#9AA3B8`),kd=Cd(`#8CFFD1`),Ad=Cd(`#FF8A7A`),jd=Cd(`#8E96C8`),Md=Cd(`#E6FF6E`),Nd=Cd(`#FF9F5A`),Pd={relates:{rgb:Dd,alpha:.16,width:1,dash:cd.solid,sheen:ld.none},"is-a":{rgb:Dd,alpha:.22,width:1.25,dash:cd.solid,sheen:ld.isa},causes:{rgb:Dd,alpha:.2,width:1.25,dash:cd.solid,sheen:ld.isa},"part-of":{rgb:Dd,alpha:.18,width:1,dash:cd.dashed,sheen:ld.none},next:{rgb:Dd,alpha:.2,width:1,dash:cd.solid,sheen:ld.road},references:{rgb:Od,alpha:.18,width:1,dash:cd.dotted,sheen:ld.none},reads:{rgb:kd,alpha:.22,width:1,dash:cd.fine,sheen:ld.none},flow:{rgb:kd,alpha:.45,width:1.5,dash:cd.solid,sheen:ld.none},shortcut:{rgb:Md,alpha:.85,width:2,dash:cd.solid,sheen:ld.none}},Fd={association:`relates`,chain:`next`,"part-of":`part-of`,causes:`causes`,shortcut:`shortcut`,flow:`flow`},Q=-0xe8d4a51000,Id=({container:e,reducedMotion:t})=>{let n=new Lu({antialias:!1,powerPreference:`high-performance`,alpha:!1}),r=Math.min(window.devicePixelRatio||1,2);n.setPixelRatio(r),n.setClearColor(new vi(0),1),n.sortObjects=!1,n.domElement.setAttribute(`aria-hidden`,`true`),n.domElement.tabIndex=-1,e.appendChild(n.domElement);let i=new bi,a=new Xu,o=new rd,s=new fd,c=new fd,l=new vd,u=new sd,d=hd();i.add(d,l.lines,s.mesh,c.mesh,o.points,u.points);for(let e of[o.material,u.material,d.material])e.uniforms.uDpr&&(e.uniforms.uDpr.value=r);let f=new xd(e),p=Ku(),m=t,h=1,g=1,_=``,v={},y=Nd,b=new Map,x=[],S=new Map,C=new Set,w=!1,T=400,E=null,D=Q,O=Q,k=!1,A=0,j={t0:Q,speed:1,done:!0,end:0},M=null,N=0,P=null,F=null,I=Q,L=0,ee=[],te=0,ne=null,R=null,z=new Map,B=null,re=null,ie=new Set,ae=null,oe=null,se=new Set,ce=new Set,le=new Set,ue=[],de=null,fe=0,pe=p.now(),me=0,he=performance.now(),ge=0,_e=0,V=0,ve=!1,ye=1,be=new q,H=e=>{let t=v[e];return t?Cd(t):Nd},xe=(e,t)=>e.road?1.4:1.6+.45*Math.sqrt(t);function U(e){let t=new Map;for(let n of e.nodes)t.set(n.id,[]);for(let n of e.relations)t.get(n.from)?.push(n.to),t.get(n.to)?.push(n.from);let n=e.root&&t.has(e.root)?e.root:void 0;if(!n){let e=-1;for(let[r,i]of t)i.length>e&&(e=i.length,n=r)}let r=new Map;if(!n)return r;let i=[n];r.set(n,0);let a=0;for(;a<i.length;){let e=i[a++],n=[...t.get(e)??[]].sort();for(let e of n)r.has(e)||(r.set(e,r.size),i.push(e))}for(let t of e.nodes)r.has(t.id)||r.set(t.id,r.size);let o=Math.max(1,r.size-1);for(let[e,t]of r)r.set(e,t/o);return r}function W(e){let t=new Map;for(let n of e.relations)t.set(n.from,(t.get(n.from)??0)+1),t.set(n.to,(t.get(n.to)??0)+1);return t}function Se(){let e=[...S.values()].filter(e=>e.look===`next`&&e.removing===Q&&e.morph!==`out`),t=new Map,n=new Set;for(let r of e)t.set(r.from,r),n.add(r.to);let r=0;for(let t of e)t.phase=-1;for(let i of e.filter(e=>!n.has(e.from))){let e=i,n=0,a=new Set;for(;e&&!a.has(e.id);){a.add(e.id);let r=b.get(e.from)?.to,i=b.get(e.to)?.to,o=r&&i?Math.hypot(r.x-i.x,r.y-i.y,r.z-i.z):10;e.phase=n,e.len=o,n+=o,e=t.get(e.to)}r=Math.max(r,n)}T=r+60,s.material.uniforms.uRoad.value=T}function Ce(e,t){return{id:e.id,idx:t,data:e,pos:{...e.position},from:{...e.position},to:{...e.position},r:2,rFrom:2,rTo:2,rank:0,degree:0,road:!1,phase:Gu(e.id)*Math.PI*2,ignite:Q,birth:Q,flash:Q,flashColor:Ed,burst:Q,burstScale:3,nbrs:new Set,sx:0,sy:0,depth:1,pxR:3,onScreen:!1,bright:1,dying:Q}}function we(e){let t=W(e),n=U(e),r=new Set;for(let t of e.relations)t.type===`chain`&&(r.add(t.from),r.add(t.to));for(let e of b.values())e.nbrs.clear();for(let t of e.relations)b.get(t.from)?.nbrs.add(t.to),b.get(t.to)?.nbrs.add(t.from);for(let e of b.values())e.dying===Q&&(e.degree=t.get(e.id)??0,e.road=r.has(e.id),e.rank=n.get(e.id)??1,e.rTo=xe(e,e.degree));C=new Set(e.relations.map(e=>e.id))}function Te(e){return{id:e.id,from:e.from,to:e.to,look:e.look??Fd[e.type]??`relates`,lensOnly:e.lensOnly??!1,chip:e.chip,weight:e.weight,drawT0:Q,drawDur:480,morph:null,removing:Q,phase:-1,len:1}}function Ee(){x=[...b.values()],x.forEach((e,t)=>e.idx=t)}function De(e){let t=p.now(),n=w&&e.perspective===_,r=new Set(e.nodes.map(e=>e.id)),i=e.nodes.filter(e=>!b.has(e.id)).length,a=!w||!n||i>Math.max(4,e.nodes.length*.3);if(v=e.lensColors??v,_=e.perspective,E){let e=E;E=null,e.resolve()}y=H(_);for(let[e,n]of b)r.has(e)||(a||m?b.delete(e):n.dying===Q&&(n.dying=t));e.nodes.forEach((e,n)=>{let r=b.get(e.id);r||(r=Ce(e,n),!a&&!m&&(r.birth=t),b.set(e.id,r)),r.data=e,r.dying=Q,r.pos={...e.position},r.from={...e.position},r.to={...e.position}}),Ee(),we(e);for(let e of b.values())e.r=e.rTo,e.rFrom=e.rTo;let o=new Set(e.relations.map(e=>e.id));for(let[e,n]of S)o.has(e)?n.morph=null:a||m?S.delete(e):n.removing===Q&&(n.removing=t,n.endsA={...b.get(n.from)?.pos??{x:0,y:0,z:0}},n.endsB={...b.get(n.to)?.pos??{x:0,y:0,z:0}});for(let n of e.relations){let e=S.get(n.id);if(e&&e.removing===Q){Object.assign(e,{look:n.look??Fd[n.type]??`relates`,lensOnly:n.lensOnly??!1,chip:n.chip,weight:n.weight,from:n.from,to:n.to});continue}let r=Te(n);!a&&!m&&(r.drawT0=t,r.drawDur=r.look===`shortcut`?700:420),S.set(n.id,r)}a&&(O=Q,z=new Map,B=null),Se(),w||Me(!0),w=!0}function Oe(e,t){if(!w)return De(e),Promise.resolve();let n=p.now(),r=m?0:zu(t?.durationMs??1e3,0,1200),i=E?ke(n):y;if(E){let e=E;E=null,e.resolve()}v=e.lensColors??v,_=e.perspective;let a=H(_),o=new Set(e.nodes.map(e=>e.id));for(let e of[...b.keys()])o.has(e)||b.delete(e);e.nodes.forEach((e,t)=>{let n=b.get(e.id);n||(n=Ce(e,t),b.set(e.id,n)),n.data=e,n.from={...n.pos},n.to={...e.position},n.rFrom=n.r}),Ee(),we(e);let s=new Set(e.relations.map(e=>e.id));for(let[e,t]of S)t.removing===Q&&(s.has(e)?t.morph===`out`&&(t.morph=null):r===0?S.delete(e):t.morph=`out`);for(let t of e.relations){let e=S.get(t.id);if(e&&e.removing===Q){Object.assign(e,{look:t.look??Fd[t.type]??`relates`,lensOnly:t.lensOnly??!1,chip:t.chip,weight:t.weight});continue}let n=Te(t);n.morph=r===0?null:`in`,S.set(t.id,n)}if(z=new Map,B=null,r===0){for(let e of b.values())e.pos={...e.to},e.from={...e.to},e.r=e.rTo;return D=n,y=a,O=n,Se(),Promise.resolve()}return O=n,Se(),new Promise(e=>{E={t0:n,k:r/1e3,lensFrom:i,lensTo:a,resolve:e}})}function ke(e){return E?wd(E.lensFrom,E.lensTo,Ru(e,E.t0,E.t0+1e3*E.k)):y}function Ae(e,t=1){let n=[];if(e)for(let t of e){let e=b.get(t);e&&n.push(e.to)}else for(let e of b.values())e.dying===Q&&n.push(e.to);if(!n.length)return{c:{x:0,y:0,z:0},R:60};let r={x:1/0,y:1/0,z:1/0},i={x:-1/0,y:-1/0,z:-1/0};for(let e of n)r={x:Math.min(r.x,e.x),y:Math.min(r.y,e.y),z:Math.min(r.z,e.z)},i={x:Math.max(i.x,e.x),y:Math.max(i.y,e.y),z:Math.max(i.z,e.z)};let a={x:(r.x+i.x)/2,y:(r.y+i.y)/2,z:(r.z+i.z)/2},o=n.map(e=>Math.hypot(e.x-a.x,e.y-a.y,e.z-a.z));if(t<1){let e=e=>[...n].sort((t,n)=>t[e]-n[e])[Math.floor(n.length/2)][e];return a={x:e(`x`),y:e(`y`),z:e(`z`)},o=n.map(e=>Math.hypot(e.x-a.x,e.y-a.y,e.z-a.z)).sort((e,t)=>e-t),{c:a,R:Math.max(30,o[Math.floor(o.length*t)]??60)}}return{c:a,R:Math.max(20,...o)+4}}function je(){if(h<600){let e=new Set;for(let t of b.values())t.data.kind===`pathway`&&e.add(t.id);for(let t of S.values())t.look===`reads`&&t.removing===Q&&e.add(t.to);if(b.size>120){let e=Ae();return{tx:e.c.x,ty:e.c.y,tz:e.c.z,dist:a.fitDistance(e.R*1.06),az:0,el:12*Math.PI/180}}let{c:t,R:n}=e.size>=3?Ae(e):Ae(void 0,.45);return{tx:t.x,ty:t.y,tz:t.z,dist:a.fitDistance(n*1.08),az:0,el:12*Math.PI/180}}let{c:e,R:t}=Ae();return{tx:e.x,ty:e.y,tz:e.z,dist:a.fitDistance(t*.9),az:0,el:12*Math.PI/180}}function Me(e,t=800){let n=je();return e?(a.snap(n),Promise.resolve()):a.flyTo(n,p.now(),m?0:t)}async function Ne(){for(;E;)await new Promise(e=>ue.push(e))}async function Pe(e,t){if(await Ne(),e===null)return Me(!1,800);let n=b.get(e);if(!n)return;let r=t?.animate!==!1&&!m,i={tx:n.to.x,ty:n.to.y,tz:n.to.z,dist:70};if(!r)a.snap(i),m&&(D=p.now()-50);else return a.flyTo(i,p.now(),900)}async function Fe(e){if(await Ne(),!e.length)return;let{c:t,R:n}=Ae(e);return a.flyTo({tx:t.x,ty:t.y,tz:t.z,dist:a.fitDistance(n*1.15)},p.now(),m?0:900)}function Ie(e,t){let n=b.get(e);if(!n)return;let r=a.pose();a.flyTo({tx:Z(r.tx,n.to.x,t),ty:Z(r.ty,n.to.y,t),tz:Z(r.tz,n.to.z,t)},p.now(),m?0:900,0)}function Le(e){let t=p.now(),n=e.find(e=>e.role===`learned`);if(n){let e=n.route.nodes[0],r=n.route.nodes[n.route.nodes.length-1],i=ee.find(e=>e.trail.role===`shortest`);if(e&&r){ne={t0:t,a:e,b:r,beads:i?i.trail.route.nodes.slice(1,-1):[]};for(let n of[e,r]){let e=b.get(n);e&&(e.flash=t+700,e.flashColor=Md)}}ee=ee.filter(e=>e.trail.role!==`shortest`&&e.trail.role!==`declared`)}else ne=null,ee=e.map(e=>({trail:e,t0:t}))}function Re(){ee=[],ne=null}function ze(e){let t=p.now();if(!e||!e.length)F=null;else{F=new Map(e.map(e=>[e.nodeId,e.depth])),I=t;for(let n of e)if(n.depth===0){let e=b.get(n.nodeId);e&&(e.burst=t,e.burstScale=3,e.flash=t,e.flashColor=Ed)}}}function Be(e,t,n){let r=t/520,i=[],a=[],o=0;return e.steps.forEach((t,s)=>{i.push(o);let c=b.get(t.nodeId),l=t.op===`read`||t.op!==`start`&&/@/.test(c?.data.valueText??``)||Ve(t.nodeId).length>0,u=n?300:(l?420:140)*r;a.push(u),o+=u+(n||s===e.steps.length-1?0:380*r)}),{arrive:i,dwell:a,travel:n?0:380*r,end:o}}function Ve(e){let t=[];for(let n of S.values())n.look===`reads`&&n.from===e&&n.removing===Q&&n.morph!==`out`&&t.push(n.to);return t}function He(e,t){Ue(),z=new Map,B=null,ie=new Set(e.steps.map(e=>e.nodeId));let n=Be(e,t?.stepMs??520,m);return new Promise(r=>{R={trace:e,arrive:n.arrive,dwell:n.dwell,travel:n.travel,lt:0,k:-1,paused:!1,reduced:m,onStep:t?.onStep,condText:t?.conditionText,resolve:r,endAt:n.end+(m?0:600),done:!1}})}function Ue(){if(R){let e=R;R=null,e.resolve()}re=null}function We(e,t,n){e.k=t;let r=e.trace.steps[t];if(!r)return;let i=b.get(r.nodeId);i&&(i.flash=n,i.flashColor=r.branch===`false`?Ad:kd),r.op===`while`&&(e.trace.steps.slice(0,t).some(e=>e.nodeId===r.nodeId)?z.set(r.nodeId,(z.get(r.nodeId)??0)+1):z.has(r.nodeId)||z.set(r.nodeId,0)),(r.op===`if`||r.op===`while`)&&(B={id:r.nodeId,text:e.condText?e.condText(r):Ld(r.note),ok:r.branch!==`false`});let a=Ve(r.nodeId);re=a[0]&&!e.reduced?{from:r.nodeId,to:a[0],t0:n,dur:Math.max(120,(e.dwell[t]??140)*.9)}:a[0]?{from:r.nodeId,to:a[0],t0:n,dur:1}:null,e.onStep?.(t)}function Ge(){let e=R;if(!e)return;e.paused=!0;let t=e.k+1;e.lt=t<e.arrive.length?e.arrive[t]??e.lt:e.endAt}let Ke=n.domElement,qe=new Map,Je=null,Ye=null;function Xe(e){let t=Ke.getBoundingClientRect();return{x:e.clientX-t.left,y:e.clientY-t.top}}function Ze(e,t){let n=null,r=1/0;for(let i of x){if(!i.onScreen||i.dying!==Q||i.bright<.05)continue;let a=Math.max(i.pxR,10),o=Math.hypot(i.sx-e,i.sy-t);o<=a&&o-a*.25<r&&(r=o-a*.25,n=i.id)}return n}let Qe=e=>{let t=Xe(e);if(Ke.setPointerCapture?.(e.pointerId),qe.set(e.pointerId,{...t,button:e.button}),a.input(p.now()),qe.size===1)Je={...t,moved:!1,button:e.button,shift:e.shiftKey},a.beginDrag();else if(qe.size===2){let[e,t]=[...qe.values()];Ye={d:Math.hypot(e.x-t.x,e.y-t.y),mx:(e.x+t.x)/2,my:(e.y+t.y)/2},Je&&(Je.moved=!0)}},$e=e=>{let t=Xe(e);de=t;let n=qe.get(e.pointerId),r=p.now();if(!n)return;if(qe.size>=2&&Ye){qe.set(e.pointerId,{...t,button:n.button});let[i,o]=[...qe.values()],s=Math.hypot(i.x-o.x,i.y-o.y),c=(i.x+o.x)/2,l=(i.y+o.y)/2;Ye.d>0&&s>0&&a.dolly(Math.log(s/Ye.d)/-Math.log(.92),r),a.panBy(c-Ye.mx,l-Ye.my,r),Ye={d:s,mx:c,my:l};return}let i=t.x-n.x,o=t.y-n.y;qe.set(e.pointerId,{...t,button:n.button}),Je&&!Je.moved&&Math.hypot(t.x-Je.x,t.y-Je.y)>4&&(Je.moved=!0),Je?.moved&&(Je.button===2||Je.button===1||Je.shift?a.panBy(i,o,r):a.orbitBy(i,o,r))},et=e=>{let t=Xe(e);if(qe.delete(e.pointerId),qe.size<2&&(Ye=null),qe.size===0){if(a.endDrag(),Je&&!Je.moved&&e.button===0){let e=Ze(t.x,t.y);for(let t of se)t(e)}Je=null}},tt=()=>{de=null},nt=e=>{e.preventDefault();let t=e.deltaMode===1?33:e.deltaMode===2?400:1;a.dolly(-e.deltaY*t/100,p.now())},rt=()=>a.input(p.now());Ke.addEventListener(`pointerdown`,Qe),Ke.addEventListener(`pointermove`,$e),Ke.addEventListener(`pointerup`,et),Ke.addEventListener(`pointercancel`,et),Ke.addEventListener(`pointerleave`,tt),Ke.addEventListener(`wheel`,nt,{passive:!1}),Ke.addEventListener(`contextmenu`,e=>e.preventDefault()),window.addEventListener(`keydown`,rt),window.addEventListener(`pointerdown`,rt);function it(){if(ve)return;V=requestAnimationFrame(it);let e=performance.now(),t=p.now(),f=zu(t-pe,0,100);pe=t,fe++;let _=null;if(E){let e=E,n=(t-e.t0)/e.k;_=zu(n/1e3,0,1);for(let e of x){let t=Uu(Ru(n,160*e.rank,160*e.rank+840));e.pos={x:Z(e.from.x,e.to.x,t),y:Z(e.from.y,e.to.y,t),z:Z(e.from.z,e.to.z,t)},e.r=Z(e.rFrom,e.rTo,t)}if(y=ke(t),n>=1e3){for(let e of x)e.pos={...e.to},e.r=e.rTo;for(let[e,t]of S)t.morph===`out`?S.delete(e):t.morph=null;y=e.lensTo,E=null,Se(),e.resolve()}}let v=E?(t-E.t0)/E.k:1/0;N=zu(N+(M?f/180:-f/120),0,1),te=zu(te+(ee.length||ne?f/300:-f/300),0,1),L=zu(L+(F?f/120:-f/200),0,1),A=zu(A+(k?f/200:-f/300),0,1),ne&&t-ne.t0>1e3&&(ne=null);let w=!m,T=w?1+.004*Math.sin(2*Math.PI*t/9e3):1,O=D===Q?1:Ru(t,D,D+200),z=j.t0!==Q&&m?Ru(t,j.t0,j.t0+200):1;!j.done&&t>j.end&&(j.done=!0);let B=R;if(B&&!B.done){B.paused||(B.lt+=f);let e=B.k;for(;e+1<B.arrive.length&&(B.arrive[e+1]??1/0)<=B.lt;)e++,We(B,e,t);if(e<0&&B.arrive.length&&We(B,0,t),B.lt>=(B.arrive[B.arrive.length-1]??0)+(B.dwell[B.dwell.length-1]??0)&&!ae&&B.trace.steps.length){let e=B.trace.steps[B.trace.steps.length-1];if(e){ae={id:e.nodeId,t0:t};let n=b.get(e.nodeId);n&&(n.burst=t,n.burstScale=4,n.flash=t,n.flashColor=B.trace.status===`ended`?kd:Ad)}}B.lt>=B.endAt&&(B.done=!0,R=null,re=null,B.resolve())}ae&&t-ae.t0>700&&(ae=null),a.driftAllowed=!m&&!E&&!ot(),a.update(t,f,!0);let se=a.camera,H=a.pxScale();o.material.uniforms.uPxScale.value=H;let xe=se.position,U=Math.max(1,a.distance/300),W=new Set;for(let e of ee)for(let t of e.trail.route.nodes)W.add(t);ne&&(W.add(ne.a),W.add(ne.b));let Ce=M?b.get(M)?.nbrs:void 0,we=st(t,v),Te=we>6.5;o.begin(x.length),u.begin(),c.begin();for(let e of x){let n=e.pos.x*T,r=e.pos.y*T,i=e.pos.z*T;if(!Number.isFinite(n+r+i))continue;be.set(n,r,i).project(se);let a=Math.hypot(xe.x-n,xe.y-r,xe.z-i);e.sx=(be.x+1)/2*h,e.sy=(1-be.y)/2*g,e.depth=a,e.onScreen=be.z<1&&be.z>-1&&e.sx>-40&&e.sx<h+40&&e.sy>-40&&e.sy<g+40;let s=1,c=1;if(e.ignite!==Q){if(m)s=z;else{let n=Ru(t,e.ignite,e.ignite+420*j.speed);s=Vu(n),c=n<=0?.4:Z(.4,1,Hu(n))}}if(e.birth!==Q){let n=t-e.birth;n<260?c*=Z(.15,1.3,Hu(n/260)):n<460?c*=Z(1.3,1,Vu((n-260)/200)):e.birth=Q}if(e.dying!==Q){let n=Ru(t,e.dying,e.dying+200);if(s*=1-n,n>=1){b.delete(e.id);continue}}let l=1;e.degree===0&&(l=.35);let d=1;if(L>0){let n=F?.get(e.id),r=n===void 0?.12:n===0?1.15:n===1?1:n===2?.55:.3,i=n===void 0?1:Ru(t-I,90*n,90*n+160),a=Z(.12,r,i);l=Z(l,a,L),n===0&&(c*=Z(1,1.6,L*i))}if(te>0&&(l*=Z(1,W.has(e.id)?1:.25,te)),N>0&&M){let t=e.id===M,n=Ce?.has(e.id)??!1;l*=Z(1,t?1.1:n?1.2:.55,N),t&&(c*=Z(1,1.25,N),d*=Z(1,1.4,N))}R&&ie.has(e.id)&&(l=Math.max(l,.9));let f=w?.85+.15*Math.sin(2*Math.PI*t/6400+e.phase):1,p=1;if(e.flash!==Q){let n=t-e.flash;n>=0&&n<420&&(p=n<120?Z(1,2.2,n/120):Z(2.2,1,(n-120)/300))}let _=s*l*f*O*p;e.bright=s*l;let v=e.data.kind===`pathway`?$u.pathway:e.road?$u.road:$u[e.data.kind]??0,x=e.data.op?ed[e.data.op]:0,S=e.data.kind===`pathway`?kd:p>1.01?wd(Ed,e.flashColor,Math.min(1,(p-1)/1.2)):Ed,C=e.data.kind===`pathway`?wd(kd,y,.15):wd(Ed,y,.85),E=+(e.id===P);o.push(n,r,i,e.r,S,C,_,c,d,E,v,x);let D=v===$u.pathway?4.5:3;if(e.pxR=zu(e.r*H/Math.max(.1,a),D,18)*c,e.burst!==Q){let a=t-e.burst,o=e.burstScale>3?600:500;if(a>=0&&a<o&&!m){let t=Vu(a/o);u.push(n,r,i,e.pxR*Z(1.2,e.burstScale,t),e.burstScale>3?kd:Ed,(1-t)*.9,id.ring)}else a>=o&&(e.burst=Q)}let k=e.data.ghosts;k&&k.length&&s>.05&&ct(e,k,n,r,i,we,t,_)}b.size!==x.length&&Ee(),s.begin(),l.begin();let De=C.size>300;s.material.uniforms.uTime.value=t,s.material.uniforms.uSheen.value=+!m,s.material.uniforms.uViewport.value.set(h,g),c.material.uniforms.uViewport.value.set(h,g),c.material.uniforms.uTime.value=t;let Oe=0;for(let[e,n]of S){let r=n.removing===Q?b.get(n.from)?.pos:n.endsA,i=n.removing===Q?b.get(n.to)?.pos:n.endsB;if(!r||!i)continue;let a=b.get(n.from),o=b.get(n.to),c=Pd[n.look]??Pd.relates,d=1,f=1;if(n.removing!==Q){let r=Ru(t,n.removing,n.removing+300);if(f=1-Uu(r),r>=1){S.delete(e);continue}}else C.has(e)&&n.morph!==`out`&&Oe++;if(n.morph===`out`&&(d*=1-Ru(v,0,400)),n.morph===`in`&&(d*=Ru(v,600,1e3)),n.drawT0!==Q){let e=Ru(t,n.drawT0,n.drawT0+n.drawDur*(j.t0!==Q&&!j.done?j.speed:1));f=Math.min(f,Vu(e)),e>=1&&j.done&&(n.drawT0=Q)}if(f<=.001)continue;m&&j.t0!==Q&&(d*=z),d*=Math.min(+(a?.dying===Q),+(o?.dying===Q))||(n.removing===Q?0:1);let p=((a?.depth??300)+(o?.depth??300))/2,h=n.look===`shortcut`?1:Z(1,.35,Ru(p,150*U,450*U)),g=c.alpha*(.6+.4*n.weight)*h*d*O;if(L>0){let e=F?.get(n.from),t=F?.get(n.to),r=e!==void 0&&t!==void 0?Math.max(.3,.55**Math.max(e,t))*2.2:.04/Math.max(.01,c.alpha);g*=Z(1,Math.min(r,3),L)}te>0&&!(W.has(n.from)&&W.has(n.to))&&(g*=Z(1,.25,te)),M&&N>0&&(g=n.from===M||n.to===M?Z(g,.5,N):g*Z(1,.55,N));let _=n.lensOnly?y:c.rgb,x={ax:r.x*T,ay:r.y*T,az:r.z*T,bx:i.x*T,by:i.y*T,bz:i.z*T,rgb:c.rgb,mid:_,alpha:g,width:c.width,dash:c.dash,from:0,to:f,sheen:c.sheen,phase:n.phase,len:Math.max(1,n.look===`next`?n.len:Math.hypot(r.x-i.x,r.y-i.y,r.z-i.z))},w=M&&(n.from===M||n.to===M)||P&&(n.from===P||n.to===P)||L>0&&F?.has(n.from)&&F?.has(n.to);if(De&&!w&&n.look===`relates`&&!n.lensOnly&&f>=1?l.push(x):s.push(x),n.look===`shortcut`&&a&&o&&g>.05)for(let e of[a,o]){let n=e.flash!==Q&&t-e.flash>=0&&t-e.flash<240?1.6:1;u.push(e.pos.x*T,e.pos.y*T,e.pos.z*T,2.2*n,Md,.55*g*n,id.glow)}}s.end(),l.end();let Ae=[];for(let e of ee){let n=e.trail.route,r=m?n.hops:(t-e.t0)/160,i=Math.min(n.hops,Math.floor(r));Ae.push({role:e.trail.role,hops:n.hops,head:i});let a=e.trail.role!==`declared`,o=a?Md:jd;for(let e=0;e<n.nodes.length-1;e++){let t=zu(r-e,0,1);if(t<=0)break;let i=b.get(n.nodes[e])?.pos,s=b.get(n.nodes[e+1])?.pos;i&&s&&c.push({ax:i.x*T,ay:i.y*T,az:i.z*T,bx:s.x*T,by:s.y*T,bz:s.z*T,rgb:o,alpha:a?.95:.85,width:a?2.5:2,dash:a?cd.solid:cd.dots,to:t})}for(let r=0;r<=Math.min(i,n.nodes.length-1);r++){let i=b.get(n.nodes[r]);if(!i)continue;let s=r===n.nodes.length-1,c=t-(e.t0+r*160),l=!m&&c<240?1+.6*(1-c/240):1;u.push(i.pos.x*T,i.pos.y*T,i.pos.z*T,(a?3:2.5)*l*(s?1.5:1),o,.95,id.bead),s&&!m&&c<600&&u.push(i.pos.x*T,i.pos.y*T,i.pos.z*T,i.pxR*Z(1.2,3,Vu(c/600)),o,1-c/600,id.ring)}}if(ne){let e=b.get(ne.a)?.pos,n=b.get(ne.b)?.pos,r=Vu(Ru(t-ne.t0,700,1e3));if(e&&n)for(let t of ne.beads){let i=b.get(t);if(!i)continue;let a={x:n.x-e.x,y:n.y-e.y,z:n.z-e.z},o=a.x*a.x+a.y*a.y+a.z*a.z||1,s=zu(((i.pos.x-e.x)*a.x+(i.pos.y-e.y)*a.y+(i.pos.z-e.z)*a.z)/o,0,1),c={x:e.x+a.x*s,y:e.y+a.y*s,z:e.z+a.z*s};u.push(Z(i.pos.x,c.x,r)*T,Z(i.pos.y,c.y,r)*T,Z(i.pos.z,c.z,r)*T,3,Md,.95*(1-r),id.bead)}}if(R&&lt(R,T),re){let e=b.get(re.from)?.pos,n=b.get(re.to)?.pos,r=Ru(t,re.t0,re.t0+re.dur);if(e&&n&&r<1&&!m){let t=Wu(r);u.push(Z(e.x,n.x,t)*T,Z(e.y,n.y,t)*T,Z(e.z,n.z,t)*T,2.2,kd,.95,id.spark)}}if(oe&&de){let e=b.get(oe);if(e){let t=new q(de.x/h*2-1,-(de.y/g)*2+1,.5).unproject(se).sub(xe).normalize(),n=e.depth,r=xe.clone().add(t.multiplyScalar(n));c.push({ax:e.pos.x*T,ay:e.pos.y*T,az:e.pos.z*T,bx:r.x,by:r.y,bz:r.z,rgb:y,alpha:.8,width:1.5,dash:cd.dashed}),u.push(r.x,r.y,r.z,3,y,.9,id.ring)}}o.end(),c.end(),u.end(),d.material.uniforms.uFade.value=Math.min(O,j.t0!==Q&&!m?Ru(t,j.t0,j.t0+1200):1),(fe%2==0||fe<3)&&ut(t,U,we,Te),n.render(i,se),at={morphT:_,ghostExpanded:Te,visibleEdges:Oe,trailHeads:Ae};for(let e of le)e(t);if(ue.length&&!E)for(let e of ue.splice(0))e();_e=Z(_e||16,performance.now()-e,.1),me++;let je=performance.now();if(je-he>=1e3){ge=me*1e3/(je-he),me=0,he=je;let e=ge<40?Math.max(.6,ye-.15):ge>57?Math.min(1,ye+.15):ye;if(e!==ye){ye=e,n.setPixelRatio(r*ye),n.setSize(h,g,!1);for(let e of[o.material,u.material,d.material])e.uniforms.uDpr&&(e.uniforms.uDpr.value=r*ye)}}let Me=de&&qe.size===0?Ze(de.x,de.y):qe.size?M:null;if(Me!==M){M=Me,Ke.parentElement?.classList.toggle(`hovering`,!!Me);for(let e of ce)e(Me)}}let at={morphT:null,ghostExpanded:!1,visibleEdges:0,trailHeads:[]};function ot(){let e=document.activeElement;return!!e&&(e.tagName===`INPUT`||e.tagName===`TEXTAREA`||e.tagName===`SELECT`)}function st(e,t){if(m)return 9;let n=3.5;if(O!==Q){let r=E?t:e-O;n=r<500?9*Hu(Ru(r,0,500)):r<3400?9:r<3800?Z(9,3.5,Uu(Ru(r,3400,3800))):3.5,n=Math.max(n,3.5*(r<500?Ru(r,0,120):1)),r>=3800&&!E&&(O=Q)}return Z(n,9,A)}function ct(e,t,n,r,i,o,s,l){let d=new q,f=new q;a.camera.matrixWorld.extractBasis(d,f,new q);let p=m||o>6.5?0:s/1e3*.08*Math.PI*2%(Math.PI*2),h=0;e.id===M&&de&&(h=Math.atan2(-(de.y-e.sy),de.x-e.sx)-270*Math.PI/180);let g=o;t.forEach((t,o)=>{let s=(90+120*(o+1))*Math.PI/180+p+h*N,m=n+(d.x*Math.cos(s)+f.x*Math.sin(s))*g,_=r+(d.y*Math.cos(s)+f.y*Math.sin(s))*g,v=i+(d.z*Math.cos(s)+f.z*Math.sin(s))*g,y=H(t.perspective),b=zu(e.r*.6*a.pxScale()/Math.max(.1,e.depth),1.8,10);u.push(m,_,v,b,y,.55*Math.min(1,l),id.glow),c.push({ax:n,ay:r,az:i,bx:m,by:_,bz:v,rgb:y,alpha:.3*Math.min(1,l),width:1,dash:cd.solid})})}function lt(e,t){let n=t=>{let n=0;for(;n+1<e.arrive.length&&(e.arrive[n+1]??1/0)<=t;)n++;let r=e.trace.steps[n],i=r?b.get(r.nodeId)?.pos:void 0;if(!i)return null;let a=(e.arrive[n]??0)+(e.dwell[n]??0),o=e.trace.steps[n+1];if(!o||t<a||e.reduced)return i;let s=b.get(o.nodeId)?.pos;if(!s)return i;let c=Wu(Ru(t,a,a+e.travel));return{x:Z(i.x,s.x,c),y:Z(i.y,s.y,c),z:Z(i.z,s.z,c)}};if(e.lt>(e.arrive[e.arrive.length-1]??0)+(e.dwell[e.dwell.length-1]??0))return;let r=n(e.lt);if(r&&(u.push(r.x*t,r.y*t,r.z*t,3.2,kd,1,id.spark),!e.reduced))for(let r=1;r<=6;r++){let i=n(e.lt-r*30);if(!i)break;u.push(i.x*t,i.y*t,i.z*t,3.2*(1-r/8),kd,.75*(1-r/7),id.glow)}}function ut(e,t,n,r){let i=[],o=P?b.get(P)?.nbrs:void 0,s=h<600?18:h>=1920?48:40,c=Td(y),l=new Set;for(let e of ee){let t=e.trail.route.nodes;if(e.trail.role===`declared`)t[0]&&l.add(t[0]),t[t.length-1]&&l.add(t[t.length-1]);else for(let e of t)l.add(e)}let u=new Set,d=new Map;if(r){let e=h/2,t=g/2,n=x.filter(e=>e.onScreen&&e.data.ghosts?.length&&e.bright>.2);n.sort((n,r)=>r.degree-n.degree||Math.hypot(n.sx-e,n.sy-t)-Math.hypot(r.sx-e,r.sy-t));for(let e of k?n:n.slice(0,8))u.add(e.id);[...u].forEach((e,t)=>d.set(e,t)),P&&u.add(P),M&&u.add(M)}let p=e=>e.length>16?e.slice(0,15).trimEnd()+`…`:e,_=x.filter(e=>e.onScreen&&e.dying===Q&&e.bright>=.06&&e.data.kind!==`pathway`&&!e.road).sort((e,t)=>t.degree-e.degree).slice(0,x.length>120?10:3).map(e=>e.id),v=new Set(_),C=_[0];for(let e of x){if(!e.onScreen||e.dying!==Q)continue;let r=e.bright;if(r<.06)continue;let s=1-Ru(e.depth,220*t,480*t),f=F?.get(e.id),m=v.has(e.id),h=10+Math.min(e.degree,30)*.5;if(m&&(h=Math.max(h,58)),e.road&&(h=ee.length?75:50),o?.has(e.id)&&(h=Math.max(h,60)),f!==void 0&&f<=1&&(h=f===0?80:70),e.id===M&&(h=90),l.has(e.id)&&(h=95),e.id===P&&(h=100),R&&ie.has(e.id)&&(h=Math.max(h,55)),e.pxR<4&&h<60&&!e.road)continue;let g=zu(Math.max(s,h>=60?.9:.25)*Math.min(1,r*1.4),0,1);if(i.push({key:`l:`+e.id,kind:`lbl`,text:e.data.label,x:e.sx,y:e.sy,offset:(e.id===P?Math.max(e.pxR*2.4,e.pxR+7):e.pxR)+6,anchors:[`right`,`left`,`upright`,`downright`,`above`,`below`,`upleft`,`downleft`,`farright`,`farleft`],priority:h,opacity:g,cls:e.id===P?`sel`:e.road?`road`:void 0,overCores:e.id===P,coreFallback:e.id===C,isLabel:!e.road,nodeId:e.id}),u.has(e.id)&&e.data.ghosts?.length){let t=new q,r=new q;a.camera.matrixWorld.extractBasis(t,r,new q);let o=a.pxScale()/Math.max(.1,e.depth);e.data.ghosts.forEach((t,r)=>{let a=(90+120*(r+1))*Math.PI/180,s=n*o+8;i.push({key:`g:${e.id}:${t.perspective}`,kind:`chip`,text:p(e.data.ghostText?.[t.perspective]??String(t.value??`—`)),x:e.sx+Math.cos(a)*s,y:e.sy-Math.sin(a)*s,offset:0,anchors:Math.cos(a)<0?[`left`,`downleft`,`upleft`,`farleft`,`below`]:[`right`,`downright`,`upright`,`farright`,`below`],priority:85-(d.get(e.id)??8)*.5-r*.1+(e.id===P?10:0),opacity:Math.max(g,.85),color:Td(H(t.perspective)),overCores:d.get(e.id)===0||e.id===P||e.id===M})}),e.data.valueText&&i.push({key:`v:${e.id}`,kind:`chip`,text:p(e.data.valueText),x:e.sx,y:e.sy-(n*o+8),offset:0,anchors:[`above`,`upright`,`upleft`,`farright`,`farleft`,`below`,`downright`,`downleft`],priority:85.2-(d.get(e.id)??8)*.5,overCores:d.get(e.id)===0||e.id===P||e.id===M,opacity:Math.max(g,.85),color:c})}}for(let e of S.values()){if(!e.chip||e.removing!==Q||e.morph===`out`)continue;let t=b.get(e.from),n=b.get(e.to);t&&n&&t.onScreen&&n.onScreen&&(Math.hypot(t.sx-n.sx,t.sy-n.sy)<46||i.push({key:`f:`+e.id,kind:`flowchip`,text:e.chip,x:(t.sx+n.sx)/2,y:(t.sy+n.sy)/2,offset:0,anchors:[`center`],priority:8,opacity:Math.min(t.bright,n.bright,1)*.95}))}if(B){let e=b.get(B.id);e?.onScreen&&i.push({key:`cond`,kind:`condchip`,text:B.text,x:e.sx,y:e.sy,offset:e.pxR*1.6+10,anchors:[`left`,`above`,`below`,`right`],priority:300,opacity:1,cls:B.ok?void 0:`false`,force:!0})}for(let[e,t]of z){let n=b.get(e);n?.onScreen&&t>0&&i.push({key:`b:`+e,kind:`badge`,text:`×${t}`,x:n.sx,y:n.sy,offset:n.pxR*1.6+8,anchors:[`above`,`right`,`below`],priority:290,opacity:1,force:!0})}if(re){let e=b.get(re.to);e?.onScreen&&e.data.valueText&&i.push({key:`read`,kind:`readchip`,text:e.data.valueText,x:e.sx,y:e.sy,offset:e.pxR+8,anchors:[`below`,`above`,`right`],priority:280,opacity:1,force:!0})}for(let t of ee){let n=t.trail.route,r=m?n.hops:(e-t.t0)/160,a=Math.min(n.hops,Math.floor(r)),o=b.get(n.nodes[a]);if(!o?.onScreen)continue;let s=t.trail.role!==`declared`,c=a>=n.hops,l=s?`Shortest`:`Declared`,u=e=>e===1?`hop`:`hops`;i.push({key:`t:`+t.trail.role,kind:`trailchip`,text:c?`${l} · ${n.hops} ${u(n.hops)}`:`${l} · ${a} ${u(a)}…`,x:o.sx,y:o.sy,offset:o.pxR+10,anchors:s?[`above`,`right`,`left`,`below`]:[`below`,`left`,`right`,`above`],priority:270,opacity:1,color:Td(s?Md:jd),force:!0})}let w=[];for(let e of x)e.onScreen&&e.bright>.1&&w.push({x:e.sx,y:e.sy,r:(e.id===P?Math.max(e.pxR*2.4,e.pxR+7):Math.max(3,e.pxR*(e.data.kind===`pathway`?1.5:1)))+1});f.place(i,s,h,g,w,h<768?104:60)}function dt(e,t){h=Math.max(1,e),g=Math.max(1,t),n.setSize(h,g,!1),a.setSize(h,g)}return dt(e.clientWidth,e.clientHeight),V=requestAnimationFrame(it),{setScene:De,transitionTo:Oe,highlightRoutes:Le,clearRoutes:Re,playTrace:He,stopTrace:Ue,setActivation:ze,setSelection(e){P=e},focusNode:Pe,onPick(e){return se.add(e),()=>se.delete(e)},onHover(e){return ce.add(e),()=>ce.delete(e)},screenPosition(e){let t=b.get(e);return!t||!t.onScreen||t.sx<0||t.sy<0||t.sx>h||t.sy>g?null:{x:t.sx,y:t.sy}},setReducedMotion(e){m=e},stats(){return{fps:ge,frameMs:_e,drawCalls:n.info.render.calls,nodes:b.size,relations:C.size}},resize:dt,dispose(){ve=!0,cancelAnimationFrame(V),Ke.removeEventListener(`pointerdown`,Qe),Ke.removeEventListener(`pointermove`,$e),Ke.removeEventListener(`pointerup`,et),Ke.removeEventListener(`pointercancel`,et),Ke.removeEventListener(`pointerleave`,tt),Ke.removeEventListener(`wheel`,nt),window.removeEventListener(`keydown`,rt),window.removeEventListener(`pointerdown`,rt),f.dispose(),o.dispose(),s.dispose(),l.dispose(),c.dispose(),u.dispose(),n.dispose(),Ke.remove()},extras:{clock:p,playIntro(e){let t=p.now(),n=e?.speed??1;j={t0:t,speed:n,done:!1,end:t+(m?200:2700*n)};for(let e of b.values())e.ignite=t+(120+1580*e.rank)*n;for(let e of S.values()){let r=b.get(e.from)?.ignite??t,i=b.get(e.to)?.ignite??t;e.drawT0=m?Q:Math.max(r,i)+420*n,e.drawDur=480}},setInsets(e){a.setInsets(e)},setGhostsExpanded(e){k=e},setTracePaused(e){R&&(R.paused=e)},stepTrace:Ge,frameNodes:Fe,nudgeToward:Ie,home:()=>Me(!1,800),setLinkSource(t){oe=t,e.classList.toggle(`linking`,!!t)},burst(e){let t=b.get(e);t&&(t.burst=p.now(),t.burstScale=3)},onFrame(e){return le.add(e),()=>le.delete(e)},debugState(){let e=0;for(let t of b.values())Number.isFinite(t.pos.x+t.pos.y+t.pos.z)||e++;return{clock:p.now(),morphT:at.morphT,ghostState:[...b.values()].some(e=>e.data.ghosts?.length)?at.ghostExpanded?`expanded`:`rest`:`none`,labelsShown:f.labelsShown,labelRects:f.placed.filter(e=>e.kind===`lbl`).map(e=>({id:e.nodeId??e.key,x:e.x,y:e.y,w:e.w,h:e.h})),hovered:M,selected:P,cameraDistance:a.distance,visibleEdges:at.visibleEdges,dimOthers:M?Z(1,.55,N):1,introDone:j.done,traceIndex:R?.k??-1,trailHeads:at.trailHeads,nanPositions:e}},whenIdle(){return new Promise(e=>{let t=()=>{!E&&!R&&!a.busy&&j.done?e():requestAnimationFrame(t)};t()})},pointer:()=>de,neighbourInDirection(e,t,n,r){let i=b.get(e);if(!i)return null;let a=null,o=1/0;for(let s of r){let r=b.get(s);if(!r||!r.onScreen||s===e)continue;let c=r.sx-i.sx,l=r.sy-i.sy,u=Math.hypot(c,l)||1,d=(c*t+l*n)/u;if(d<.35)continue;let f=u*(2-d);f<o&&(o=f,a=s)}return a}}}};function Ld(e){let t=e.split(` · `).filter(e=>e.includes(`→`));if(t.length)return t[t.length-1].trim();let n=e.split(`→`);return n.length>=3?n.slice(1).join(`→`).trim():e}function $(e,t={},...n){let[r,...i]=e.split(`.`),[a,o]=(r??`div`).split(`#`),s=document.createElement(a);o&&(s.id=o),i.length&&(s.className=i.join(` `));for(let[e,n]of Object.entries(t))n!=null&&n!==!1&&(e.startsWith(`on`)&&typeof n==`function`?s.addEventListener(e.slice(2),n):e===`class`?s.className=[s.className,String(n)].filter(Boolean).join(` `):e===`style`?s.setAttribute(`style`,String(n)):n===!0?s.setAttribute(e,``):s.setAttribute(e,String(n)));for(let e of n)e!=null&&e!==!1&&s.append(typeof e==`number`?String(e):e);return s}function Rd(e){let t=document.getElementById(e);if(!t)throw Error(`#${e} missing`);return t}function zd(e){for(;e.firstChild;)e.firstChild.remove()}function Bd(e){if(!(e instanceof HTMLElement))return!1;if(e.isContentEditable||e.tagName===`TEXTAREA`||e.tagName===`SELECT`)return!0;if(e.tagName===`INPUT`){let t=e.type;return![`checkbox`,`radio`,`range`,`button`,`submit`].includes(t)}return!1}var Vd=0;function Hd(e){let t=document.getElementById(`announcer`);t&&(window.clearTimeout(Vd),t.textContent=``,Vd=window.setTimeout(()=>t.textContent=e,30))}var Ud=(e,t=16)=>{let n=document.createElementNS(`http://www.w3.org/2000/svg`,`svg`);return n.setAttribute(`viewBox`,`0 0 16 16`),n.setAttribute(`width`,String(t)),n.setAttribute(`height`,String(t)),n.setAttribute(`aria-hidden`,`true`),n.setAttribute(`focusable`,`false`),n.innerHTML=e,n},Wd={route:`<circle cx="3.5" cy="12.5" r="1.8" fill="currentColor"/><circle cx="12.5" cy="3.5" r="1.8" fill="currentColor"/><path d="M3.5 12.5C6 12.5 5 3.5 12.5 3.5" stroke="currentColor" stroke-width="1.4" fill="none"/>`,pathway:`<path d="M8 2v3M8 11v3" stroke="currentColor" stroke-width="1.4"/><path d="M8 5l3 3-3 3-3-3z" stroke="currentColor" stroke-width="1.4" fill="none"/>`,results:`<circle cx="8" cy="8" r="1.8" fill="currentColor"/><circle cx="8" cy="8" r="4.2" stroke="currentColor" stroke-width="1.2" fill="none" opacity=".7"/><circle cx="8" cy="8" r="6.6" stroke="currentColor" stroke-width="1" fill="none" opacity=".4"/>`,close:`<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`};function Gd(e){return Number.isInteger(e)?String(e):e.toFixed(Math.abs(e)<.01?4:2).replace(/\.?0+$/,``)}function Kd(e){return e===null?`—`:typeof e==`number`?Gd(e):typeof e==`boolean`?e?`true`:`false`:e}var qd=class{graph;constructor(e){this.graph=e}refresh(){}unitFor(e,t){return(e.units?.[t]??e.units?.[`*`]??``).trim()}sharedUnit(e,t){let n=new Set;for(let r of e){let e=this.graph.findByLabel(r),i=e?this.unitFor(e,t):``;i&&n.add(i)}return n.size===1?[...n][0]:``}show(e,t,n=L(e,t)){let r=Kd(n);if(typeof n!=`number`)return r;let i=this.unitFor(e,t);return i?`${r}\u00a0${i}`:r}};function Jd(e,t){if(!t)return e;let[n,...r]=e.split(`→`);if(!n)return e;let i=n.split(/(\s(?:<=|>=|==|!=|<|>|\+|-)\s)/).map(e=>/^\s*-?\d+(\.\d+)?\s*$/.test(e)?`${e.trim()}\u00a0${t} `:e).join(``).replace(/\s+/g,` `).trim();return r.length?`${i} →${r.join(`→`)}`:i}function Yd(e,t=7){let n=e.length<=t?e:[...e.slice(0,3),`…`,...e.slice(-3)];return n.map((e,t)=>t===0?e:`${t>=n.length-2?`\xA0`:` `}→\u00a0${e}`).join(``)}function Xd(e){return`${e} ${e===1?`hop`:`hops`}`}function Zd(e,t,n=t+`s`){return`${e} ${e===1?t:n}`}function Qd(e){return e===0?`not at all`:e===1?`once`:e===2?`twice`:`${e} times`}function $d(e){return e.length<=1?e.join(``):`${e.slice(0,-1).join(`, `)} and ${e[e.length-1]}`}function ef(e,t){return e.getNode(t)?.label??t}var tf={concept:`thing`,variable:`variable`,file:`file`,note:`note`,pathway:`pathway step`},nf={cook:`#FF9F5A`,physicist:`#6FD3FF`,child:`#FF7EC8`},rf=[`#FF9F5A`,`#6FD3FF`,`#FF7EC8`,`#B8A6FF`,`#7CF0A0`,`#FFD36E`];function af(e,t){return e.accent??nf[e.id]??rf[t%rf.length]??`#FF9F5A`}var of=[{key:`relates`,label:`relates`,input:{type:`association`}},{key:`is-a`,label:`is-a`,input:{type:`association`,label:`is-a`}},{key:`part-of`,label:`part-of`,input:{type:`part-of`,label:`part-of`}},{key:`references`,label:`references`,input:{type:`association`,label:`references`}},{key:`next`,label:`next`,input:{type:`chain`,label:`next`}}];function sf(e){return e.type===`flow`?`flow`:e.type===`shortcut`?`shortcut`:e.type===`chain`?`next`:e.type===`part-of`?`part-of`:e.type===`causes`?`causes`:e.label===`is-a`||e.label===`reads`||e.label===`references`?e.label:`relates`}function cf(e,t){let n=sf(e),r=e.from===t;return n===`reads`?r?`reads`:`read by`:n===`references`?r?`references`:`referenced by`:n===`flow`?`flow`:n===`next`?`next`:n}var lf=class{cache=new Map;graph;units;constructor(e,t){this.graph=e,this.units=t}reset(){this.cache.clear()}positions(e){let t=this.cache.get(e),n=this.graph.nodes();if(!t||n.some(e=>!t.has(e.id))){let r=ie(this.graph,e);if(!t)t=r;else for(let e of n)t.has(e.id)||t.set(e.id,r.get(e.id)??{x:0,y:0,z:0});this.cache.set(e,t)}let r=this.graph.getPerspective(e)?.positions??{};for(let[e,n]of Object.entries(r))n&&t.set(e,n);return t}birthplace(e,t){let n={},r=t?this.graph.relationsOf(t).length+1:0,i=Math.max(18,2.5*(1.6+.45*Math.sqrt(r)+1.6+.45));for(let r of this.graph.perspectives()){let a=this.positions(r.id),o=(t?a.get(t):void 0)??{x:0,y:0,z:0},s=Gu(e+r.id)*Math.PI*2,c=(Gu(r.id+e)-.5)*.6,l=o,u=-1;for(let t of[1,1.35,1.7,2.1,2.6,3.2]){for(let n=0;n<8;n++){let r=s+n*Math.PI/4,d=i*t,f={x:o.x+Math.cos(r)*d,y:o.y+Math.sin(r)*d,z:o.z+c*d*.3},p=1/0;for(let[t,n]of a)t!==e&&(p=Math.min(p,Math.hypot(n.x-f.x,n.y-f.y)));p>u&&(u=p,l=f)}if(u>=14)break}n[r.id]={x:uf(l.x),y:uf(l.y),z:uf(l.z)}}return n}build(e){let t=this.graph,n=t.perspectives(),r=this.positions(e),i={};n.forEach((e,t)=>i[e.id]=af(e,t));let a=t.nodes().map(t=>this.sceneNode(t,e,n,r)),o=n.length;return{perspective:e,nodes:a,relations:R(t,e).map(e=>({id:e.id,from:e.from,to:e.to,type:e.type,weight:e.weight,directed:e.directed,look:sf(e),lensOnly:!!e.perspectives&&e.perspectives.length<o,chip:e.type===`flow`?e.label:void 0})),lensColors:i}}sceneNode(e,t,n,r){let i={id:e.id,label:e.label,kind:e.kind,valueText:e.kind===`pathway`?``:this.units.show(e,t),position:r.get(e.id)??{x:0,y:0,z:0}};if(e.pathway&&(i.op=e.pathway.op),e.kind!==`pathway`&&n.length>1&&te(e,n)){let r=ee(e,n).filter(e=>e.perspective!==t);i.ghosts=r,i.ghostText={};for(let t of r)i.ghostText[t.perspective]=this.units.show(e,t.perspective,t.value)}return i}valueText(e,t){return this.units.show(e,t,L(e,t))}},uf=e=>Math.round(e*100)/100,df=new Map;function ff(e,t={}){let n=Rd(`toasts`);t.key&&df.get(t.key)?.dismiss();let r=$(`div.toast`,{});t.error&&r.classList.add(`err`),t.actions?.length||r.classList.add(`plain`),r.append($(`span`,{},e));let i=0,a=()=>{window.clearTimeout(i),r.isConnected&&(r.classList.add(`leaving`),window.setTimeout(()=>r.remove(),170),t.key&&df.get(t.key)?.el===r&&df.delete(t.key))};for(let e of t.actions??[])r.append($(`button.btn.small`,{type:`button`,onclick:()=>{a(),e.run()}},e.label));for(;n.children.length>=3;)n.firstElementChild?.remove();n.append(r);let o=t.timeout??4200;o>0&&(i=window.setTimeout(a,o));let s={el:r,dismiss:a};return t.key&&df.set(t.key,s),s}function pf(e){df.get(e)?.dismiss()}function mf(e,t){return new Promise(n=>{let r=$(`dialog.confirm.panel`,{"aria-labelledby":`confirm-msg`}),i=$(`p#confirm-msg`,{},e),a=$(`div.row.end.wrap`,{});for(let e of t)a.append($(`button.btn${e.kind?`.`+e.kind:``}`,{type:`button`,onclick:()=>o(e.value)},e.label));r.append($(`div.inner`,{},i,a));let o=e=>{r.close(),r.remove(),n(e)};r.addEventListener(`cancel`,e=>{e.preventDefault(),o(``)}),document.body.append(r),r.showModal(),a.lastElementChild?.focus()})}var hf=[[`1 / 2 / 3`,`Switch lens`],[`/`,`Focus search`],[`Esc`,`Clear search or route, close the panel, cancel link mode`],[`← ↑ → ↓`,`Move to the nearest neighbour in that direction`],[`[ / ]`,`Cycle through neighbours`],[`Enter / F`,`Open the inspector / fly to the selection`],[`N`,`Store a thing`],[`L`,`Link the selection to another light`],[`R / P`,`Route drawer / Pathways drawer`],[`Space / S`,`Run or pause / step the pathway`],[`D (hold)`,`Expand every ghost with its value`],[`Home`,`Reset the camera`],[`Ctrl/⌘ + Z`,`Undo the last change`],[`Ctrl/⌘ + E`,`Export`],[`?`,`This key map`]];function gf(){if(document.querySelector(`dialog.keymap`))return;let e=$(`dialog.keymap.panel`,{"aria-labelledby":`keymap-title`}),t=$(`table`,{}),n=$(`tbody`,{});for(let[e,t]of hf)n.append($(`tr`,{},$(`td`,{},e),$(`td`,{},t)));t.append(n);let r=$(`button.btn`,{type:`button`,onclick:()=>i()},`Close`);e.append($(`div.inner`,{},$(`h2#keymap-title`,{style:`font-size:19px;font-weight:700`},`Key map`),t,$(`div.row.end`,{},r)));let i=()=>{e.close(),e.remove()};e.addEventListener(`cancel`,e=>{e.preventDefault(),i()}),document.body.append(e),e.showModal(),r.focus()}var _f=`modulepreload`,vf=function(e,t){return new URL(e,t).href},yf={},bf=function(e){return e.pathname.endsWith(`.css`)},xf=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},Sf=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=vf(t,n);let r=s(t),i=bf(r);return xf(yf,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:_f,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{let i=a=>{t.removeEventListener(`load`,i),t.removeEventListener(`error`,i),a.type===`error`?n(Error(`Unable to preload CSS for ${r}`)):e(a)};t.addEventListener(`load`,i),t.addEventListener(`error`,i)})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Cf=class{lens;selected=null;inspectorOpen=!1;drawerTab=null;query=``;retrieval=null;route=null;routeFrom=``;routeTo=``;runs=new Map;activePathway=null;playing=null;speed=1;persistent=!0;reduced;linkSource=null;units;builder;extras;undoStack=[];refreshQueued=!1;morphing=Promise.resolve();panels;onChange=()=>{};graph;renderer;seedIds;seedDoc;constructor(e,t,n,r,i){if(this.graph=e,this.renderer=t,this.seedIds=n,this.seedDoc=r,this.reduced=i,this.units=new qd(e),this.builder=new lf(e,this.units),!t.extras)throw Error(`renderer extras missing`);this.extras=t.extras,this.lens=e.getPerspective(e.meta.defaultPerspective)?e.meta.defaultPerspective:e.perspectives()[0]?.id??`base`,this.activePathway=e.meta.featured?.pathway??Ge(e)[0]?.id??null,e.on(e=>{e.type===`reset`?this.onReset():this.queueRefresh()}),t.onPick(e=>{this.linkSource?e&&e!==this.linkSource&&this.linkPicked?.(e):this.select(e,{fly:!!e,open:!!e})}),this.applyLensCss()}linkPicked=null;hub(){let e,t=-1;for(let n of this.graph.nodes()){let r=this.graph.relationsOf(n.id).length;r>t&&(t=r,e=n)}return e}lensLabel(e=this.lens){return this.graph.getPerspective(e)?.label??e}lensCss(e){let t=this.graph.perspectives(),n=t.findIndex(t=>t.id===e),r=t[n];return r?af(r,n):`#FF9F5A`}visibleCount(){return R(this.graph,this.lens).length}statsText(){let e=this.graph.nodes().length,t=this.visibleCount();return`${e} ${e===1?`light`:`lights`} · ${t} ${t===1?`line`:`lines`}`}valueText(e,t=this.lens){return this.units.show(e,t)}storedCount(){return this.graph.nodes().filter(e=>!this.seedIds.has(e.id)).length}queueRefresh(){this.refreshQueued||(this.refreshQueued=!0,queueMicrotask(()=>{this.refreshQueued=!1,this.refresh()}))}refresh(){this.units.refresh(),this.selected&&!this.graph.getNode(this.selected)&&this.select(null,{fly:!1,open:this.inspectorOpen}),this.renderer.setScene(this.builder.build(this.lens)),this.renderer.setSelection(this.selected),this.query&&this.runSearch(this.query,!1),this.renderAll()}onReset(){this.builder.reset(),this.units.refresh(),this.graph.getPerspective(this.lens)||(this.lens=this.graph.meta.defaultPerspective),this.selected=null,this.route=null,this.runs.clear(),this.playing=null,this.retrieval=null,this.undoStack=[],this.activePathway=this.graph.meta.featured?.pathway??Ge(this.graph)[0]?.id??null,this.renderer.stopTrace(),this.renderer.clearRoutes(),this.renderer.setActivation(null),this.renderer.setSelection(null),this.renderer.setScene(this.builder.build(this.lens)),this.extras.playIntro({speed:.5}),this.extras.home(),this.applyLensCss(),this.query&&this.runSearch(this.query,!1),this.renderAll()}renderAll(){this.panels?.renderTopbar(),this.panels?.renderDrawer(),this.panels?.renderInspector(),document.getElementById(`stage`)?.setAttribute(`aria-label`,`Constellation memory, ${this.lensLabel()} lens, ${this.statsText().replace(` · `,`, `)}.`),this.onChange()}applyLensCss(){document.documentElement.style.setProperty(`--lens`,this.lensCss(this.lens))}setLens(e){return e===this.lens||!this.graph.getPerspective(e)||(this.lens=e,this.applyLensCss(),this.morphing=this.renderer.transitionTo(this.builder.build(e),{durationMs:this.reduced?0:1e3}),this.playing&&this.stopRun(),this.query&&this.runSearch(this.query,!1),this.route&&this.findRoute(this.route.fromId,this.route.toId),this.renderAll(),Hd(`${this.lensLabel()} lens. ${this.statsText()}.`)),this.morphing}select(e,t={}){this.selected=e&&this.graph.getNode(e)?e:null,this.renderer.setSelection(this.selected),t.open!==void 0&&(this.inspectorOpen=t.open||this.inspectorOpen&&!!this.selected),this.selected&&t.fly&&this.renderer.focusNode(this.selected),this.panels?.renderInspector(),this.onChange(),this.selected&&Hd(this.describe(this.selected))}describe(e){let t=this.graph.getNode(e);if(!t)return``;let n=this.graph.perspectives(),r=`${this.lensLabel()}: ${this.valueText(t)}`,i=n.filter(e=>e.id!==this.lens).map(e=>({p:e,v:this.units.show(t,e.id)})).filter(e=>e.v!==this.valueText(t)),a=this.graph.relationsOf(e).filter(e=>!e.perspectives||e.perspectives.includes(this.lens)).length,o=i.length?` Disagrees: ${i.map(e=>`${e.p.label} ${e.v}`).join(`, `)}.`:``;return`${t.label}, ${t.kind}. ${r}.${o} ${a} ${a===1?`line`:`lines`}.`}neighbours(e){let t=[];for(let n of this.graph.relationsOf(e)){if(n.perspectives&&!n.perspectives.includes(this.lens))continue;let r=n.from===e?n.to:n.from;t.includes(r)||t.push(r)}return t}runSearch(e,t=!0){this.query=e;let n=e.trim();if(!n){this.retrieval=null,this.renderer.setActivation(null),this.panels?.renderDrawer(),this.onChange();return}performance.mark(`search-start`);let r=W(this.graph,n,{perspective:this.lens,decay:.55});this.retrieval=r,this.renderer.setActivation(r.activations.length?r.activations:null);let i=r.activations.filter(e=>e.depth<=1).map(e=>e.nodeId),a=i.filter(e=>this.renderer.screenPosition(e)).length;i.length&&a<i.length/2&&this.extras.frameNodes(i),performance.mark(`search-end`),performance.measure(`search`,`search-start`,`search-end`),t&&this.drawerTab!==`results`&&this.openDrawer(`results`,!1),this.panels?.renderDrawer(),this.onChange()}activationCounts(){if(!this.retrieval)return null;let e=[0,0,0,0];for(let t of this.retrieval.activations)e[t.depth]=(e[t.depth]??0)+1;return e}clearSearch(){let e=document.getElementById(`search`);e&&(e.value=``),this.runSearch(``,!1)}openDrawer(e,t=!0){this.drawerTab=e,this.panels?.renderDrawer(),t&&document.querySelector(`#drawer [data-tab="${e}"]`)?.focus(),this.onChange()}closeDrawer(){this.drawerTab=null,this.panels?.renderDrawer(),this.onChange()}closeInspector(){this.inspectorOpen=!1,this.panels?.renderInspector(),this.onChange()}findRoute(e,t){let n=this.graph,r=ef(n,e),i=ef(n,t),a=he(n,e,t,{perspective:this.lens}),o=``,s=``,c=``;if(a.shortest){let r=a.shortest;if(!a.declared)s=`No declared chain between these, so this is the shortest only.`;else if(a.savedHops>0){let e=Math.round(a.savedHops/a.declared.hops*100);o=`${Xd(a.declared.hops)} → ${Xd(r.hops)} · ${e}% shorter`}else o=`The declared chain is already the shortest: ${Xd(r.hops)}.`;let i=he(n,e,t).shortest;if(i&&i.hops<r.hops){let e=i.relations.map(e=>n.getRelation(e)).filter(e=>!!e&&!!e.perspectives&&!e.perspectives.includes(this.lens))[0];if(e){let t=(e.perspectives??[]).map(e=>this.lensLabel(e));s=`${ef(n,e.from)}–${ef(n,e.to)} is invisible to the ${this.lensLabel()}, so the shortcut is longer here. It exists for ${$d(t.map(e=>`the `+e))}.`}}let c=[];a.declared&&a.declared.hops!==r.hops&&c.push({route:a.declared,role:`declared`}),c.push({route:r,role:`shortest`}),this.renderer.highlightRoutes(c),this.extras.frameNodes([...new Set(c.flatMap(e=>e.route.nodes))])}else{let a=[e,t].find(e=>this.neighbours(e).length===0),o=n.perspectives().find(r=>r.id!==this.lens&&he(n,e,t,{perspective:r.id}).shortest);c=`No route from ${r} to ${i} under ${this.lensLabel()}.`,a&&(c+=` ${ef(n,a)} has no visible lines in this lens.`),o&&(c+=` Try ${o.label}.`),this.renderer.clearRoutes()}return this.route={fromId:e,toId:t,cmp:a,verdict:o,note:s,error:c,learned:!1},this.routeFrom=r,this.routeTo=i,this.panels?.renderDrawer(),this.onChange(),this.route}clearRoute(){this.route=null,this.renderer.clearRoutes(),this.panels?.renderDrawer(),this.onChange()}routeLabels(e){return Yd(e.nodes.map(e=>ef(this.graph,e)))}learn(){let e=this.route,t=e?.cmp.shortest;if(!e||!t||t.hops<2)return;let n=ge(this.graph,t),r=n.relation,i=ef(this.graph,t.nodes[0]),a=ef(this.graph,t.nodes[t.nodes.length-1]);if(!n.learned){ff(`${i} ↔ ${a} is already a shortcut.`,{key:`learn`,timeout:5e3});return}let o={kind:`shortest`,nodes:[r.from,r.to],relations:[r.id],hops:1,cost:1/r.weight};this.renderer.highlightRoutes([{route:o,role:`learned`}]);let s=he(this.graph,e.fromId,e.toId,{perspective:this.lens}),c=s.declared&&s.shortest?Math.round((s.declared.hops-s.shortest.hops)/s.declared.hops*100):0;this.route={...e,cmp:s,learned:!0,note:``,verdict:s.declared&&s.shortest?`${Xd(s.declared.hops)} → ${Xd(s.shortest.hops)} · ${c}% shorter`:e.verdict};let l=r.id,u=n.previous;this.pushUndo(`Learned ${i} ↔ ${a}`,()=>{this.graph.getRelation(l)&&(u?this.graph.updateRelation(l,{perspectives:u.perspectives}):this.graph.removeRelation(l))},`Forgot the shortcut ${i} ↔ ${a}.`),ff(`Learned: ${i} ↔ ${a}. Next time it's one hop.`,{key:`learn`,timeout:6e3,actions:[{label:`Undo`,run:()=>this.undo()}]}),this.panels?.renderDrawer()}pathways(){return Ge(this.graph)}pathwayKind(e){let t=qe(this.graph,e).map(e=>this.graph.getNode(e)?.pathway?.op);return t.includes(`while`)?`while loop`:t.includes(`if`)?`if / else`:`sequence`}stepText(e,t){let n=this.graph.getNode(e.nodeId)?.pathway?.expr;if(!n||e.op!==`if`&&e.op!==`while`&&e.op!==`assign`)return e.note;let r=[];try{r=Ie(Ae(n))}catch{return e.note}let i=this.units.sharedUnit(r,t);if(!i)return e.note;let a=e.note.split(` · `),o=a.pop()??``;return[...a,Jd(o,i)].join(` · `)}conditionChip(e,t){return Ld(this.stepText(e,t))}async run(e,t=!1){if(this.playing&&this.playing.id===e&&!t){this.togglePause();return}if(this.playing&&this.playing.id===e&&t){this.renderer.extras?.stepTrace(),this.playing.paused=!0,this.panels?.renderDrawer();return}this.stopRun(),this.activePathway=e;let n=this.lens,r=Ze(this.graph,e,n),i={id:e,lens:n,paused:t,index:-1,trace:r};this.playing=i,this.openDrawer(`pathways`,!1),this.panels?.renderDrawer();let a=qe(this.graph,e),o=a.flatMap(e=>{let t=this.graph.getNode(e)?.pathway?.source;return t?[t]:[]}),s=a.flatMap(e=>{let t=this.graph.getNode(e)?.pathway?.expr;if(!t)return[];try{return Ie(Ae(t)).flatMap(e=>this.graph.findByLabel(e)?.id??[])}catch{return[]}});if(await this.extras.frameNodes([...new Set([...a,...o,...s])]),this.playing!==i)return;let c=this.renderer.playTrace(r,{stepMs:this.speed===2?260:520,onStep:e=>{i.index=e,this.panels?.traceProgress(e),this.onChange()},conditionText:e=>this.conditionChip(e,n)});t&&this.extras.setTracePaused(!0),await c,this.playing===i&&this.finishRun(i)}finishRun(e){let t=this.record(e.trace,e.lens),n=this.runs.get(e.id);n||this.runs.set(e.id,n=new Map),n.set(e.lens,t),this.playing=null,this.panels?.renderDrawer(),this.onChange(),Hd(`${this.lensLabel(e.lens)}: ${t.trace.status===`ended`?Kd(t.trace.result):t.trace.error??`stopped`}`)}togglePause(){this.playing&&(this.playing.paused=!this.playing.paused,this.extras.setTracePaused(this.playing.paused),this.panels?.renderDrawer())}step(e=this.activePathway){e&&(this.playing?.id===e?(this.playing.paused=!0,this.extras.setTracePaused(!0),this.extras.stepTrace(),this.panels?.renderDrawer()):this.run(e,!0))}stopRun(){this.playing&&(this.playing=null,this.renderer.stopTrace())}record(e,t){let n=this.graph,r=this.lensLabel(t),i=e.steps.filter((t,n)=>t.op===`while`&&t.branch===`true`&&e.steps.slice(n+1).some(e=>e.nodeId===t.nodeId)).length,a=[];for(let t of e.steps){let e=n.getNode(t.nodeId)?.pathway;if(e){if(e.op===`read`&&e.source){let t=ef(n,e.source);a.includes(t)||a.push(t)}if(e.expr&&e.op!==`end`)try{for(let t of Ie(Ae(e.expr)))a.includes(t)||a.push(t)}catch{}}}let o=a.map(e=>{let r=n.findByLabel(e);return r?`${e} as ${this.units.show(r,t)}`:e}),s=e.status===`ended`?Kd(e.result):``,c=e.steps.some(e=>e.op===`while`),l;l=e.status===`ended`?c?`${r} reads ${$d(o)}, so the loop ran ${Qd(i)}.`:`${r} reads ${$d(o)}, so it ends: ${s}`:e.error??`Stopped after ${e.steps.length} visits.`;let u=s.replace(/\.$/,``);if(c){let t=Object.entries(e.vars).find(([,e])=>typeof e==`number`&&e===i);u=t?`${i} ${t[0]}`:`${i} loops`}return e.status!==`ended`&&(u=`stopped`),{trace:e,lens:t,loops:i,explanation:l,short:u}}comparison(e){let t=this.runs.get(e);if(!t||t.size<2)return``;let n=this.graph.perspectives().map(e=>e.id).filter(e=>t.has(e)),r=n.map(e=>`${this.lensLabel(e)}: ${t.get(e).short}`),i=new Set(n.map(e=>JSON.stringify(t.get(e).trace.result)));return`${r.join(` · `)}. ${i.size>1?`Same pathway, different truths.`:`Same pathway, same answer so far.`}`}store(e,t){let n=this.graph,r=n.addNode(e),i=this.builder.birthplace(r.id,t?.to??null);for(let e of n.perspectives()){let t=i[e.id];t&&n.updatePerspective(e.id,{positions:{...e.positions??{},[r.id]:t}})}let a=null;t&&(a=n.addRelation({from:r.id,to:t.to,...t.relation,weight:.6}));let o=r.id;this.pushUndo(`Stored ${r.label}`,()=>{n.getNode(o)&&n.removeNode(o)}),queueMicrotask(()=>{this.extras.burst(o),this.extras.nudgeToward(o,.3),this.select(o,{fly:!1,open:this.inspectorOpen})});let s=a?` · linked to ${ef(n,a.to)}`:``;return ff(`Stored "${r.label}"${s}.`,{key:`store`,actions:[{label:`Undo`,run:()=>this.undo()}],timeout:5e3}),r}link(e,t,n,r,i){let a=this.graph.addRelation({from:e,to:t,...n,weight:r,perspectives:i?[this.lens]:void 0}),o=a.id;return this.pushUndo(`Linked`,()=>{this.graph.getRelation(o)&&this.graph.removeRelation(o)}),ff(`Linked ${ef(this.graph,e)} → ${ef(this.graph,t)}${i?` (only for the ${this.lensLabel()})`:``}.`,{key:`link`,actions:[{label:`Undo`,run:()=>this.undo()}]}),a}async remove(e){let t=this.graph,n=t.getNode(e);if(!n)return;let r=t.relationsOf(e),i=t.nodes().filter(t=>t.pathway?.source===e||(t.pathway?.expr??``).includes(n.label));if(await mf(`Delete ${n.label} and its ${r.length} ${r.length===1?`line`:`lines`}?${i.length?` Pathways that read it will stop with an error.`:``}`,[{label:`Cancel`,value:``,kind:`ghost`},{label:`Delete`,value:`delete`,kind:`danger`}])!==`delete`)return;let a={id:n.id,label:n.label,kind:n.kind,value:n.value,facets:{...n.facets},units:n.units?{...n.units}:void 0,tags:[...n.tags],notes:n.notes,file:n.file,pathway:n.pathway},o=Object.fromEntries(t.perspectives().map(t=>[t.id,t.positions?.[e]])),s=r.map(e=>({id:e.id,from:e.from,to:e.to,type:e.type,weight:e.weight,directed:e.directed,branch:e.branch,label:e.label,perspectives:e.perspectives}));t.removeNode(e),this.pushUndo(`Deleted ${n.label}`,()=>{t.addNode(a);for(let n of t.perspectives()){let r=o[n.id];r&&t.updatePerspective(n.id,{positions:{...n.positions??{},[e]:r}})}for(let e of s)t.getNode(e.from)&&t.getNode(e.to)&&t.addRelation(e)}),ff(`Deleted ${n.label}.`,{key:`delete`,actions:[{label:`Undo`,run:()=>this.undo()}]})}pushUndo(e,t,n){this.undoStack.push({label:e,undo:t,done:n}),this.undoStack.length>50&&this.undoStack.shift()}undo(){let e=this.undoStack.pop();if(!e)ff(`Nothing to undo.`,{key:`undo`,timeout:2e3});else{if(e.undo(),pf(`learn`),this.route){let{fromId:e,toId:t}=this.route;queueMicrotask(()=>{this.graph.getNode(e)&&this.graph.getNode(t)?this.findRoute(e,t):this.clearRoute()})}ff(e.done??`Undone: ${e.label}.`,{key:`undo`,timeout:2400})}}exportFile(){let e=dt(this.graph),t=new Blob([e],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`constellation-memory.json`,document.body.append(r),r.click(),r.remove(),window.setTimeout(()=>URL.revokeObjectURL(n),1e3),ff(`Exported constellation-memory.json.`,{key:`export`,timeout:2600})}async importText(e,t){let n=lt(t);if(!n.ok)return ff(`${n.errors[0]?.message??`That file could not be read.`}${n.errors.length>1?` (${n.errors.length-1} more ${n.errors.length===2?`problem`:`problems`})`:``}`,{key:`import`,error:!0,timeout:9e3}),!1;let r=this.storedCount(),i=r?`Your ${r} stored ${r===1?`thing`:`things`} will be gone unless you export first.`:`Your current memory will be gone unless you export first.`,a=``;do a=await mf(`Replace your memory with "${e}"? ${i}`,[{label:`Cancel`,value:``,kind:`ghost`},{label:`Export first`,value:`export`},{label:`Replace`,value:`replace`,kind:`danger`}]),a===`export`&&this.exportFile();while(a===`export`);if(a!==`replace`)return!1;this.graph.load(n.doc);let o=n.doc.nodes.length,s=n.doc.relations.length;return ff(`Opened "${e}": ${o} ${o===1?`light`:`lights`}, ${s} ${s===1?`line`:`lines`}.`,{key:`import`}),!0}async openGuidebook(){let e=await Sf(()=>import(`./guidebook-CsyA52Nm.js`),[],import.meta.url),t=await this.importText(`the Guidebook`,JSON.stringify(e.default));return t&&this.graph.getNode(`g-start`)&&queueMicrotask(()=>this.select(`g-start`,{fly:!0,open:!0})),t}async resetToSeed(){let e=this.storedCount(),t=await mf(e?`Replace your memory with the seed? Your ${e} stored ${e===1?`thing`:`things`} will be gone unless you export first.`:`Replace your memory with the seed? Any changes you made will be gone unless you export first.`,[{label:`Cancel`,value:``,kind:`ghost`},{label:`Export first`,value:`export`},{label:`Replace`,value:`replace`,kind:`danger`}]);if(t===`export`)return this.exportFile(),this.resetToSeed();if(t!==`replace`)return;let n=st(this.seedDoc);n.ok&&this.graph.load(n.doc),ff(`The seed memory is back.`,{key:`reset`})}static parseValue(e){let t=e.trim();return t?/^-?\d+(\.\d+)?$/.test(t)?Number(t):t===`true`||t!==`false`&&e:null}resolve(e,t){return L(e,t)}stageEl(){return Rd(`stage`)}},wf=[{id:`route`,label:`Route`,key:`R`,icon:Wd.route},{id:`pathways`,label:`Pathways`,key:`P`,icon:Wd.pathway},{id:`results`,label:`Results`,icon:Wd.results}],Tf=class{app;el=Rd(`drawer`);head=$(`div.panel-head`,{});tabs=$(`div.tabs`,{role:`tablist`,"aria-label":`Instruments`});body=$(`div.panel-body`,{role:`tabpanel`,id:`drawer-panel`,tabindex:`-1`});handle=$(`button.handle`,{type:`button`,"aria-label":`Expand or collapse the panel`});datalist=$(`datalist#node-names`,{});lastTab=null;traceList=null;fromInput=null;toInput=null;peek=!1;onClose=()=>{};constructor(e){this.app=e;for(let t of wf){let n=$(`button.tab`,{type:`button`,role:`tab`,id:`tab-${t.id}`,"data-tab":t.id,"aria-controls":`drawer-panel`,"aria-selected":`false`,"aria-keyshortcuts":t.key,title:t.key?`${t.label} (${t.key})`:t.label},Ud(t.icon),$(`span.tab-label`,{},t.label));n.addEventListener(`click`,()=>{this.el.classList.contains(`rail`)&&this.el.classList.remove(`rail`),e.openDrawer(t.id,!1)}),this.tabs.append(n)}this.tabs.addEventListener(`keydown`,t=>{if(t.key!==`ArrowRight`&&t.key!==`ArrowLeft`)return;t.preventDefault(),t.stopPropagation();let n=wf[(wf.findIndex(t=>t.id===e.drawerTab)+(t.key===`ArrowRight`?1:wf.length-1))%wf.length];e.openDrawer(n.id,!0)});let t=$(`button.btn.icon.ghost.close`,{type:`button`,"aria-label":`Close the drawer`,title:`Close (Esc)`},Ud(Wd.close));t.addEventListener(`click`,()=>this.onClose()),this.handle.addEventListener(`click`,()=>{this.peek=!this.peek,this.el.classList.toggle(`peek`,this.peek)}),this.head.append(this.tabs,t),this.el.append(this.handle,this.head,this.body),document.body.append(this.datalist)}fillNames(){let e=this.app.graph.nodes().filter(e=>e.kind!==`pathway`).map(e=>e.label).sort((e,t)=>e.localeCompare(t,void 0,{numeric:!0})),t=e.join(`\0`);if(this.datalist.dataset.key!==t){this.datalist.dataset.key=t,zd(this.datalist);for(let t of e)this.datalist.append($(`option`,{value:t}))}}render(){let e=this.app.drawerTab;if(!e){this.el.hidden||(this.el.hidden=!0),this.lastTab=null;return}this.fillNames(),this.el.hidden=!1;for(let t of this.tabs.querySelectorAll(`.tab`)){let n=t.dataset.tab===e;t.setAttribute(`aria-selected`,String(n)),t.tabIndex=n?0:-1}this.body.setAttribute(`aria-labelledby`,`tab-${e}`);let t=this.body.contains(document.activeElement)?document.activeElement.dataset.focusKey:void 0,n=this.body.scrollTop;zd(this.body),e===`route`?this.renderRoute():e===`pathways`?this.renderPathways():this.renderResults(),t&&this.body.querySelector(`[data-focus-key="${t}"]`)?.focus(),this.lastTab===e&&(this.body.scrollTop=n),this.lastTab=e}renderRoute(){let e=this.app,t=e.graph,n=$(`form.route-form`,{autocomplete:`off`}),r=$(`input`,{id:`route-from`,list:`node-names`,value:e.routeFrom,placeholder:`A light…`,"data-focus-key":`from`,spellcheck:`false`}),i=$(`input`,{id:`route-to`,list:`node-names`,value:e.routeTo,placeholder:`Another light…`,"data-focus-key":`to`,spellcheck:`false`});this.fromInput=r,this.toInput=i,r.addEventListener(`input`,()=>e.routeFrom=r.value),i.addEventListener(`input`,()=>e.routeTo=i.value);let a=$(`p.err`,{id:`route-err`,role:`alert`});n.append($(`div.grid2`,{},$(`label.field`,{},$(`span`,{},`From`),r),$(`label.field`,{},$(`span`,{},`To`),i)));let o=t.meta.featured?.route;if(o&&t.getNode(o.from)&&t.getNode(o.to)){let a=ef(t,o.from),s=ef(t,o.to),c=$(`button.chipbtn`,{type:`button`,"data-focus-key":`try`},`Try the featured route: ${a} → ${s}`);c.addEventListener(`click`,()=>{r.value=e.routeFrom=a,i.value=e.routeTo=s,e.findRoute(o.from,o.to)}),n.append(c)}n.append(a,$(`button.btn.primary.wide`,{type:`submit`,"data-focus-key":`find`},`Find route`,$(`kbd`,{"aria-hidden":`true`},`Enter`))),n.addEventListener(`submit`,n=>{n.preventDefault();let o=t.findByLabel(r.value),s=t.findByLabel(i.value);!r.value.trim()||!i.value.trim()?a.textContent=`Name two lights: where to start and where to arrive.`:o?s?o.id===s.id?a.textContent=`Those are the same light. Pick two different ones.`:(a.textContent=``,e.findRoute(o.id,s.id)):a.textContent=`Nothing here is called "${i.value.trim()}". Pick a name from the list.`:a.textContent=`Nothing here is called "${r.value.trim()}". Pick a name from the list.`}),this.body.append(n);let s=e.route;if(!s)return;let c=$(`section.route-out`,{"aria-live":`polite`,"aria-label":`Route result`});if(s.error){c.append($(`p.empty`,{},s.error)),this.body.append(c);return}let l=$(`div.route-rows`,{}),u=s.cmp.shortest;if(u&&l.append(this.row(`var(--signal)`,!1,Xd(u.hops),e.routeLabels(u),`Shortest`)),s.cmp.declared&&(!u||s.cmp.declared.hops!==u.hops||s.learned)&&l.append(this.row(`var(--trail-long)`,!0,Xd(s.cmp.declared.hops),e.routeLabels(s.cmp.declared),`Declared chain`)),c.append(l),s.verdict&&c.append($(`p.verdict`,{id:`route-verdict`},s.verdict)),s.note&&c.append($(`p.note`,{},s.note)),u){let n=ef(t,u.nodes[0]),r=ef(t,u.nodes[u.nodes.length-1]),i=u.hops>=2,a=$(`span.sr-only`,{id:`learn-why`},`Already one hop. Nothing shorter to learn.`),o=$(`button.btn.signal.wide`,{type:`button`,"data-focus-key":`learn`,"aria-disabled":i?void 0:`true`,"aria-describedby":i?void 0:`learn-why`,title:i?`Add a direct line ${n} ↔ ${r}`:`Already one hop. Nothing shorter to learn.`},`Learn shortcut ${n} → ${r}`);o.addEventListener(`click`,()=>{i&&e.learn()}),c.append(o),i||c.append($(`p.hint`,{"aria-hidden":`true`},`Already one hop. Nothing shorter to learn.`),a)}this.body.append(c)}row(e,t,n,r,i){return $(`div.route-row`,{},$(`span.swatch${t?`.dotted`:``}`,{style:`--c:${e}`,"aria-hidden":`true`}),$(`span.hops`,{},$(`span.sr-only`,{},`${i}: `),n),$(`span.path`,{},r))}focusRouteFrom(){this.fromInput?.focus()}renderPathways(){let e=this.app,t=e.pathways();if(this.traceList=null,!t.length)this.body.append($(`p.empty`,{},`No pathways in this memory yet. A pathway starts at a pathway step with the op "start".`));else for(let n of t){let t=e.activePathway===n.id,r=e.playing?.id===n.id?e.playing:null,i=$(`section.pcard${t?`.active`:``}`,{"aria-labelledby":`pw-${n.id}`});i.addEventListener(`focusin`,()=>e.activePathway=n.id);let a=$(`button.btn.primary`,{type:`button`,"data-focus-key":`run-${n.id}`,"aria-keyshortcuts":`Space`},r?r.paused?`Resume`:`Pause`:`Run`,$(`kbd`,{"aria-hidden":`true`},`Space`));a.addEventListener(`click`,()=>{e.activePathway=n.id,e.run(n.id)});let o=$(`button.btn`,{type:`button`,"data-focus-key":`step-${n.id}`,"aria-keyshortcuts":`S`},`Step`,$(`kbd`,{"aria-hidden":`true`},`S`));o.addEventListener(`click`,()=>{e.activePathway=n.id,e.step(n.id)});let s=$(`div.seg`,{role:`group`,"aria-label":`Speed`});for(let t of[1,2]){let r=$(`button`,{type:`button`,"aria-pressed":String(e.speed===t),"data-focus-key":`speed-${n.id}-${t}`},`${t}×`);r.addEventListener(`click`,()=>{e.speed=t,this.render()}),s.append(r)}i.append($(`div`,{},$(`h3`,{id:`pw-${n.id}`},n.label),$(`p.sub`,{},e.pathwayKind(n.id))),$(`div.row.wrap`,{},a,o,s));let c=e.runs.get(n.id)?.get(e.lens),l=r?.trace??(t?c?.trace:void 0);if(l){let t=r?r.index:l.steps.length-1,n=$(`ol.trace`,{tabindex:`0`,"aria-label":`Trace under ${e.lensLabel(r?.lens??e.lens)}`});l.steps.forEach((i,a)=>{a>t||n.append(this.traceItem(i,a,a===t&&!!r,r?.lens??e.lens))}),i.append(n),r&&(this.traceList=n),queueMicrotask(()=>n.lastElementChild?.scrollIntoView({block:`nearest`}))}if(!r&&c){let t=$(`div.result`,{"aria-live":`polite`});c.trace.status===`ended`?t.append($(`p.out`,{},Kd(c.trace.result))):t.append($(`p.out.error`,{},c.trace.error??`The pathway stopped.`)),t.append($(`p.why`,{},c.explanation));let r=e.comparison(n.id);r&&t.append($(`p.compare`,{},r)),i.append(t)}else if(!r){let t=e.runs.get(n.id);if(t?.size){let r=e.comparison(n.id);i.append($(`p.note`,{},r||`Ran under ${[...t.keys()].map(t=>e.lensLabel(t)).join(`, `)}. Run it under the ${e.lensLabel()} to compare.`))}}this.body.append(i)}}traceItem(e,t,n,r){let i=this.app.stepText(e,r),a=`${n?`cur `:``}${e.branch===`true`?`t-true`:e.branch===`false`?`t-false`:``}`.trim(),o=$(`span.n`,{});return i.split(` · `).forEach((e,t)=>{t&&o.append(` · `),o.append($(`span.tseg`,{},e))}),$(`li`,{class:a||void 0,"aria-current":n?`step`:void 0},$(`span.i`,{"aria-hidden":`true`},String(t+1)),o)}traceProgress(e){let t=this.app,n=t.playing;if(!n||t.drawerTab!==`pathways`)return;if(!this.traceList||!this.traceList.isConnected){this.render();return}let r=this.traceList;for(r.querySelector(`li.cur`)?.classList.remove(`cur`),r.querySelector(`li[aria-current]`)?.removeAttribute(`aria-current`);r.children.length<=e;){let e=r.children.length,t=n.trace.steps[e];if(!t)break;r.append(this.traceItem(t,e,!1,n.lens))}let i=r.children[e];i?.classList.add(`cur`),i?.setAttribute(`aria-current`,`step`),i?.scrollIntoView({block:`nearest`})}renderResults(){let e=this.app,t=e.retrieval,n=e.query.trim();if(!n){this.body.append($(`p.empty`,{},`Ask the memory a word in the search field (/). Matches flare, and their neighbours light by how many hops away they are.`));return}if(!t||!t.matches.length){this.body.append($(`p.empty`,{role:`status`},`Nothing here remembers "${n}". Try a shorter word, or store it (N).`));return}let r=new Map;for(let e of t.activations){let t=r.get(e.depth)??[];t.push(e.nodeId),r.set(e.depth,t)}let i=e=>e===0?`Matches`:e===1?`1 hop`:`${e} hops`,a=[...r.keys()].sort((e,t)=>e-t);this.body.append($(`p.summary.sr-only`,{role:`status`},a.map(e=>`${i(e)} (${r.get(e).length})`).join(` · `)));for(let t of a){let n=r.get(t),a=t===0||t===1?1:t===2?.55:.3,o=$(`section.rgroup`,{"aria-label":`${i(t)}: ${Zd(n.length,`light`)}`});o.append($(`h3`,{},$(`span.lvl`,{style:`--a:${a}`,"aria-hidden":`true`}),`${i(t)} (${n.length})`));let s=$(`ul.rlist`,{});for(let t of n){let n=e.graph.getNode(t);if(!n)continue;let r=$(`button`,{type:`button`,"data-focus-key":`r-${t}`,title:`${n.label} · ${e.valueText(n)}`},n.label);r.addEventListener(`click`,()=>e.select(t,{fly:!0,open:!0})),s.append($(`li`,{},r))}o.append(s),this.body.append(o)}}},Ef=class{app;el=Rd(`inspector`);handle=$(`button.handle`,{type:`button`,"aria-label":`Expand or collapse the panel`});content=$(`div.insp`,{});peek=!1;onLink=()=>{};onClose=()=>{};constructor(e){this.app=e,this.handle.addEventListener(`click`,()=>{this.peek=!this.peek,this.el.classList.toggle(`peek`,this.peek)}),this.el.append(this.handle,this.content)}render(){let e=this.app;if(!e.inspectorOpen){this.el.hidden=!0;return}this.el.hidden=!1;let t=this.el.contains(document.activeElement)?document.activeElement.dataset.focusKey:void 0;zd(this.content);let n=$(`button.btn.icon.ghost.insp-close`,{type:`button`,"aria-label":`Close the inspector`,title:`Close (Esc)`,"data-focus-key":`close`},Ud(Wd.close));n.addEventListener(`click`,()=>this.onClose()),this.content.append(n);let r=e.selected,i=r?e.graph.getNode(r):void 0;if(!r||!i){this.content.append($(`div.panel-body`,{},$(`h2.sr-only`,{},`Inspector`),$(`p.empty`,{},`Nothing selected. Click a light, or press / and ask.`)));return}let a=e.graph,o=a.perspectives(),s=ee(i,o),c=s.map(t=>e.units.show(i,t.perspective,t.value)),l=new Set(c).size,u=$(`div.insp-title`,{},$(`h2`,{id:`insp-name`},i.label),$(`span.kindchip`,{},tf[i.kind]));this.content.append(u);let d=$(`div.panel-body`,{});if(i.kind!==`pathway`&&l>1&&d.append($(`p.disagree`,{},l===o.length?`${o.length} views disagree`:`${l} of ${o.length} views differ`)),i.kind===`pathway`&&i.pathway){let e=i.pathway,t=e.op===`read`&&e.source?`read ${e.target??``} ← ${ef(a,e.source)}`:e.expr?`${e.op}${e.target?` `+e.target+` ←`:``} ${e.expr}`:e.op;d.append($(`div.fileref`,{},t))}else{let t=$(`table.facets`,{},$(`caption.sr-only`,{},`Values of ${i.label} in each lens`)),n=$(`tbody`,{});s.forEach((t,r)=>{let i=t.perspective===e.lens;n.append($(`tr${i?`.active`:``}`,{"aria-current":i?`true`:void 0},$(`th`,{scope:`row`},$(`span.dot`,{style:`--c:${e.lensCss(t.perspective)}`,"aria-hidden":`true`}),e.lensLabel(t.perspective)),$(`td`,{},c[r]??`—`,t.own?null:$(`span.fallback`,{},`shared`))))}),t.append(n),d.append(t)}let f=a.relationsOf(r),p=f.filter(t=>!t.perspectives||t.perspectives.includes(e.lens)),m=f.filter(t=>t.perspectives&&!t.perspectives.includes(e.lens));if(m.length){let t=new Set;for(let n of m)for(let r of n.perspectives??[])t.add(e.lensLabel(r));d.append($(`p.hidden-lines`,{},`Hidden in this lens: ${Zd(m.length,`line`)} (${$d([...t])})`))}if(i.file){let e=i.file,t=[e.path??e.name,e.mime,e.sizeNote].filter(Boolean).join(` · `);d.append($(`div.fileref`,{},t,e.content?$(`div.content`,{},e.content):null))}i.notes&&d.append($(`p.notes`,{},i.notes)),i.tags.length&&d.append($(`div.tagsline`,{},...i.tags.map(e=>$(`span.kindchip`,{},`#${e}`))));let h=new Map;for(let e of p){let t=cf(e,r);h.set(t,[...h.get(t)??[],e])}let g=$(`section`,{"aria-labelledby":`insp-rel`});if(g.append($(`h3.section-title`,{id:`insp-rel`},`Relations (${p.length})`)),p.length){g.append($(`p.relgroups`,{},[...h].map(([e,t])=>`${e} ${t.length}`).join(` · `)));let t=$(`ul.nbrs`,{});for(let n of p.slice(0,40)){let i=n.from===r?n.to:n.from,o=$(`button`,{type:`button`,"data-focus-key":`n-${n.id}`},$(`span`,{},ef(a,i)),$(`span.rt`,{},cf(n,r)));o.addEventListener(`click`,()=>e.select(i,{fly:!0,open:!0})),t.append($(`li`,{},o))}g.append(t)}else g.append($(`p.empty`,{},`No lines under the ${e.lensLabel()}. In this lens, ${i.label} stands alone.`));d.append(g);let _=$(`button.btn`,{type:`button`,"data-focus-key":`link`,"aria-keyshortcuts":`L`},`Link`,$(`kbd`,{"aria-hidden":`true`},`L`));_.addEventListener(`click`,()=>this.onLink(r));let v=$(`button.btn`,{type:`button`,"data-focus-key":`route`},`Route from here`);v.addEventListener(`click`,()=>{e.routeFrom=i.label,e.openDrawer(`route`,!1),document.getElementById(`route-to`)?.focus()});let y=$(`button.btn`,{type:`button`,"data-focus-key":`fly`,"aria-keyshortcuts":`F`},`Fly to`,$(`kbd`,{"aria-hidden":`true`},`F`));y.addEventListener(`click`,()=>void e.renderer.focusNode(r));let b=$(`button.btn.danger`,{type:`button`,"data-focus-key":`delete`},`Delete`);b.addEventListener(`click`,()=>void e.remove(r)),d.append($(`div.actions`,{},_,v,y,b)),this.content.append(d),t&&this.content.querySelector(`[data-focus-key="${t}"]`)?.focus()}},Df=class{enabled=!1;ctx=null;audio(){if(!this.enabled)return null;if(!this.ctx){let e=window.AudioContext??window.webkitAudioContext;if(!e)return null;this.ctx=new e}return this.ctx.state===`suspended`&&this.ctx.resume(),this.ctx}tone(e,t,n,r=`sine`,i=0){let a=this.audio();if(!a)return;let o=a.currentTime+i/1e3,s=a.createOscillator(),c=a.createGain(),l=10**(n/20);s.type=r,s.frequency.value=e,c.gain.setValueAtTime(0,o),c.gain.linearRampToValueAtTime(l,o+.005),c.gain.exponentialRampToValueAtTime(1e-4,o+t/1e3),s.connect(c).connect(a.destination),s.start(o),s.stop(o+t/1e3+.02)}visit(e){this.tone(520*2**(e/12),60,-24)}falseBlip(){this.tone(300,70,-24,`triangle`)}result(){[0,4,7].forEach((e,t)=>this.tone(400*2**(e/12),400-t*60,-20,`sine`,t*40))}tick(e=0){this.tone(2e3,20,-30,`square`,e)}},Of=[{kind:`concept`,label:`Thing`},{kind:`variable`,label:`Variable`},{kind:`file`,label:`File`}],kf=500,Af=2e3,jf=class{app;dlg=null;returnFocus=null;constructor(e){this.app=e}get open(){return!!this.dlg?.open}show(e){if(this.dlg)return;let t=this.app;this.returnFocus=document.activeElement;let n=$(`dialog.sheet.panel`,{"aria-labelledby":`store-title`}),r=`concept`,i=``,a=$(`form`,{novalidate:!0,autocomplete:`off`}),o=$(`div.seg.kind`,{role:`radiogroup`,"aria-label":`Kind`}),s=$(`input`,{id:`store-name`,required:!0,maxlength:`120`,"aria-describedby":`store-name-err`,spellcheck:`false`}),c=$(`p.err`,{id:`store-name-err`,role:`alert`}),l=$(`input`,{id:`store-value`,"aria-describedby":`store-value-err`,spellcheck:`false`}),u=$(`p.err`,{id:`store-value-err`,role:`alert`}),d=$(`input`,{type:`checkbox`,id:`store-same`,checked:!0}),f=$(`fieldset.filebox`,{style:`border:0;padding:0;margin:0;display:none;flex-direction:column;gap:12px`}),p=$(`input`,{id:`store-path`,placeholder:`/home/notes/idea.txt`,spellcheck:`false`}),m=$(`input`,{id:`store-mime`,placeholder:`text/plain`}),h=$(`input`,{id:`store-size`,placeholder:`2 KB`}),g=$(`textarea`,{id:`store-content`,maxlength:String(Af),rows:`4`}),_=$(`input`,{id:`store-link`,list:`node-names`,spellcheck:`false`,value:e?ef(t.graph,e):``}),v=$(`p.err`,{id:`store-link-err`,role:`alert`}),y=$(`select`,{id:`store-link-type`});for(let e of of)y.append($(`option`,{value:e.key},e.label));let b=e=>{r=e;for(let t of o.querySelectorAll(`button`)){let n=t.dataset.kind===e;t.setAttribute(`aria-checked`,String(n)),t.classList.toggle(`on`,n),t.tabIndex=n?0:-1}f.style.display=e===`file`?`flex`:`none`};for(let e of Of){let t=$(`button`,{type:`button`,role:`radio`,"data-kind":e.kind},e.label);t.addEventListener(`click`,()=>b(e.kind)),o.append(t)}o.addEventListener(`keydown`,e=>{if(e.key!==`ArrowRight`&&e.key!==`ArrowLeft`)return;e.preventDefault();let t=Of[(Of.findIndex(e=>e.kind===r)+(e.key===`ArrowRight`?1:Of.length-1))%Of.length];b(t.kind),o.querySelector(`[data-kind="${t.kind}"]`)?.focus()});let x=$(`span`,{},`Value under ${t.lensLabel()}`);f.append($(`legend.sr-only`,{},`File reference`),$(`label.field`,{},$(`span`,{},`Path`),p),$(`div.grid2`,{},$(`label.field`,{},$(`span`,{},`Type`),m),$(`label.field`,{},$(`span`,{},`Size note`),h)),$(`label.field`,{},$(`span`,{},`Contents (up to ${Af.toLocaleString(`en`)} characters, optional)`),g));let S=$(`button.btn.ghost`,{type:`button`},`Cancel`);S.addEventListener(`click`,()=>this.close()),a.append($(`div.field`,{},$(`span`,{id:`kind-label`},`Kind`),o),$(`label.field`,{},$(`span`,{},`Name`),s),c,$(`label.field`,{},x,l),u,$(`label.check`,{},d,$(`span`,{},`Same in every lens`)),f,$(`div.grid2`,{},$(`label.field`,{},$(`span`,{},`Link to`),_),$(`label.field`,{},$(`span`,{},`As`),y)),v,$(`div.row.end`,{},S,$(`button.btn.primary`,{type:`submit`},`Store it`))),b(`concept`),s.addEventListener(`input`,()=>{c.textContent=``,s.removeAttribute(`aria-invalid`),i=``}),l.addEventListener(`input`,()=>{u.textContent=l.value.length>kf?`Values hold up to 500 characters. Put longer text in a File.`:``}),a.addEventListener(`submit`,e=>{e.preventDefault();let n=s.value.trim();if(!n){c.textContent=`Give it a name, even one word.`,s.setAttribute(`aria-invalid`,`true`),s.focus();return}let a=t.graph.findByLabel(n);if(a&&i!==n){c.textContent=`There's already a "${a.label}". Store another anyway?`,i=n,s.focus();return}if(l.value.length>kf){u.textContent=`Values hold up to 500 characters. Put longer text in a File.`,l.focus();return}let o=null;if(_.value.trim()){let e=t.graph.findByLabel(_.value);if(!e){v.textContent=`Nothing here is called "${_.value.trim()}". Pick a name from the list, or leave it empty.`,_.focus();return}let n=of.find(e=>e.key===y.value)??of[0];o={to:e.id,relation:n.input}}let f=Cf.parseValue(l.value),b={label:n,kind:r,tags:[]};if(d.checked?b.value=f:(b.value=null,b.facets={[t.lens]:f}),r===`file`){let e={name:n};p.value.trim()&&(e.path=p.value.trim()),m.value.trim()&&(e.mime=m.value.trim()),h.value.trim()&&(e.sizeNote=h.value.trim()),g.value&&(e.content=g.value.slice(0,Af)),b.file=e}try{t.store(b,o),this.close(!1)}catch(e){ff(e instanceof Error?e.message:String(e),{error:!0,key:`store-err`})}}),n.addEventListener(`cancel`,e=>{e.preventDefault(),this.close()}),n.append($(`h2.sheet-title`,{id:`store-title`},`Store a thing`),a),document.body.append(n),this.dlg=n,n.showModal(),s.focus()}close(e=!0){let t=this.dlg;t&&(t.close(),t.remove(),this.dlg=null,e&&this.returnFocus?.focus?.())}},Mf=class{app;bar=null;pop=null;constructor(e){this.app=e,e.linkPicked=e=>this.picked(e)}get active(){return!!this.app.linkSource}start(e){let t=this.app;this.cancel(),t.linkSource=e,t.extras.setLinkSource(e);let n=$(`input`,{id:`link-target`,list:`node-names`,placeholder:`or type a name…`,"aria-label":`Link to`,spellcheck:`false`,style:`height:32px;padding:0 10px;border-radius:8px;background:rgba(0,0,0,.45);border:1px solid var(--hairline-strong);color:var(--ink);width:170px`}),r=$(`button.btn.small`,{type:`button`},`Choose`),i=$(`button.btn.small.ghost`,{type:`button`},`Cancel`),a=()=>{let r=t.graph.findByLabel(n.value);r&&r.id!==e?this.picked(r.id):n.setAttribute(`aria-invalid`,`true`)};r.addEventListener(`click`,a),n.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),a())}),i.addEventListener(`click`,()=>this.cancel()),this.bar=$(`div.linkbar.panel`,{role:`group`,"aria-label":`Link mode`},$(`span`,{},`Linking from ${ef(t.graph,e)} · click a light`),n,r,i),document.body.append(this.bar),n.focus()}picked(e){let t=this.app,n=t.linkSource;if(!n)return;this.pop?.remove();let r=t.renderer.screenPosition(e)??{x:innerWidth/2,y:innerHeight/2},i=$(`select`,{id:`link-type`});for(let e of of)i.append($(`option`,{value:e.key},e.label));let a=$(`input`,{type:`checkbox`,id:`link-only`}),o=$(`input`,{type:`range`,id:`link-weight`,min:`0.2`,max:`1`,step:`0.1`,value:`0.6`,"aria-label":`Weight`}),s=$(`output`,{for:`link-weight`},`0.6`);o.addEventListener(`input`,()=>s.textContent=Number(o.value).toFixed(1));let c=$(`button.btn.primary`,{type:`submit`},`Link`),l=$(`button.btn.ghost`,{type:`button`},`Cancel`),u=$(`form.popover.panel`,{role:`dialog`,"aria-labelledby":`link-title`},$(`h2`,{id:`link-title`},`${ef(t.graph,n)} → ${ef(t.graph,e)}`),$(`label.field`,{},$(`span`,{},`Type`),i),$(`label.check`,{},a,$(`span`,{},`Only in this lens (${t.lensLabel()})`)),$(`div.field`,{},$(`span`,{id:`w-label`},`Weight`),$(`div.range`,{},o,s)),$(`div.row.end`,{},l,c));u.style.left=`${Math.min(innerWidth-316,Math.max(16,r.x+16))}px`,u.style.top=`${Math.min(innerHeight-280,Math.max(72,r.y-40))}px`,u.addEventListener(`submit`,r=>{r.preventDefault();let s=of.find(e=>e.key===i.value)??of[0];try{t.link(n,e,s.input,Number(o.value),a.checked)}catch(e){ff(e instanceof Error?e.message:String(e),{error:!0,key:`link-err`})}this.cancel()}),l.addEventListener(`click`,()=>this.cancel()),this.pop=u,document.body.append(u),i.focus()}escape(){return this.pop?(this.pop.remove(),this.pop=null,Rd(`link-target`).focus(),!0):this.app.linkSource?(this.cancel(),!0):!1}cancel(){this.pop?.remove(),this.pop=null,this.bar?.remove(),this.bar=null,this.app.linkSource&&(this.app.linkSource=null,this.app.extras.setLinkSource(null))}},Nf=class{app;lenses=Rd(`lenses`);stats=Rd(`stats`);search=Rd(`search`);menuBtn=Rd(`menu-open`);menu=Rd(`menu`);underline=$(`span.lens-underline`,{"aria-hidden":`true`});lensKey=``;soundOn=!1;onStore=()=>{};onImport=()=>{};onKeymap=()=>{};constructor(e){this.app=e;let t=0;this.search.addEventListener(`input`,()=>{cancelAnimationFrame(t),t=requestAnimationFrame(()=>e.runSearch(this.search.value))}),Rd(`search-form`).addEventListener(`submit`,t=>{t.preventDefault(),e.runSearch(this.search.value),e.openDrawer(`results`,!1),document.querySelector(`#drawer .rlist button`)?.focus()}),Rd(`store-open`).addEventListener(`click`,()=>this.onStore()),this.menuBtn.addEventListener(`click`,()=>this.menu.hidden?this.openMenu():this.closeMenu()),this.menu.addEventListener(`keydown`,e=>this.menuKeys(e)),document.addEventListener(`pointerdown`,e=>{this.menu.hidden||this.menu.contains(e.target)||e.target===this.menuBtn||this.menuBtn.contains(e.target)||this.closeMenu(!1)}),window.addEventListener(`resize`,()=>this.placeUnderline()),document.fonts?.ready.then(()=>this.placeUnderline()).catch(()=>{})}render(){let e=this.app,t=e.graph.perspectives(),n=t.map(e=>e.id+e.label).join(`|`);n!==this.lensKey&&(this.lensKey=n,zd(this.lenses),t.forEach((t,n)=>{let r=$(`button.lens-pill`,{type:`button`,"data-lens":t.id,"aria-pressed":`false`,"aria-keyshortcuts":n<9?String(n+1):void 0,title:t.description??`See the memory as the ${t.label}`,style:`--c:${e.lensCss(t.id)}`},$(`span.dot`,{"aria-hidden":`true`}),$(`span`,{},t.label),n<9?$(`kbd`,{"aria-hidden":`true`},String(n+1)):null);r.addEventListener(`click`,()=>void e.setLens(t.id)),this.lenses.append(r)}),this.lenses.append(this.underline));for(let t of this.lenses.querySelectorAll(`.lens-pill`))t.setAttribute(`aria-pressed`,String(t.dataset.lens===e.lens));this.stats.textContent=e.statsText(),this.placeUnderline()}placeUnderline(){let e=this.lenses.querySelector(`.lens-pill[aria-pressed="true"]`);e&&(this.underline.style.width=`${Math.max(12,e.offsetWidth-28)}px`,this.underline.style.transform=`translateX(${e.offsetLeft+14}px)`)}openMenu(){let e=this.app;zd(this.menu);let t=(e,t,n)=>{let r=$(`button`,{type:`button`,role:`menuitem`,tabindex:`-1`},$(`span`,{},e),n?$(`kbd`,{},n):null);return r.addEventListener(`click`,()=>{this.closeMenu(),t()}),r},n=$(`button`,{type:`button`,role:`menuitemcheckbox`,"aria-checked":String(this.soundOn),tabindex:`-1`},$(`span`,{},`Sound: ${this.soundOn?`on`:`off`}`));n.addEventListener(`click`,()=>{this.soundOn=!this.soundOn,this.closeMenu()}),this.menu.append(t(`Import…`,()=>this.onImport()),t(`Export`,()=>e.exportFile(),`Ctrl E`),t(`Open the Guidebook example`,()=>void e.openGuidebook()),t(`Reset to seed`,()=>void e.resetToSeed()),$(`hr`,{role:`separator`}),n,t(`Key map`,()=>this.onKeymap(),`?`)),this.menu.hidden=!1,this.menuBtn.setAttribute(`aria-expanded`,`true`),this.menu.querySelector(`[role^="menuitem"]`)?.focus()}closeMenu(e=!0){return!this.menu.hidden&&(this.menu.hidden=!0,this.menuBtn.setAttribute(`aria-expanded`,`false`),e&&this.menuBtn.focus(),!0)}get menuOpen(){return!this.menu.hidden}menuKeys(e){let t=[...this.menu.querySelectorAll(`[role^="menuitem"]`)],n=t.indexOf(document.activeElement);if(e.key===`ArrowDown`||e.key===`ArrowUp`){e.preventDefault();let r=t.length;t[(n+(e.key===`ArrowDown`?1:-1)+r)%r]?.focus()}else e.key===`Home`||e.key===`End`?(e.preventDefault(),t[e.key===`Home`?0:t.length-1]?.focus()):e.key===`Tab`&&this.closeMenu(!1)}},Pf=class{topbar;drawer;inspector;store;linker;sound=new Df;app;card=Rd(`hovercard`);saved=Rd(`saved`);savedHide=0;insets={left:0,right:0,top:0,bottom:0};insetTarget={left:0,right:0,top:0,bottom:0};insetFrom={left:0,right:0,top:0,bottom:0};insetT0=0;hintShown=!1;intro={t0:0,speed:1,stage:0,returning:!1};longPress=0;constructor(e){this.app=e,this.topbar=new Nf(e),this.drawer=new Tf(e),this.inspector=new Ef(e),this.store=new jf(e),this.linker=new Mf(e),e.panels=this,this.topbar.onStore=()=>this.store.show(e.selected??void 0),this.topbar.onImport=()=>Rd(`import-file`).click(),this.topbar.onKeymap=()=>gf(),this.drawer.onClose=()=>e.closeDrawer(),this.inspector.onClose=()=>e.closeInspector(),this.inspector.onLink=e=>this.linker.start(e),this.wireSoundToggle(),Rd(`import-file`).addEventListener(`change`,async t=>{let n=t.target,r=n.files?.[0];n.value=``,r&&e.importText(r.name,await r.text())}),document.addEventListener(`keydown`,e=>this.keydown(e)),document.addEventListener(`keyup`,t=>{(t.key===`d`||t.key===`D`)&&e.extras.setGhostsExpanded(!1)}),window.addEventListener(`blur`,()=>e.extras.setGhostsExpanded(!1)),window.addEventListener(`resize`,()=>this.layout()),e.renderer.onHover(e=>this.hover(e)),e.extras.onFrame(e=>this.frame(e));let t=Rd(`stage`);t.addEventListener(`pointerdown`,e=>{if(e.pointerType!==`touch`)return;let t=e.clientX,n=e.clientY;window.clearTimeout(this.longPress),this.longPress=window.setTimeout(()=>{let e=this.nodeAt(t,n);e&&this.linker.start(e)},450)});for(let e of[`pointerup`,`pointercancel`,`pointermove`])t.addEventListener(e,t=>{e===`pointermove`&&t.pointerType===`touch`&&Math.abs(t.movementX)+Math.abs(t.movementY)<3||window.clearTimeout(this.longPress)});let n=()=>{pf(`hint`),this.hintShown=!0};window.addEventListener(`pointerdown`,n,{once:!0}),window.addEventListener(`keydown`,n,{once:!0}),window.addEventListener(`wheel`,n,{once:!0,passive:!0})}nodeAt(e,t){let n=null,r=24;for(let i of this.app.graph.nodes()){let a=this.app.renderer.screenPosition(i.id);if(!a)continue;let o=Math.hypot(a.x-e,a.y-t);o<r&&(r=o,n=i.id)}return n}wireSoundToggle(){let e=this.app,t=e.renderer.playTrace.bind(e.renderer);e.renderer.playTrace=(e,n)=>t(e,{...n,onStep:t=>{n?.onStep?.(t),this.sound.enabled=this.topbar.soundOn;let r=e.steps[t];if(!r)return;let i=e.steps.slice(0,t).filter(e=>e.nodeId===r.nodeId&&e.op===`while`).length;r.branch===`false`?this.sound.falseBlip():this.sound.visit(i),t===e.steps.length-1&&window.setTimeout(()=>this.sound.result(),300)}});let n=e.renderer.highlightRoutes.bind(e.renderer);e.renderer.highlightRoutes=e=>{n(e),this.sound.enabled=this.topbar.soundOn;for(let t of e)t.role!==`learned`&&this.sound.tick(t.route.hops*160)}}renderTopbar(){this.topbar.render()}renderDrawer(){this.drawer.render(),this.layout()}renderInspector(){this.inspector.render(),this.layout()}traceProgress(e){this.drawer.traceProgress(e)}layout(){let e=this.app,t=innerWidth,n=t<768,r=!!e.drawerTab,i=e.inspectorOpen;document.body.classList.toggle(`body-inspector`,n&&i),document.body.classList.toggle(`body-sheet`,n&&(i||r)),this.drawer.el.classList.toggle(`rail`,!n&&t<1280&&r&&i);let a={left:0,right:0,top:0,bottom:0};if(n){let e=i?this.inspector.el:r?this.drawer.el:null;e&&!e.hidden&&(a.bottom=e.getBoundingClientRect().height),a.top=100}else r&&!this.drawer.el.hidden&&(a.left=this.drawer.el.getBoundingClientRect().right),i&&!this.inspector.el.hidden&&(a.right=t-this.inspector.el.getBoundingClientRect().left),a.top=56;let o=this.insetTarget;(o.left!==a.left||o.right!==a.right||o.bottom!==a.bottom||o.top!==a.top)&&(this.insetFrom={...this.insets},this.insetTarget=a,this.insetT0=performance.now())}startIntro(e,t){this.intro={t0:t,speed:e?.5:1,stage:0,returning:e},document.body.classList.add(`intro`),this.app.reduced&&(this.intro.speed=.08)}frame(e){let t=Math.min(1,(performance.now()-this.insetT0)/220),n=this.insetFrom,r=this.insetTarget,i=this.app.reduced?1:1-(1-t)**3,a={left:Z(n.left,r.left,i),right:Z(n.right,r.right,i),top:Z(n.top,r.top,i),bottom:Z(n.bottom,r.bottom,i)};(a.left!==this.insets.left||a.right!==this.insets.right||a.bottom!==this.insets.bottom||a.top!==this.insets.top)&&(this.insets=a,this.app.extras.setInsets(a));let o=this.intro;if(o.stage<3){let t=(e-o.t0)/o.speed;o.stage<1&&t>=1800&&(document.body.classList.add(`show-brand`),o.stage=1),o.stage<2&&t>=2400&&(document.body.classList.add(`show-tools`),o.stage=2),o.stage<3&&t>=3200&&(o.stage=3,document.body.classList.remove(`intro`),this.greet())}if(!this.card.hidden){let e=this.app.extras.pointer();e&&this.placeCard(e.x,e.y)}}greet(){let e=this.app;if(this.intro.returning){let t=e.graph.nodes().filter(t=>!e.seedIds.has(t.id)),n=e.graph.nodes().length,r=[...t].sort((e,t)=>t.created-e.created)[0];ff(t.length?`Welcome back. ${n} lights. The ${t.length} you stored ${t.length===1?`is`:`are`} where you left ${t.length===1?`it`:`them`}.`:`Welcome back. ${n} lights, as you left them.`,{key:`hint`,timeout:6e3,actions:r?[{label:`Show ${r.label}`,run:()=>e.select(r.id,{fly:!0,open:!0})}]:[]})}else if(!this.hintShown){let e=matchMedia(`(pointer: coarse)`).matches;ff(e?`Drag to look around · tap a light · tap search to ask.`:`Drag to look around · click a light · press / to ask.`,{key:`hint`,timeout:5800})}}savedConfirmed(){this.saved.classList.contains(`bad`)&&(this.saved.classList.remove(`bad`),this.saved.textContent=`Saved`,pf(`storage`)),window.clearTimeout(this.savedHide),this.saved.classList.add(`on`),this.savedHide=window.setTimeout(()=>this.saved.classList.remove(`on`),1200)}notSaved(){window.clearTimeout(this.savedHide),this.saved.textContent=`Not saved`,this.saved.classList.add(`on`,`bad`)}hover(e){let t=this.app,n=e?t.graph.getNode(e):void 0;if(!n||matchMedia(`(pointer: coarse)`).matches){this.card.hidden=!0;return}let r=n.kind===`pathway`?n.pathway?.expr??n.pathway?.op??``:t.valueText(n),i=t.graph.perspectives().filter(e=>e.id!==t.lens&&t.units.show(n,e.id)!==t.valueText(n)).length,a=[$(`span.h-name`,{},n.label),$(`span.h-kind`,{},tf[n.kind])];r&&r!==`—`&&a.push($(`span.h-val`,{},r)),i&&n.kind!==`pathway`&&a.push($(`span.h-more`,{},`+${i} other ${i===1?`view`:`views`}`)),this.card.replaceChildren(...a),this.card.hidden=!1;let o=t.extras.pointer();o&&this.placeCard(o.x,o.y)}placeCard(e,t){let n=this.card.getBoundingClientRect(),r=e+14+n.width>innerWidth-8?e-14-n.width:e+14,i=Math.min(innerHeight-n.height-8,Math.max(8,t+14));this.card.style.transform=`translate(${Math.round(r)}px, ${Math.round(i)}px)`}escape(e){let t=this.app;if(this.linker.escape()||this.topbar.closeMenu())return!0;let n=Rd(`search`);return e===n?(n.value?t.clearSearch():n.blur(),!0):t.query?(t.clearSearch(),!0):t.playing?(t.stopRun(),t.renderAll(),!0):t.route?(t.clearRoute(),!0):t.inspectorOpen?(t.closeInspector(),!0):t.drawerTab?(t.closeDrawer(),!0):t.selected?(t.select(null),!0):!1}keydown(e){let t=this.app;if(document.querySelector(`dialog[open]`))return;let n=Bd(e.target),r=e.ctrlKey||e.metaKey,i=e.key;if(i===`Escape`){this.escape(e.target)&&e.preventDefault();return}if(r&&(i===`e`||i===`E`)){e.preventDefault(),t.exportFile();return}if(r&&(i===`z`||i===`Z`)&&!n){e.preventDefault(),t.undo();return}if(n||r||e.altKey)return;let a=e.target instanceof HTMLElement&&e.target!==document.body&&e.target.matches(`button, a, [role="tab"], [role="menuitem"], summary, input, select, textarea`),o=t.selected,s=Number(i);if(Number.isInteger(s)&&s>=1&&s<=9){let n=t.graph.perspectives()[s-1];n&&(e.preventDefault(),t.setLens(n.id))}else switch(i){case`/`:e.preventDefault(),Rd(`search`).focus();return;case`?`:e.preventDefault(),gf();return;case`n`:case`N`:e.preventDefault(),this.store.show(o??void 0);return;case`l`:case`L`:o?(e.preventDefault(),this.linker.start(o)):ff(`Select a light first, then press L to link it.`,{key:`link-hint`,timeout:2600});return;case`r`:case`R`:e.preventDefault(),t.openDrawer(`route`,!1),this.drawer.focusRouteFrom();return;case`p`:case`P`:e.preventDefault(),t.openDrawer(`pathways`,!0);return;case`f`:case`F`:o&&t.renderer.focusNode(o);return;case`Home`:e.preventDefault(),t.extras.home();return;case`d`:case`D`:e.repeat||t.extras.setGhostsExpanded(!0);return;case`s`:case`S`:e.preventDefault(),t.step();return;case` `:if(a)return;e.preventDefault(),t.activePathway&&t.run(t.activePathway);return;case`Enter`:if(a)return;o&&(t.inspectorOpen=!0,this.renderInspector(),this.inspector.el.querySelector(`button`)?.focus());return;case`[`:case`]`:{if(!o)return;let e=this.cycleBase&&this.cycleBase!==o&&t.neighbours(this.cycleBase).includes(o)?this.cycleBase:o,n=t.neighbours(e);if(!n.length)return;let r=n.indexOf(o),a=i===`]`?1:-1,s=n[r<0?a>0?0:n.length-1:(r+a+n.length)%n.length];this.cycleBase=e,t.select(s,{fly:!1});return}case`ArrowLeft`:case`ArrowRight`:case`ArrowUp`:case`ArrowDown`:{if(a)return;e.preventDefault();let n={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[i];if(!o){let e=t.hub();e&&t.select(e.id,{fly:!1});return}let r=t.extras.neighbourInDirection(o,n[0],n[1],t.neighbours(o))??t.extras.neighbourInDirection(o,n[0],n[1],t.graph.nodes().map(e=>e.id));r&&t.select(r,{fly:!1});return}}}cycleBase=null};function Ff(e){let n=Math.max(10,Math.min(5e3,Math.floor(e))),r=2654435769,i=()=>{r=r+1831565813>>>0;let e=r;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296},a=[`concept`,`concept`,`variable`,`file`,`note`],o=[],s=[];for(let e=0;e<n;e++){let t=a[e%a.length],n=e%9==0;o.push({id:`s${e}`,label:e===0?`Memory`:`Point ${e}`,kind:t,value:t===`variable`?e:`value ${e}`,facets:n?{a:e,b:e*2,c:`${e} c`}:{},tags:[`c${e%8}`],created:0,updated:0,...t===`file`?{file:{name:`file-${e}.txt`,path:`/stress/file-${e}.txt`}}:{}})}let c=0,l=(e,t,n)=>{e!==t&&s.push({id:`sr${c++}`,from:`s${e}`,to:`s${t}`,type:`association`,weight:.4+i()*.6,directed:!1,created:0,...n?{perspectives:n}:{}})};for(let e=1;e<n;e++){let t=e-8>0?e-8:0;l(e,t),i()<.5&&l(e,Math.floor(i()*n),i()<.3?[`b`]:void 0)}let u=e=>{let t={};for(let r=0;r<n;r++){let n=r%8/8*Math.PI*2+e,a={x:Math.cos(n)*170,y:Math.sin(n*1.7)*70,z:Math.sin(n)*120},o=i()*2-1,s=i()*Math.PI*2,c=42*Math.cbrt(i()),l=Math.sqrt(1-o*o);t[`s${r}`]={x:If(a.x+Math.cos(s)*l*c),y:If(a.y+o*c),z:If(a.z+Math.sin(s)*l*c)}}return t};return{schema:t,version:1,meta:{title:`Stress: ${n} points`,defaultPerspective:`a`},perspectives:[{id:`a`,label:`Lens A`,accent:`#FF9F5A`,positions:u(0)},{id:`b`,label:`Lens B`,accent:`#6FD3FF`,positions:u(.6)},{id:`c`,label:`Lens C`,accent:`#FF7EC8`,positions:u(1.2)}],nodes:o,relations:s}}var If=e=>Math.round(e*100)/100,Lf=new URLSearchParams(location.search),Rf=Number(Lf.get(`stress`)??0)||0,zf=Lf.has(`seed`)&&Lf.get(`seed`)!==`0`,Bf=matchMedia(`(prefers-reduced-motion: reduce)`);function Vf(){try{let e=window.localStorage,t=`__constellation_probe`;return e.setItem(t,`1`),e.removeItem(t),e}catch{return null}}function Hf(){try{let e=document.createElement(`canvas`);return!!(e.getContext(`webgl2`)??e.getContext(`webgl`))}catch{return!1}}function Uf(e,t){let n=URL.createObjectURL(new Blob([t],{type:`application/json`})),r=$(`a`,{href:n,download:e});document.body.append(r),r.click(),r.remove(),setTimeout(()=>URL.revokeObjectURL(n),1e3)}function Wf(){let t=st(e);if(!t.ok)throw Error(`Seed memory is invalid: ${t.errors.map(e=>e.message).join(` `)}`);let n=Rf?null:Vf(),r=t.doc,i=!1,a=``,o=null;if(Rf){let e=st(Ff(Rf));e.ok&&(r=e.doc)}else if(n&&!zf){let e=ft(n);if(e?.ok)r=e.doc,i=!0;else if(e&&!e.ok){o=n.getItem(Qe);try{o!==null&&n.setItem(`${Qe}.unreadable`,o)}catch{}a=`Your saved memory couldn't be opened (${e.errors[0]?.message??`unknown problem`}), so the seed is shown. The unreadable copy is kept aside; download it to repair or keep it.`}}let s=M(r),c=Rd(`stage`);if(!Hf()){document.body.classList.remove(`intro`),document.body.classList.add(`show-brand`,`show-tools`);let e=$(`button.btn.primary`,{type:`button`},`Export my memory`);e.addEventListener(`click`,()=>{let e=$(`a`,{href:URL.createObjectURL(new Blob([dt(s)],{type:`application/json`})),download:`constellation-memory.json`});document.body.append(e),e.click(),e.remove()}),document.body.append($(`div.nogl`,{role:`alert`},$(`div.inner.panel`,{},$(`h2`,{style:`font-size:19px;font-weight:700`},`No WebGL here`),$(`p`,{},`This memory needs WebGL to draw, and this browser has it off or unsupported. Your data is safe: you can still export it.`),$(`div.row`,{},e)))),Rd(`topbar`).setAttribute(`inert`,``),n&&!Rf&&pt(s,n),window.__constellation={ready:!0,perspective:s.meta.defaultPerspective,stats:()=>({fps:0,frameMs:0,drawCalls:0,nodes:s.nodes().length,relations:s.relations().length}),screenPosition:()=>null,nodeIdByLabel:e=>s.findByLabel(e)?.id??null,idle:async()=>{}};return}let l=Id({container:c,reducedMotion:Bf.matches}),u=new Cf(s,l,new Set(t.doc.nodes.map(e=>e.id)),t.doc,Bf.matches),d=new Pf(u),f=u.extras;if(Bf.addEventListener(`change`,e=>{u.reduced=e.matches,l.setReducedMotion(e.matches)}),new ResizeObserver(()=>l.resize(c.clientWidth,c.clientHeight)).observe(c),l.setScene(u.builder.build(u.lens)),f.playIntro({speed:i?.5:1}),d.startIntro(i,f.clock.now()),u.renderAll(),n){let e={getItem:e=>n.getItem(e),removeItem:e=>n.removeItem(e),setItem:(e,t)=>{n.setItem(e,t),d.savedConfirmed()}},t={onError:()=>{d.notSaved(),ff(`Couldn't save to this browser (storage is full or blocked). Export a copy so nothing is lost.`,{key:`storage`,error:!0,timeout:0,actions:[{label:`Export`,run:()=>u.exportFile()}]})}},r=pt(s,e,t),i=()=>{r(),r=pt(s,e,t)};addEventListener(`pagehide`,i),document.addEventListener(`visibilitychange`,()=>{document.visibilityState===`hidden`&&i()})}else Rf||(u.persistent=!1,d.notSaved(),ff(`Not saved: this browser won't keep your memory (storage is blocked). Export to keep a copy.`,{key:`storage`,error:!0,timeout:0,actions:[{label:`Export`,run:()=>u.exportFile()}]}));if(a){let e=o;ff(a,{key:`load`,error:!0,timeout:0,actions:e===null?[]:[{label:`Download it`,run:()=>Uf(`constellation-memory-unreadable.json`,e)}]})}let p={ready:!0,get perspective(){return u.lens},stats:()=>l.stats(),screenPosition:e=>l.screenPosition(e),nodeIdByLabel:e=>s.findByLabel(e)?.id??null,idle:()=>f.whenIdle(),clock:f.clock,state:()=>{let e=u.activePathway,t={};for(let[n,r]of u.runs.get(e??``)??[])t[n]=r.trace.status===`ended`?String(r.trace.result):r.trace.error??r.trace.status;let n=null;if(u.playing){let e=u.playing.trace.steps.slice(0,u.playing.index+1);n=e.filter((t,n)=>t.op===`while`&&e.slice(0,n).some(e=>e.nodeId===t.nodeId)).length}else if(e){let t=u.runs.get(e)?.get(u.lens);t&&(n=t.loops)}let r=u.route;return{...f.debugState(),lens:u.lens,lights:s.nodes().length,statsText:u.statsText(),route:r?{declared:r.cmp.declared?.hops??null,shortest:r.cmp.shortest?.hops??null,chip:r.verdict}:null,activationCounts:u.activationCounts(),runs:t,loopBadge:n}}};window.__constellation=p}Wf();