const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/websocket/v2`);

let mapid = document.getElementById('mapid');

let bg = document.getElementById("bg");
let title = document.getElementById("title");
let artist = document.getElementById("artist");
let mapper = document.getElementById("mapper");
let difficulty = document.getElementById("difficulty");
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


const player1 = document.getElementById("player-one");
const player2 = document.getElementById("player-two");
const player1name = document.getElementById("player-one-name");
const player2name = document.getElementById("player-two-name"); 
const score1 = new CountUp("score1", 0, 0, 0, 0.5, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' });
const score2 = new CountUp("score2", 0, 0, 0, 0.5, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' });
const diff = new CountUp("diff", 0, 0, 0, 0.5, { useEasing: true, useGrouping: true, separator: ',', decimal: '.', suffix: '' });
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
let tempId = -727, tempImg, tempCs, tempAr, tempOd, tempHp, tempBPM, tempSR, tempTitle, tempArtist, tempMapper, tempDifficulty, tempMods, tempLength;
let mappool = {};

let temp = {
    playerLeft: "/ / /",
    playerRight: "\\ \\ \\",
    starsLeft: 0,
    starsRight: 0,
    scoreLeft: 0,
    scoreRight: 0,
    scoreDiff: 0
}

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
            if ((mappool[data.beatmap.id].custom === true)) {
                console.log(data.beatmap.title.toLowerCase());
                pick.innerHTML = mappool[data.beatmap.id].pick;
                custom.classList.add("transition");
            } else {
                pick.innerHTML = mappool[data.beatmap.id];
                custom.classList.remove("transition");
            } 
        }
        else {
                pick.innerHTML = "N/A";
                custom.classList.remove("transition");
            }
        }

        if (tempImg !== data.directPath.beatmapBackground) {
            tempImg = data.directPath.beatmapBackground;
            if (tempImg && tempImg.trim() !== "") {
                bg.src = "/files/beatmap/" + encodeURIComponent(tempImg);
            } else {
                bg.src = "";
            }
        }
        const newTitle = `${data.beatmap.title}`;
        const newDiff = `[${data.beatmap.version}]`
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

        let newTime = data.beatmap.time.lastObject;

        if (data.play.mods.number === 64 || data.play.mods.number === 576) {
            newTime = Math.round(newTime * (2 / 3));
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

        if (temp.starsLeft !== data.tourney.points.left) {
            temp.starsLeft = data.tourney.points.left;
            for (let i = 0; i < temp.starsLeft; i++) { document.getElementById(`point1_${i}`).classList.add('filled'); }
            for (let i = temp.starsLeft + 1; i < 5; i++) { document.getElementById(`point1_${i}`).classList.remove('filled'); }
	    }

	    if (temp.starsRight !== data.tourney.points.right) {
            temp.starsRight = data.tourney.points.right;
            for (let i = 0; i < temp.starsRight; i++) { document.getElementById(`point2_${i}`).classList.add('filled'); }
            for (let i = temp.starsRight + 1; i < 5; i++) { document.getElementById(`point2_${i}`).classList.remove('filled'); }
	    }
        let scoreUpd = false;
        if (temp.scoreLeft !== data.tourney.totalScore.left) {
            temp.scoreLeft = data.tourney.totalScore.left;
            score1.update(temp.scoreLeft);
            scoreUpd = true;
        }

        if (temp.scoreRight !== data.tourney.totalScore.right) {
            temp.scoreRight = data.tourney.totalScore.right;
            score2.update(temp.scoreRight);
            scoreUpd = true;
        }

        if (temp.playerLeft !== data.tourney.clients[0].user.name) {
            temp.playerLeft = data.tourney.clients[0].user.name;
            player1name.innerHTML = temp.playerLeft;
        }

        if (temp.playerRight !== data.tourney.clients[1].user.name) {
            temp.playerRight = data.tourney.clients[1].user.name;
            player2name.innerHTML = temp.playerRight;
        }

        if (scoreUpd) {
            const CAP = 1000000;
            const leftRaw = temp.scoreLeft || 0;
            const rightRaw = temp.scoreRight || 0;

            const left = Math.min(Math.max(0, leftRaw), CAP);
            const right = Math.min(Math.max(0, rightRaw), CAP);

            const differ = left - right;
            const percent = Math.min(Math.abs(differ) / CAP * 100, 100);

            const leftEl = document.getElementById('scorebar-left');
            const rightEl = document.getElementById('scorebar-right');

            if (leftEl && rightEl) {
                leftEl.style.transition = 'width 0.2s ease';
                rightEl.style.transition = 'width 0.2s ease';
                diff.update(Math.abs(leftRaw-rightRaw));
                if (differ > 0) {
                    leftEl.style.width = percent + '%';
                    rightEl.style.width = '0%';
                    document.getElementById('score1').classList.add('leading');
                    document.getElementById('score2').classList.remove('leading');
                } else if (differ < 0) {
                    rightEl.style.width = percent + '%';
                    leftEl.style.width = '0%';
                    document.getElementById('score2').classList.add('leading');
                    document.getElementById('score1').classList.remove('leading');
                } else {
                    leftEl.style.width = '0%';
                    rightEl.style.width = '0%';
                    document.getElementById('score1').classList.remove('leading');
                    document.getElementById('score2').classList.remove('leading');
                }
            } 
        }

    }

