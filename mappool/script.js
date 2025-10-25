
(async () => {
    const mapsContainer = document.getElementById('maps');
    try {
        const response = await fetch('mappool_full.json');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        const mappool = await response.json();

        const modOrder = ['NM', 'HD', 'HR', 'DT', 'FM', 'TB'];

        const categories = modOrder.reduce((acc, mod) => {
            acc[mod] = [];
            return acc;
        }, {});

        Object.keys(mappool).forEach(id => {
            const pick = (mappool[id]?.pick || '').toUpperCase();
            const mod = modOrder.find(m => pick.startsWith(m));
            if (mod) {
                categories[mod].push(id);
            }
        });

        const getSuffixNumber = (pick = '', mod) => {
            const rest = pick.slice(mod.length);
            const n = parseInt(rest, 10);
            return Number.isNaN(n) ? 0 : n;
        };

        modOrder.forEach(mod => {
            categories[mod].sort((a, b) => {
                const pickA = (mappool[a]?.pick || '').toUpperCase();
                const pickB = (mappool[b]?.pick || '').toUpperCase();

                // If either is TB, put it after regular ones (if ever present)
                if (pickA === 'TB' && pickB !== 'TB') return 1;
                if (pickB === 'TB' && pickA !== 'TB') return -1;

                const numA = getSuffixNumber(pickA, mod);
                const numB = getSuffixNumber(pickB, mod);
                return numA - numB;
            });
        });

        // Create category containers and append to mapsContainer
        mapsContainer.innerHTML = ''; // clear any existing content

        modOrder.forEach(mod => {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('map-category', mod.toLowerCase());

            const titleDiv = document.createElement('div');
            categoryDiv.appendChild(titleDiv);

            const listDiv = document.createElement('div');
            listDiv.classList.add('category-maps');
            categoryDiv.appendChild(listDiv);

            // If no maps in this category, optionally show a placeholder
            if (categories[mod].length === 0) {
                const empty = document.createElement('div');
                empty.classList.add('category-empty');
                empty.textContent = 'No maps';
                listDiv.appendChild(empty);
            } else {
                categories[mod].forEach(beatmapId => {
                    if (mappool[beatmapId]) {
                        const mapData = mappool[beatmapId];

                        const mapElement = document.createElement('div');
                        mapElement.classList.add('map');
                        mapElement.style.backgroundImage = `linear-gradient(to right, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${mapData.bg})`;
                        const mapModElement = document.createElement('div');
                        mapModElement.classList.add('map-mod');
                        mapModElement.textContent = mapData.pick;

                        const mapDetailsElement = document.createElement('div');
                        mapDetailsElement.classList.add('map-details');

                        const mapTitleElement = document.createElement('div');
                        mapTitleElement.classList.add('map-title');
                        mapTitleElement.textContent = mapData.title;

                        const mapArtistElement = document.createElement('div');
                        mapArtistElement.classList.add('map-artist');
                        mapArtistElement.textContent = mapData.artist;

                        const mapVersionElement = document.createElement('div');
                        mapVersionElement.classList.add('map-version');
                        mapVersionElement.textContent = `[${mapData.version}]`;

                        const mapCreatorElement = document.createElement('div');
                        mapCreatorElement.classList.add('map-creator');
                        mapCreatorElement.textContent = `mapped by ${mapData.creator}`;

                        mapDetailsElement.appendChild(mapTitleElement);
                        mapDetailsElement.appendChild(mapArtistElement);
                        mapDetailsElement.appendChild(mapVersionElement);
                        mapDetailsElement.appendChild(mapCreatorElement);

                        // Store data for picks management
                        mapElement.dataset.beatmapId = beatmapId;
                        mapElement.mapData = mapData;

                        mapElement.appendChild(mapModElement);
                        mapElement.appendChild(mapDetailsElement);

                        // Add click functionality
                        mapElement.addEventListener('click', (e) => {
                            e.preventDefault();
                            handleMapClick(mapElement, e);
                        });

                        mapElement.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            handleMapClick(mapElement, e);
                        });

                        listDiv.appendChild(mapElement);
                    }
                });
            }

            mapsContainer.appendChild(categoryDiv);
        });
    } catch (error) {
        console.error('Error fetching or processing mappool:', error);
        mapsContainer.textContent = 'Error loading mappool. Check console for details.';
    }
})();

