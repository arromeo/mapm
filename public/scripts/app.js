
// Initialize Google Maps API map
function initGoogleMaps(points) {
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12
  });

  console.log(points);
  const service = new google.maps.places.PlacesService(map);
  const markers = [];
  var markerBounds = new google.maps.LatLngBounds();
  let boundPoint;
  points.forEach(element => {
    console.log(element);
    boundPoint = new google.maps.LatLng(element.lat, element.lng);
    markerBounds.extend(boundPoint);
    const request = {
      placeId: element.placeId,
      fields: ['place_id','name', 'rating', 'formatted_phone_number', 'geometry', 'photos', 'formatted_address']
    };

    service.getDetails(request, callback);

    function callback(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const aMarker = newMaker(place);
        aMarker.setVisible(true);
        markers.push(aMarker);

        aMarker.addListener('click', () => {
          setInfoWindowContent(place);
          infowindow.open(map, aMarker);
        });
      }
    }
  });
  console.log(markerBounds);

  map.fitBounds(markerBounds);
  map.panToBounds(markerBounds);
  // map.setCenter(bounds.getCenter());

  function newMaker(place) {
    const aMarker = new google.maps.Marker({
      map: map,
      place: {
        placeId: place.place_id,
        location: place.geometry.location,
      }
    });

    return aMarker;
  }

  function setInfoWindowContent(place) {
    if (place.photos !== undefined) {
      infowindowContent.children['place-photo'].src = place.photos[0].getUrl({ 'maxWidth': 100, 'maxHeight': 100 });
    } else {
      infowindowContent.children['place-photo'].src = '/images/map-image-placeholder.png';
    }
    infowindowContent.children['place-name'].textContent = place.name;
    infowindowContent.children['place-description'].textContent = place.formatted_address;
  }

  const searchInput = document.getElementById('pac-input');

  let autocomplete = new google.maps.places.Autocomplete(searchInput);
  autocomplete.bindTo('bounds', map);

  let infowindow = new google.maps.InfoWindow();
  let infowindowContent = document.getElementById('infowindow-content');
  infowindow.setContent(infowindowContent);

  let marker = new google.maps.Marker({
    map: map
  });

  marker.addListener('click', () => {
    infowindow.open(map, marker);
  });

  google.maps.event.addListener(map, 'click', function(event) {
    google.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map, marker);
    });
  });

  // Empty array for points data
  const selectedMapPoints = [];

  // Submit points data using AJAX when clicking the category form button
  $('#category-form-button').on('click', (event) => {
    event.preventDefault();
    let prunedPoints = selectedMapPoints.map(({lat, lng, placeId, title, description}) => ({lat, lng, placeId, title, description}));

    $.ajax({
      url: '/api/categories',
      type: 'POST',
      data: {
        'category': $('#save-category-form').serializeArray(),
        'mapPoints': prunedPoints},
      success: function(response) {
        console.log('hitting this');
        console.log(response.url);
        window.location.replace(response.url);
      },
    });
  });

  autocomplete.addListener('place_changed', () => {
    infowindow.close();

    const place = autocomplete.getPlace();

    if (!place.geometry) {
      return;
    }

    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }

    // Set the position of the marker using the place ID and location
    marker.setPlace({
      placeId: place.place_id,
      location: place.geometry.location
    });

    marker.setVisible(true);

    // If place has photos, load first one; if it doesn't, load placeholder image
    if (place.photos !== undefined) {
      infowindowContent.children['place-photo'].src = place.photos[0].getUrl({ 'maxWidth': 100, 'maxHeight': 100 });
    } else {
      infowindowContent.children['place-photo'].src = '/images/map-image-placeholder.png';
    }

    infowindowContent.children['place-name'].textContent = place.name;
    infowindowContent.children['place-description'].textContent = place.formatted_address;
    infowindow.open(map, marker);

    // Get latitude and longitude of point
    const pointLat = place.geometry.location.lat();
    const pointLng = place.geometry.location.lng();

    // Point data from each point selected on the map
    const pointData = {
      lat: Number(pointLat),
      lng: Number(pointLng),
      placeId: place.place_id,
      title: place.name,
      description: place.formatted_address
    };

    // Push pointData to empty array
    selectedMapPoints.push(pointData);

    // Displays the clicked item in the list below
    $('.list-group').append($('<li>', {class: 'list-group-item d-flex justify-content-between align-items-center'}).text(place.name));
    // Use to print points to a map
    // map.data.addGeoJson(cachedGeoJson);
  });

  // Show map and search input after last event is loaded (tilesloaded)
  google.maps.event.addListenerOnce(map, 'tilesloaded', function() {
    document.getElementById('map').style.visibility = 'visible';

    if (!$('[data-category-name]').length) {
      searchInput.style.display = 'block';
    }
  });
}

$(document).ready(() => {
  $('.home-hero--image').parallax({
    imageSrc: '/images/home-hero-image.jpeg',
    naturalWidth: 960,
    naturalHeight: 627,
    speed: 0.5,
  });
  let points = [];
  let re = new RegExp('^\/api\/categories\/[0-9]+$');
  if (re.test(window.location.pathname)) {
    var path = window.location.pathname.slice(16);

  $.ajax({
    method: "GET",
    url: `/api/categories/${path}/points`,
  }).done((result) => {
    result.pointData.forEach((point) => {
      points.push({
        lat: point.lat,
        lng: point.long,
        placeId: point.place_id,
      });
    });
    initGoogleMaps(points);
  });
  } else {
    console.log('happening');
    initGoogleMaps(points);
  }

});
