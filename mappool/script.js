
(async () => {
    const mapsContainer = document.getElementById('maps');
    try {
        const response = await fetch('mappool_full.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const mappool = await response.json();

        const beatmapOrder = [
            '3313814', '5053934', '3933284', '2903609', '5034347',
            '3711005', '5178736', '4941367', '4300883', '4109655',
            '4794270', '4704011', '5163220', '4948448'
        ];

        beatmapOrder.forEach(beatmapId => {
            if (mappool[beatmapId]) {
                const mapData = mappool[beatmapId];

                const mapElement = document.createElement('div');
                mapElement.classList.add('map');

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

                mapsContainer.appendChild(mapElement);
            }
        });
    } catch (error) {
        console.error('Error fetching or processing mappool:', error);
        mapsContainer.textContent = 'Error loading mappool. Check console for details.';
    }
})();

function handleMapClick(mapElement, event) {
    const isShift = event.shiftKey;
    const isRightClick = event.type === 'contextmenu' || event.button === 2;
    
    let statusText = '';
    
    if (isShift && !isRightClick) {
        statusText = 'Banned by Player 1';
    } else if (isShift && isRightClick) {
        statusText = 'Banned by Player 2';
    } else if (!isShift && !isRightClick) {
        statusText = 'Picked by Player 1';
    } else if (!isShift && isRightClick) {
        statusText = 'Picked by Player 2';
    }
    
    // Remove existing status label if any
    const existingLabel = mapElement.querySelector('.map-status');
    if (existingLabel) {
        existingLabel.remove();
    }
    
    // Create and add new status label
    createStatusLabel(mapElement, statusText);
}

function createStatusLabel(mapElement, statusText) {
    const statusLabel = document.createElement('div');
    statusLabel.classList.add('map-status');
    statusLabel.textContent = statusText;
    
    mapElement.appendChild(statusLabel);
}