document.addEventListener('contextmenu', function (event) {
    event.preventDefault();
});

document.addEventListener('click', function (event) {
    event.preventDefault();
});

function handleMapClick(mapElement, event) {
    event.preventDefault();
    const isShift = event.shiftKey;
    const isRightClick = event.type === 'contextmenu' || event.button === 2;
    const isAlt = event.altKey;
    const isCtrl = event.ctrlKey;

    // Get map data from the element
    const beatmapId = mapElement.dataset.beatmapId;
    const mapData = mapElement.mapData;

    if (isCtrl) {
        const labels = mapElement.querySelectorAll('.map-status');
        mapElement.classList.remove('flash-left', 'flash-right');
        labels.forEach(l => l.remove());
        mapElement.style.borderColor = '#f6e49f';
        mapElement.style.filter = 'none';
        
        // Remove pick from localStorage
        if (beatmapId) {
            removePickByBeatmapId(beatmapId);
        }
        return;
    }

    let statusText = '';
    let action = '';
    let player = 0;

    if (isAlt) {
        statusText = isRightClick ? `Protected by ${temp.playerRight}` : `Protected by ${temp.playerLeft}`;
        mapElement.style.borderColor = '#64ff74ff';
        mapElement.style.filter = 'none';
        action = 'protected';
        player = isRightClick ? 2 : 1;
    } else if (isShift && !isRightClick) {
        statusText = `Banned by ${temp.playerLeft}`;
        mapElement.style.borderColor = '#ff6464ff';
        mapElement.style.filter = 'brightness(0.6) grayscale(30%)';
        action = 'banned';
        player = 1;
    } else if (isShift && isRightClick) {
        statusText = `Banned by ${temp.playerRight}`;
        mapElement.style.borderColor = '#ff6464ff';
        mapElement.style.filter = 'brightness(0.6) grayscale(30%)';
        action = 'banned';
        player = 2;
    } else {
        // clear any special styles for neutral/picked cases
        mapElement.style.borderColor = '';
        mapElement.style.filter = '';
        if (!isShift && !isRightClick) {
            // Check if this is a TB pick
            if (mapData && mapData.pick && mapData.pick.toUpperCase() === 'TB') {
                statusText = 'TB HYPE';
                player = 0; // No player for TB picks
            } else {
                statusText = `Picked by ${temp.playerLeft}`;
                player = 1;
            }
            mapElement.style.borderColor = '#f6e49f';
            setTimeout(() => {
                mapElement.classList.add('flash-left');
            }, 100);
            setTimeout(() => {
                mapElement.classList.remove('flash-left');
            }, 4000);
            action = 'picked';
        } else if (!isShift && isRightClick) {
            // Check if this is a TB pick
            if (mapData && mapData.pick && mapData.pick.toUpperCase() === 'TB') {
                statusText = 'TB HYPE';
                player = 0; // No player for TB picks
            } else {
                statusText = `Picked by ${temp.playerRight}`;
                player = 2;
            }
            mapElement.style.borderColor = '#f7c9e2';
            setTimeout(() => {
                mapElement.classList.add('flash-right');
            }, 100);
            setTimeout(() => {
                mapElement.classList.remove('flash-right');
            }, 4000);
            action = 'picked';
        }
    }

        if ((action === 'picked' || action === 'banned' || action === 'protected') && mapData) {
            addPick(beatmapId, mapData.pick, mapData.title, mapData.artist, action, player);
        }    const existingLabel = mapElement.querySelector('.map-status');
    if (existingLabel) {
        existingLabel.remove();
    }

    createStatusLabel(mapElement, statusText, isRightClick ? "right" : "left");
}

function createStatusLabel(mapElement, statusText, player) {
    const statusLabel = document.createElement('div');
    statusLabel.classList.add('map-status');
    statusLabel.textContent = statusText;
    if (player === "right") {
        statusLabel.classList.add('right');
    } else {
        statusLabel.classList.add('left');
    }
    
    // Apply gradient background for TB HYPE labels
    if (statusText === 'TB HYPE') {
        statusLabel.style.background = 'linear-gradient(45deg, #f6e49f, #f7c9e2)';
    }
    
    mapElement.appendChild(statusLabel);
    setInterval(() => {
        statusLabel.classList.add('visible');
    }, 30);

}



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
let customIndicator = document.getElementById("custom-indicator");
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

