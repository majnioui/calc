const express = require('express');
const router = express.Router();
const axios = require('axios');

// Function to find nearest Wafasalaf branch using Google Maps Places API
async function findNearestBranch(latitude, longitude) {
    try {
        // Use Google Maps Places API to search for Wafasalaf branches
        const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
            params: {
                location: `${latitude},${longitude}`,
                radius: 5000, // Search within 5km radius
                keyword: 'Wafasalaf',
                key: process.env.GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.results.length === 0) {
            return null;
        }

        // Get the first (nearest) result
        const nearestBranch = response.data.results[0];

        // Calculate distance
        const distance = calculateDistance(
            latitude,
            longitude,
            nearestBranch.geometry.location.lat,
            nearestBranch.geometry.location.lng
        );

        return {
            name: nearestBranch.name,
            address: nearestBranch.vicinity,
            lat: nearestBranch.geometry.location.lat,
            lng: nearestBranch.geometry.location.lng,
            distance: distance,
            place_id: nearestBranch.place_id,
            maps_url: `https://www.google.com/maps/place/?q=place_id:${nearestBranch.place_id}`
        };
    } catch (error) {
        console.error('Error finding nearest branch:', error);
        throw error;
    }
}

// Function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// Find nearest branch
router.post('/find-branches', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Missing required parameters: latitude, longitude'
            });
        }

        // Find nearest branch using Google Maps
        const nearestBranch = await findNearestBranch(latitude, longitude);

        if (!nearestBranch) {
            return res.status(404).json({
                error: 'No Wafasalaf branches found nearby'
            });
        }

        // Format the response for Watson Assistant
        const response = {
            branch: nearestBranch,
            message: `The nearest Wafasalaf branch is ${nearestBranch.name} at ${nearestBranch.address}, located ${nearestBranch.distance.toFixed(2)} km away.`,
            maps_url: nearestBranch.maps_url
        };

        res.json(response);
    } catch (error) {
        console.error('Error in find-branches endpoint:', error);
        res.status(500).json({
            error: 'An error occurred while finding the nearest branch'
        });
    }
});

module.exports = router;