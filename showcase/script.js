const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/websocket/v2`);

let mapid = document.getElementById('mapid');

let bg = document.getElementById("bg");
let title = document.getElementById("title");
let artist = document.getElementById("artist");
let mapper = document.getElementById("mapper");
let difficulty = document.getElementById("difficulty");
let replayer = document.getElementById("replayer-container");
const timeFormatter = (value) => {
  const seconds = Math.round(value);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}`;
};

const smartDecimalFormatter = (value) => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0, 
    maximumFractionDigits: 2,
  });
};

const duration = 0.5;



const length = new CountUp("length", 0, 0, 0, duration, { useEasing: true, useGrouping: false, separator: '', formattingFn: timeFormatter, decimal: '.', suffix: '' });
const cs = new CountUp("csval", 0, 0, 2, duration, { useEasing: true, useGrouping: false, separator: '', formattingFn: smartDecimalFormatter, decimal: '.', suffix: '' });
const ar = new CountUp("arval", 0, 0, 2, duration, { useEasing: true, useGrouping: false, separator: '', formattingFn: smartDecimalFormatter, decimal: '.', suffix: '' });
const od = new CountUp("odval", 0, 0, 2, duration, { useEasing: true, useGrouping: false, separator: '', formattingFn: smartDecimalFormatter, decimal: '.', suffix: '' });
const hp = new CountUp("hpval", 0, 0, 2, duration, { useEasing: true, useGrouping: false, separator: '', formattingFn: smartDecimalFormatter, decimal: '.', suffix: '' });
const bpm = new CountUp("bpm", 0, 0, 2, duration, { useEasing: true, useGrouping: false, separator: '', formattingFn: smartDecimalFormatter, decimal: '.', suffix: '' });
const sr = new CountUp("sr", 0, 0, 2, 0.3, { useEasing: true, useGrouping: false, separator: '', formattingFn: smartDecimalFormatter, decimal: '.', suffix: '' });
let pick = document.getElementById("pick");
let custom = document.getElementById("custom");
let img;
let round = document.getElementById("ro");
let tempId=-727, tempImg, tempCs, tempAr, tempOd, tempHp, tempBPM, tempSR, tempTitle, tempArtist, tempMapper, tempReplayer, tempDifficulty, tempMods, tempLength;
let mappool = {};

fetch('mappool.json')
    .then(response => response.json())
    .then(data => mappool = data)
    .then(() => {
            console.log(mappool);
            round.innerHTML = mappool.round || "Unknown Round";
    })
    .catch(error => console.error('Error loading mappool:', error));

socket.onopen = () => {
    console.log("Successfully Connected");


};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!")
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};


socket.onmessage = event => {
    let data = JSON.parse(event.data);
    if (tempId !== data.beatmap.id || tempArtist !== data.beatmap.artist) {
        tempId = data.beatmap.id
        if (tempId === 0) {
            for (let key in mappool["custom"]) {
                console.log(data.beatmap.title.toLowerCase());
                if (data.beatmap.title.toLowerCase().includes(key.toLowerCase())) {
                    pick.innerHTML = mappool["custom"][key];
                    custom.classList.add("transition");
                    break;
                }
            }  
        }
        else if (mappool[data.beatmap.id] !== undefined) {
            pick.innerHTML = mappool[data.beatmap.id];
            custom.classList.remove("transition");
        } else {
            pick.innerHTML = "N/A";
            custom.classList.remove("transition");
        }
    }

    if (tempImg !== data.directPath.beatmapBackground) {
        tempImg = data.directPath.beatmapBackground;
        if (tempImg && tempImg.trim() !== "") {
            bg.src = "/files/beatmap/" + tempImg;
        } else {
            bg.src = "";
        }
    }
    const newTitle = `${data.beatmap.title}`;
    const newDiff =  `[${data.beatmap.version}]`
    if (tempDifficulty !== newDiff) {
        tempTitle = newTitle;
        tempDifficulty = newDiff;
        title.innerHTML = tempTitle;
        difficulty.innerHTML = newDiff;

        title.classList.remove('overflow-animate');
        setTimeout(() => {
            if (title.scrollWidth > title.clientWidth) {
                title.classList.add('overflow-animate');
            }
        }, 0);
    }

    if (data.beatmap.artist !== tempArtist) {
        tempArtist = data.beatmap.artist
        artist.innerHTML = `${tempArtist} `
    }

    if (data.beatmap.mapper !== tempMapper) {
        tempMapper = data.beatmap.mapper
        mapper.innerHTML = `Mapped by <span class="mapper invert">${tempMapper}</span>`
    }
    
    if (data.play.playerName !== tempReplayer) {
        tempReplayer = data.play.playerName;
        if (data.play.playerName === "") {
            replayer.innerHTML = `Replay by <span class="replayer"> - </span>`;
        } else {
            replayer.innerHTML = `Replay by <span class="replayer">${tempReplayer}</span>`;
        }
    }

    let newTime = data.beatmap.time.lastObject;

    if(data.play.mods.number === 64 || data.play.mods.number === 576){
        newTime = Math.round(newTime * (2/3));
    } 

    
    if (newTime !== tempLength) {
        tempLength = newTime;
        length.update(Math.floor(newTime / 1000))
    }
    
    if (data.beatmap.stats.cs != tempCs) {
        tempCs = data.beatmap.stats.cs.converted;
        cs.update(Math.round(tempCs * 100) / 100);
    }
    if (data.beatmap.stats.ar != tempAr) {
        tempAr = data.beatmap.stats.ar.converted;
        ar.update(Math.round(tempAr * 100) / 100);
    }
    if (data.beatmap.stats.od != tempOd) {
        tempOd = data.beatmap.stats.od.converted;
        od.update(Math.round(tempOd * 100) / 100);
    }
    if (data.beatmap.stats.hp != tempHp) {
        tempHp = data.beatmap.stats.hp.converted;
        hp.update(Math.round(tempHp * 100) / 100);
    }
    if (data.beatmap.stats.bpm.common != tempBPM) {
        tempBPM = data.beatmap.stats.bpm.common
        bpm.update(Math.round(tempBPM * 100) / 100);
    }
    if (data.beatmap.stats.stars.total != tempSR) {
        tempSR = data.beatmap.stats.stars.total
        sr.update(Math.round(tempSR * 100) / 100)
    }
    
    
}