fetch('../mappool.json')
    .then(response => response.json())
    .then(data => mappool = data)
    .then(() => {
        console.log(mappool);
        round.innerHTML = mappool.round || "Unknown Round";
    })
    .catch(error => console.error('Error loading mappool:', error));



let seeds = {};
fetch('../seeds.json')
    .then(response => response.json())
    .then(data => {
        seeds = data;
    })
    .catch(error => console.error('Error loading seeds:', error));


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
    if (tempId !== data.beatmap.id && mappool !== undefined) {
        tempId = data.beatmap.id;
        
        let pickText = '';
        
        if (mappool[data.beatmap.id] !== undefined) {
            if (mappool[data.beatmap.id].pick === undefined) {
                pickText = mappool[data.beatmap.id];
                customIndicator.classList.remove('visible');
            } else {
                pickText = mappool[data.beatmap.id].pick;
                customIndicator.classList.add('visible');
            }
        }
        else {
            pickText = "N/A";
            if (customIndicator) {
                customIndicator.classList.remove('visible');
            }
        }
        
        // Update with animation wrapper
        pick.innerHTML = `<span class="pick-text pick-change">${pickText}</span>`;
    }

    if (tempImg !== data.directPath.beatmapBackground) {
        tempImg = data.directPath.beatmapBackground;
        
        // Fade out current image
        bg.classList.add('fade-out');
        
        setTimeout(() => {
            if (tempImg && tempImg.trim() !== "") {
                bg.src = "/files/beatmap/" + encodeURIComponent(tempImg);
            } else {
                bg.src = "";
            }
            
            // Fade in new image
            setTimeout(() => {
                bg.classList.remove('fade-out');
            }, 50);
        }, 200);
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

    if (data.tourney.clients[0].beatmap.stats.cs != tempCs) {
        //tempCs = data.beatmap.stats.cs.converted;
        tempCs = data.tourney.clients[0].beatmap.stats.cs.converted;
        cs.update(Math.round(tempCs * 100) / 100);
    }
    if (data.tourney.clients[0].beatmap.stats.ar != tempAr) {
        //tempAr = data.beatmap.stats.ar.converted;
        tempAr = data.tourney.clients[0].beatmap.stats.ar.converted;
        ar.update(Math.round(tempAr * 100) / 100);
    }
    if (data.tourney.clients[0].beatmap.stats.od != tempOd) {
        //tempOd = data.beatmap.stats.od.converted;
        tempOd = data.tourney.clients[0].beatmap.stats.od.converted;
        od.update(Math.round(tempOd * 100) / 100);
    }
    if (data.tourney.clients[0].beatmap.stats.hp != tempHp) {
        //tempHp = data.beatmap.stats.hp.converted;
        tempHp = data.tourney.clients[0].beatmap.stats.hp.converted;
        hp.update(Math.round(tempHp * 100) / 100);
    }
    if (data.tourney.clients[0].beatmap.stats.bpm.common != tempBPM) {
        //tempBPM = data.beatmap.stats.bpm.common
        tempBPM = data.tourney.clients[0].beatmap.stats.bpm.common;
        bpm.update(Math.round(tempBPM * 100) / 100);
    }
    if (data.tourney.clients[0].beatmap.stats.stars.total != tempSR) {
        tempSR = data.tourney.clients[0].beatmap.stats.stars.total;
        sr.update(Math.round(tempSR * 100) / 100);
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
        document.getElementById("pfp1").style.backgroundImage = `url("https://a.ppy.sh/${data.tourney.clients[0].user.id}")`;
        temp.playerLeft = data.tourney.clients[0].user.name;
        player1name.innerHTML = temp.playerLeft;
        document.getElementById('seed1').innerHTML = seeds[temp.playerLeft] ? `SEED ${seeds[temp.playerLeft]}` : ' ';
    }

    if (temp.playerRight !== data.tourney.clients[1].user.name) {
        document.getElementById("pfp2").style.backgroundImage = `url("https://a.ppy.sh/${data.tourney.clients[1].user.id}")`;
        temp.playerRight = data.tourney.clients[1].user.name;
        player2name.innerHTML = temp.playerRight;
        document.getElementById('seed2').innerHTML = seeds[temp.playerRight] ? `SEED ${seeds[temp.playerRight]}` : ' ';
    }
    if (checkPicksChanged()) {
        updatePicksDisplay();
    }

}

