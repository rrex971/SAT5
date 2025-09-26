const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/websocket/v2`);

let artist = document.getElementById("artist");
let title = document.getElementById("title");

let schedule = [];
let seeds = {};

fetch('../schedule/ro16.json')
    .then(response => response.json())
    .then(data => {
        schedule = data;
    });

fetch('../seeds.json')
    .then(response => response.json())
    .then(data => {
        seeds = data;
    });


const now = new Date();
const utc8Now = new Date(now.getTime() + 8 * 60 * 60 * 1000);

function findNextMatch() {
    let nextmatch = [];
    let minTime = null;

    for (const match of schedule) {
        const [month, day, year] = match.date.split('/').map(Number);
        const [hour, minute] = match.time.split(':').map(Number);

        const matchTime = new Date(Date.UTC(year, month - 1, day, hour - 8, minute));
        matchTime.setHours(matchTime.getHours() + 8);

        if (matchTime > utc8Now) {
            if (minTime === null || matchTime < minTime) {
                minTime = matchTime;
                nextmatch = [match];
            } else if (matchTime.getTime() === minTime.getTime()) {
                nextmatch.push(match);
            }
        }
    }

    console.log(nextmatch);

    const nextMatchDiv = document.getElementById("nextmatch");
    if (nextmatch.length > 0) {
        nextMatchDiv.innerHTML = ""; 
        nextmatch.forEach((match, idx) => {
            const [month, day, year] = match.date.split('/').map(Number);
            const [hour, minute] = match.time.split(':').map(Number);

            const matchTime = new Date(Date.UTC(year, month - 1, day, hour - 8, minute));
            matchTime.setHours(matchTime.getHours() + 8);
            const matchDiv = document.createElement("div");
            matchDiv.id = `nextmatch-item-${idx}`;
            matchDiv.classList.add('upcoming-match');
            
            matchDiv.innerHTML = `
                <div class="matchheader">
                    <div class="timing">
                        <span class="date">${match.date}</span> <span class="time">${match.time}</span> UTC+8
                    </div>
                    <div class="intime">
                        in about ${Math.ceil((matchTime - utc8Now) / 3600000)} hours
                    </div>
                </div>

                    <div class="players">
                        <div class="player" id="player1">
                            <span class="playername">${match.player1}</span>
                            <span class="seed">SEED ${seeds[match.player1]}</span>
                        </div>
                        <div class="player" id="player2">
                            <span class="playername">${match.player2}</span>
                            <span class="seed">SEED ${seeds[match.player2]}</span>
                        </div>
                    </div>
                </div>
            `;
            nextMatchDiv.appendChild(matchDiv);
        });
    } else {
        nextMatchDiv.innerHTML = "No upcoming matches";
    }
}

const scheduleInterval = setInterval(() => {
    if (schedule.length > 0) {
        findNextMatch();
        clearInterval(scheduleInterval);
    }
}, 100);

let tempTitle, tempArtist;

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
    
    const newTitle = `${data.beatmap.title}`;
    if (tempTitle !== newTitle) {
        tempTitle = newTitle;
        title.innerHTML = tempTitle;
        tempArtist = data.beatmap.artist
        artist.innerHTML = `${tempArtist} `

        title.classList.remove('overflow-animate');
        setTimeout(() => {
            if (title.scrollWidth > title.clientWidth) {
                title.classList.add('overflow-animate');
            }
        }, 0);
    }

    
}

