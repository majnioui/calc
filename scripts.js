// Constants
const INTEREST_RATE = 7; // Annual interest rate in percentage

/**
 * @param {number} amount - Loan amount
 * @param {number} duration - Loan duration in years
 * @param {number} rate - Annual interest rate
 * @returns {Object} Object containing monthly payment and total cost
 */
function calculateLoanPayment(amount, duration, rate) {
  const monthlyRate = rate / 100 / 12;
  const months = duration;
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalCost = monthlyPayment * months;

  return {
    monthlyPayment: monthlyPayment.toFixed(2),
    totalCost: totalCost.toFixed(2)
  };
}

/**
 * Applies a highlight animation to an element
 * @param {HTMLElement} element - The element to highlight
 * @param {string} className - The CSS class to apply
 */
function highlightElement(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), 1500);
}

/**
 * Takes user location and sends it to the assistant
 * @param {Object} data - Location data from browser geolocation API
 * @param {Object} instance - Watson Assistant instance
 */
function takeLocation(data, instance) {
  // Get the nearest Wafasalaf location
  fetchNearestWafasalaf(data.coords.latitude, data.coords.longitude)
    .then(nearestLocation => {
      console.log("Sending nearest location to assistant:", nearestLocation);

      // Format origin (user location)
      const originCoords = `${data.coords.latitude},${data.coords.longitude}`;

      // Format destination (nearest Wafasalaf location)
      // Use coordinates if available, otherwise use place name
      const destinationCoords = `${nearestLocation.lat},${nearestLocation.lng}`;
      const destinationName = nearestLocation.name ? encodeURIComponent(nearestLocation.name) : "CIH Bank";

      // Create a directions URL suitable for an iframe
      const directionsUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyAd3acpn2pZuAye8gk46LkFkMpPdmBQEFQ&origin=${originCoords}&destination=${destinationCoords}&avoid=tolls`;

      // Send location data to assistant as context variables
      instance.send({
        input: {
          text: `J'ai trouvé l'agence Wafasalaf la plus proche à ${nearestLocation.distance || "quelques"} km.`
        },
        context: {
          "skills": {
            "actions skill": {
              "skill_variables": {
                // User location (origin)
                "User_Latitude": data.coords.latitude,
                "User_Longitude": data.coords.longitude,

                // Nearest Wafasalaf location (destination)
                "Nearest_Bank_Name": nearestLocation.name || "Wafasalaf",
                "Nearest_Bank_Distance": nearestLocation.distance || "N/A",
                "Nearest_Bank_Latitude": nearestLocation.lat,
                "Nearest_Bank_Longitude": nearestLocation.lng,

                // Formatted for directions API
                "Directions_Origin": originCoords,
                "Directions_Destination": destinationCoords,
                "Directions_URL": directionsUrl,
                "Directions_Destination_Name": destinationName
              },
            }
          }
        },
      });
    })
    .catch(error => {
      console.error("Error fetching nearest location:", error);
      // Fallback to user's location if there's an error
      const originCoords = `${data.coords.latitude},${data.coords.longitude}`;

      instance.send({
        input: {
          text: "Je n'ai pas pu trouver d'agence Wafasalaf à proximité. J'ai partagé ma localisation actuelle."
        },
        context: {
          "skills": {
            "actions skill": {
              "skill_variables": {
                "User_Latitude": data.coords.latitude,
                "User_Longitude": data.coords.longitude,
                "Nearest_Bank_Name": "Wafasalaf",
                "Nearest_Bank_Distance": "N/A",
                "Directions_Origin": originCoords,
                "Directions_Destination": "CIH Bank",
                "Directions_URL": `https://www.google.com/maps/embed/v1/search?key=AIzaSyAd3acpn2pZuAye8gk46LkFkMpPdmBQEFQ&q=Wafasalaf&center=${originCoords}`
              },
            }
          }
        },
      });
    });
}

/**
 * Fetches the nearest Wafasalaf location to the user
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @returns {Promise<Object>} Promise resolving to location data of nearest location
 */
function fetchNearestWafasalaf(userLat, userLng) {
  // Use current domain instead of hardcoded URL
  const serverUrl = window.location.origin;
  const proxyUrl = `${serverUrl}/api/places/nearby?lat=${userLat}&lng=${userLng}&radius=10000&keyword=CIH`;

  console.log("Fetching nearest location from:", proxyUrl);

  return fetch(proxyUrl, { mode: 'cors' })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Received data:", data);
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Find the closest location by calculating distance
        const closest = findClosestLocation(data.results, userLat, userLng);
        console.log("Closest location:", closest);
        return closest; // Return the complete location object
      } else {
        throw new Error(`No locations found. Status: ${data.status}`);
      }
    })
    .catch(error => {
      console.error("Fetch error details:", error);
      throw error;
    });
}