const picksQueue = document.getElementById("picks-queue");
const PICKS_STORAGE_KEY = 'sat5-tournament-picks';
let lastPicksHash = '';

function getPicks() {
    try {
        const picks = localStorage.getItem(PICKS_STORAGE_KEY);
        return picks ? JSON.parse(picks) : [];
    } catch (error) {
        console.error('Error reading picks:', error);
        return [];
    }
}

function addPick(beatmapId, pick, title, artist, action, player) {
    const picks = getPicks();
    const pickData = {
        id: Date.now(),
        beatmapId,
        pick,
        title,
        artist,
        action,
        player,
        timestamp: new Date().toISOString()
    };
    
    picks.unshift(pickData); // Add to beginning
    
    try {
        localStorage.setItem(PICKS_STORAGE_KEY, JSON.stringify(picks));
    } catch (error) {
        console.error('Error saving pick:', error);
    }
}

// Remove pick by beatmapId
function removePickByBeatmapId(beatmapId) {
    const picks = getPicks();
    const pickIndex = picks.findIndex(pick => pick.beatmapId === beatmapId);
    
    if (pickIndex !== -1) {
        const filteredPicks = picks.filter((pick, index) => index !== pickIndex);
        try {
            localStorage.setItem(PICKS_STORAGE_KEY, JSON.stringify(filteredPicks));
        } catch (error) {
            console.error('Error removing pick:', error);
        }
    }
}

// Clear all picks
function clearAllPicks() {
    try {
        localStorage.removeItem(PICKS_STORAGE_KEY);
        updatePicksDisplay();
    } catch (error) {
        console.error('Error clearing picks:', error);
    }
}

// Check if picks changed (for polling)
function checkPicksChanged() {
    try {
        const currentHash = localStorage.getItem(PICKS_STORAGE_KEY) || '';
        if (currentHash !== lastPicksHash) {
            lastPicksHash = currentHash;
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

// Initialize picks display when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Display initial picks
    updatePicksDisplay();
    
    // Initialize hash for polling
    lastPicksHash = localStorage.getItem(PICKS_STORAGE_KEY) || '';
    
    // Add right-click clear functionality to picks title
    const picksTitle = document.getElementById('picks-title');
    if (picksTitle) {
        picksTitle.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            clearAllPicks();
        });
    }
});

let lastPicksCount = 0;

function updatePicksDisplay() {
    if (!picksQueue) return;
    
    const picks = getPicks();
    const currentPicksCount = picks.length;
    const isNewPick = currentPicksCount > lastPicksCount;
    
    // Clear existing picks
    picksQueue.innerHTML = '';
    
    // Display picks in order (newest first)
    picks.forEach((pickData, index) => {
        const pickElement = document.createElement('div');
        pickElement.classList.add('pick-item');
        
        // Add player-specific styling
        if (pickData.player === 1) {
            pickElement.classList.add('player1');
        } else if (pickData.player === 2) {
            pickElement.classList.add('player2');
        }
        
        // Add action-specific styling
        if (pickData.action === 'banned') {
            pickElement.classList.add('banned');
        } else if (pickData.action === 'protected') {
            pickElement.classList.add('protected');
        } else if (pickData.pick && pickData.pick.toUpperCase() === 'TB') {
            pickElement.classList.add('tb');
        }
        
        // Add animation classes
        if (isNewPick && index === 0) {
            // First element is the new one, animate it sliding in
            pickElement.classList.add('new');
        } else if (isNewPick && index > 0) {
            // Other elements shift to the right
            pickElement.classList.add('shift');
        }
        
        // Set text content
        let displayText;
        if (pickData.action === 'banned') {
            displayText = `BAN: ${pickData.pick}`;
        } else if (pickData.action === 'protected') {
            displayText = `PROTECT: ${pickData.pick}`;
        } else if (pickData.pick && pickData.pick.toUpperCase() === 'TB') {
            displayText = 'PICK: TB';
        } else {
            displayText = `PICK: ${pickData.pick}`;
        }
        pickElement.textContent = displayText;
        
        // Add to queue
        picksQueue.appendChild(pickElement);
        
        // Remove animation classes after animation completes
        setTimeout(() => {
            pickElement.classList.remove('new', 'shift');
        }, 400);
    });
    
    lastPicksCount = currentPicksCount;
    
    // Update ban/protect display after picks update
    updateBanProtectDisplay();
    
    // Update pick indicators
    updatePickIndicators();
}

