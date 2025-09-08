const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/websocket/v2`);

let artist = document.getElementById("artist");
let title = document.getElementById("title");
const timeFormatter = (value) => {
  const seconds = Math.round(value);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}`;
};

const duration = 0.5;
let timerVal = 300;
const timer = new CountUp("timer", 0, 0, 0, duration, { useEasing: true, useGrouping: false, separator: '', formattingFn: timeFormatter, decimal: '.', suffix: '' });
const timerO = new CountUp("timerO", 0, 0, 0, duration, { useEasing: true, useGrouping: false, separator: '', formattingFn: timeFormatter, decimal: '.', suffix: '' });

let tempTitle, tempArtist;

setInterval(() => {
    if (timerVal > 0) {
        timerVal -= 1;
        timer.update(timerVal);
        timerO.update(timerVal);
    }
}, 1000);

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

