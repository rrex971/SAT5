
(async () => {
    const mapsContainer = document.getElementById('maps');
    try {
        const response = await fetch('../mappool.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const mappool = await response.json();

        for (const beatmapId in mappool) {
            if (beatmapId === 'round') {
                continue;
            }
            const mod = mappool[beatmapId];

            const mapElement = document.createElement('div');
            mapElement.classList.add('map');

            const mapModElement = document.createElement('div');
            mapModElement.classList.add('map-mod');
            mapModElement.textContent = mod;

            const mapDetailsElement = document.createElement('div');
            mapDetailsElement.classList.add('map-details');

            // As we don't have beatmap details like title and artist in mappool.json,
            // we will just display the beatmap ID for now.
            const mapTitleElement = document.createElement('div');
            mapTitleElement.classList.add('map-title');
            mapTitleElement.textContent = `Beatmap ID: ${beatmapId}`;

            const mapArtistElement = document.createElement('div');
            mapArtistElement.classList.add('map-artist');
            mapArtistElement.textContent = 'Unknown Artist';


            mapDetailsElement.appendChild(mapTitleElement);
            mapDetailsElement.appendChild(mapArtistElement);

            mapElement.appendChild(mapModElement);
            mapElement.appendChild(mapDetailsElement);

            mapsContainer.appendChild(mapElement);
        }
    } catch (error) {
        console.error('Error fetching or processing mappool:', error);
        mapsContainer.textContent = 'Error loading mappool. Check console for details.';
    }
})();
