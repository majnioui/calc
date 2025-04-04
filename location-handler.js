// Function to request location permission
function requestLocationPermission() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                }
            );
        } else {
            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
}

// Function to find nearest branches
async function findNearestBranches(latitude, longitude) {
    try {
        const response = await fetch('/api/find-branches', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ latitude, longitude }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch branches');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error finding branches:', error);
        throw error;
    }
}

// Function to create a map with markers
function createMapWithMarkers(branch, userLocation) {
    const mapDiv = document.createElement('div');
    mapDiv.style.height = '400px';
    mapDiv.style.width = '100%';
    mapDiv.style.margin = '10px 0';

    const map = new google.maps.Map(mapDiv, {
        center: { lat: userLocation.latitude, lng: userLocation.longitude },
        zoom: 12
    });

    // Add user location marker
    new google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: map,
        title: 'Your Location',
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
    });

    // Add branch marker
    new google.maps.Marker({
        position: { lat: branch.lat, lng: branch.lng },
        map: map,
        title: branch.name
    });

    return mapDiv;
}

// Export functions for use in Watson Assistant
window.locationHandler = {
    requestLocationPermission,
    findNearestBranches,
    createMapWithMarkers
};