function updatePickIndicators() {
    const picks = getPicks();
    const pick1Element = document.getElementById('pick1');
    const pick2Element = document.getElementById('pick2');
    
    // Always clear existing show classes first
    if (pick1Element) pick1Element.classList.remove('show');
    if (pick2Element) pick2Element.classList.remove('show');
    
    // Find the latest pick action (any pick, including TB)
    const latestPick = picks.find(pick => pick.action === 'picked');
    
    // If the latest pick is TB or has no player, hide all indicators
    if (latestPick && (latestPick.player === 0 || !latestPick.player || 
        (latestPick.pick && latestPick.pick.toUpperCase() === 'TB'))) {
        // Explicitly hide indicators for TB picks
        if (pick1Element) {
            pick1Element.style.display = 'none';
        }
        if (pick2Element) {
            pick2Element.style.display = 'none';
        }
        return;
    }
    
    // For non-TB picks, show indicators and restore display
    if (pick1Element) {
        pick1Element.style.display = 'flex';
    }
    if (pick2Element) {
        pick2Element.style.display = 'flex';
    }
    
    // Show the appropriate indicator for regular picks
    if (latestPick && latestPick.player === 1 && pick1Element) {
        pick1Element.classList.add('show');
    } else if (latestPick && latestPick.player === 2 && pick2Element) {
        pick2Element.classList.add('show');
    }
}

function updateBanProtectDisplay() {
    const picks = getPicks();
    
    // Get ban and protect elements
    const p1ban0 = document.getElementById('p1ban_0');
    const p1ban1 = document.getElementById('p1ban_1');
    const p2ban0 = document.getElementById('p2ban_0');
    const p2ban1 = document.getElementById('p2ban_1');
    const p1prot0 = document.getElementById('p1prot_0');
    const p2prot0 = document.getElementById('p2prot_0');
    
    // Clear all slots
    const allSlots = [p1ban0, p1ban1, p2ban0, p2ban1, p1prot0, p2prot0];
    allSlots.forEach(slot => {
        if (slot) {
            slot.textContent = '';
            slot.classList.remove('filled');
            slot.classList.add('empty');
        }
    });
    
    // Filter picks by player and action
    const p1Bans = picks.filter(pick => pick.player === 1 && pick.action === 'banned');
    const p2Bans = picks.filter(pick => pick.player === 2 && pick.action === 'banned');
    const p1Protects = picks.filter(pick => pick.player === 1 && pick.action === 'protected');
    const p2Protects = picks.filter(pick => pick.player === 2 && pick.action === 'protected');
    
    // Populate player 1 bans (first two)
    if (p1Bans.length > 0 && p1ban0) {
        p1ban0.textContent = p1Bans[0].pick;
        p1ban0.classList.remove('empty');
        p1ban0.classList.add('filled');
    }
    if (p1Bans.length > 1 && p1ban1) {
        p1ban1.textContent = p1Bans[1].pick;
        p1ban1.classList.remove('empty');
        p1ban1.classList.add('filled');
    }
    
    // Populate player 2 bans (first two)
    if (p2Bans.length > 0 && p2ban0) {
        p2ban0.textContent = p2Bans[0].pick;
        p2ban0.classList.remove('empty');
        p2ban0.classList.add('filled');
    }
    if (p2Bans.length > 1 && p2ban1) {
        p2ban1.textContent = p2Bans[1].pick;
        p2ban1.classList.remove('empty');
        p2ban1.classList.add('filled');
    }
    
    // Populate player 1 protect (first one)
    if (p1Protects.length > 0 && p1prot0) {
        p1prot0.textContent = p1Protects[0].pick;
        p1prot0.classList.remove('empty');
        p1prot0.classList.add('filled');
    }
    
    // Populate player 2 protect (first one)
    if (p2Protects.length > 0 && p2prot0) {
        p2prot0.textContent = p2Protects[0].pick;
        p2prot0.classList.remove('empty');
        p2prot0.classList.add('filled');
    }
}

