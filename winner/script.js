const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/websocket/v2`);

let artist = document.getElementById("artist");
let title = document.getElementById("title");
let winnerNameEl = document.getElementById("winner-name");
let pfpEl = document.getElementById("pfp");

let tempTitle, tempArtist;
let winnerDetected = false;

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

    // Check for winner (7 points)
    if (!winnerDetected) {
        if (data.tourney.points.left >= 7) {
            winnerNameEl.textContent = data.tourney.clients[0].user.name === "" ? "TBD" : data.tourney.clients[0].user.name;
            pfpEl.src = `https://a.ppy.sh/${data.tourney.clients[0].user.id == 0 ? 4 : data.tourney.clients[0].user.id}`;
            winnerDetected = true;
            console.log('Winner detected: Player 1 -', data.tourney.clients[0].user.name);
        } else if (data.tourney.points.right >= 7) {
            winnerNameEl.textContent = data.tourney.clients[1].user.name === "" ? "TBD" : data.tourney.clients[1].user.name;
            pfpEl.src = `https://a.ppy.sh/${data.tourney.clients[1].user.id == 0 ? 4 : data.tourney.clients[1].user.id}`;
            winnerDetected = true;
            console.log('Winner detected: Player 2 -', data.tourney.clients[1].user.name);
        }
    }

    
}