/**
 * Finds the closest location from a list of results
 * @param {Array} results - Array of location results from Google Places API
 * @param {number} userLat - User's latitude
 * @param {number} userLng - User's longitude
 * @returns {Object} Object with lat and lng of the closest location
 */
function findClosestLocation(results, userLat, userLng) {
  let closestLocation = null;
  let closestDistance = Infinity;

  results.forEach(location => {
    const locationLat = location.geometry.location.lat;
    const locationLng = location.geometry.location.lng;

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      userLat, userLng,
      locationLat, locationLng
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestLocation = {
        lat: locationLat,
        lng: locationLng,
        name: location.name,
        distance: distance.toFixed(2)
      };
    }
  });

  return closestLocation;
}

/**
 * Calculates distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Converts degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function deg2rad(deg) {
  return deg * (Math.PI/180);
}

/**
 * Handles errors when getting user location
 * @param {Object} error - Error object from geolocation API
 * @param {Object} instance - Watson Assistant instance
 */
function getLocationError(error, instance) {
  let text = "Une erreur s'est produite lors du partage de ma localisation.";

  // See https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError
  if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
    text = "Je ne souhaite pas partager ma localisation pour le moment.";
  } else if (error.code === GeolocationPositionError.POSITION_UNAVAILABLE) {
    text = "Le navigateur a rencontré une erreur lors du partage de ma localisation.";
  }

  instance.send({ input: { text } });
}

/**
 * Scrolls to an element with smooth animation
 * @param {HTMLElement} element - The element to scroll to
 */
function scrollToElement(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Extracts numeric value from a string containing a variable reference
 * @param {string} value - The string to parse
 * @param {string} text - Additional text to search in
 * @returns {string} The extracted numeric value
 */
function extractNumericValue(value, text = '') {
  if (typeof value === 'string' && value.includes('$step_')) {
    const matches = text.match(/avec la valeur (\d+)/);
    return matches && matches.length > 1 ? matches[1] : value;
  }
  return value;
}

/**
 * Updates form fields with values from the chatbot response
 * @param {Object} data - The user_defined data from the chatbot
 * @param {string} text - Additional text from the chatbot
 */
function updateFormFields(data, text) {
  const fields = {
    'loan-amount': extractNumericValue(data.amount, text),
    'loan-duration': extractNumericValue(data.duration, text),
    'project-type': data.project_type,
    'profession': data.profession
  };

  Object.entries(fields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element && value) {
      element.value = value;
      highlightElement(element, 'highlight');
      if (id === 'loan-amount') {
        scrollToElement(element);
      }
    }
  });

  const calculateBtn = document.getElementById('calculate-btn');
  if (calculateBtn) {
    setTimeout(() => highlightElement(calculateBtn, 'pulse'), 1000);
  }
}

/**
 * Main loan calculation function
 */
function calculateLoan() {
  const amount = parseFloat(document.getElementById('loan-amount').value);
  const duration = parseFloat(document.getElementById('loan-duration').value);

  if (!amount || !duration) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  const { monthlyPayment, totalCost } = calculateLoanPayment(amount, duration, INTEREST_RATE);

  document.getElementById('monthly-payment').textContent = monthlyPayment;
  document.getElementById('total-cost').textContent = totalCost;
  document.getElementById('result').style.display = 'block';
}

/**
 * Handles messages received from the chatbot
 */
function receiveHandler(event, instance) {
  if (!event.data?.output?.generic) return;

  const generic = event.data.output.generic;
  for (const message of generic) {
    // Handle form field filling
    if (message.user_defined?.user_defined_type === 'fill_all_fields') {
      updateFormFields(message.user_defined, message.text);
    }

    // Handle location sharing request
    if (message.user_defined?.user_defined_type === 'share_location') {
      navigator.geolocation.getCurrentPosition(
        data => takeLocation(data, instance),
        error => getLocationError(error, instance)
      );
    }

    // Handle Google Map display
    if (message.response_type === 'iframe' && message.user_defined?.user_defined_type === 'google_map') {
      // If needed, handle map display here
    }
  }
}

/**
 * Initializes the chatbot when the page loads
 */
async function onLoad(instance) {
  instance.on({ type: 'receive', handler: receiveHandler });
  await instance.render();
}

// Initialize Watson Assistant when the page loads
document.addEventListener('DOMContentLoaded', function() {
  window.watsonAssistantChatOptions = {
    integrationID: "2cbbd706-f711-41d6-bd81-83eee378f8ba",
    region: "au-syd",
    serviceInstanceID: "02cff0bf-6880-413a-a103-7e26e50ff214",
    onLoad: onLoad
  };

  const t = document.createElement('script');
  t.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
          (window.watsonAssistantChatOptions.clientVersion || 'latest') +
          "/WatsonAssistantChatEntry.js";
  document.head.appendChild(t);
});