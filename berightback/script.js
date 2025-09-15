const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/websocket/v2`);

let artist = document.getElementById("artist");
let title = document.getElementById("title");

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

