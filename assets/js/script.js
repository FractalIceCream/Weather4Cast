var cityInput = $('.cityInput');
var citiesEl = $('.cities-container');
var currentWeatherEl = $('.currentEl');
var forecastEl = $('.forecastEl');

var apiKey = 'dd599feff2ed6390797666d649cd63e2';
var api = 'https://api.openweathermap.org/data/2.5/forecast';
var savedCities = [];

$(function () {
    //if no saved cities in local storage provide empty object otherwise get from local
    if (localStorage.getItem('savedCities') !== null && localStorage.getItem('savedCities') !== '') {
        savedCities = JSON.parse(localStorage.getItem('savedCities'));
    } else {
        savedCities = [];
    }

    //each object in array in localStorage populate saved cities onload
    for (var entry of savedCities) {
        addCityEl(entry.lat, entry.lon, entry.name, entry.state);
    }

    $(this).on('click', '.searchBtn', searchCity);
    $(this).on('click', '.cityBtn', displayCityWeather);
    $(this).on('click', '.removeBtn', removeCity);
});

//append city button and data
function addCityEl(lat, lon, city, state) {
    citiesEl.append($(`
    <div class="row justify-content-center text-start ms-2">
        <button type="button" class="btn cityBtn btn-secondary w-75 m-2 text-start" data-city="${city}" data-lat="${lat}" data-lon="${lon}">
            <i class="fa-solid fa-circle-xmark fa-lg removeBtn pe-3" style="color:black; height: 4px;"></i>
            ${city}, ${state}
        </button>
    </div>
    `));
}

//search user's city through openweather api and add/store/populate weather board
function searchCity(event) {
    if (cityInput.val() === "" | cityInput.val() === null) { //kill if input is blank
        return;
    }
    var capitalizedCity = cityInput.val().trim().charAt(0).toUpperCase() + cityInput.val().trim().slice(1);

    var check = savedCities.some(item => item.name === capitalizedCity);
    if (check) { return; } //kill if city already exists in saved cities

    var url = setGeoUrl(capitalizedCity, apiKey);
    fetch(url)
        .then(function (response) {
            if (response.status !== 200) {
                throw response.json();
            }
            return response.json();
        })
        .then(function (data) {
            var lat = data[0].lat,
                lon = data[0].lon,
                city = data[0].name,
                state = data[0].state;

            addCityEl(lat, lon, city, state); //add city button
            fetchCurrentWeather(lat, lon);  //get current weather
            fetchForecast(lat, lon);    //get forecast
            storeCity(lat, lon, city, state);   //store data
        });
}

//event to display current weather and forecast
function displayCityWeather(event) {
    var btnEvent = $(event.target);
    var lat = btnEvent.attr('data-lat');
    var lon = btnEvent.attr('data-lon');

    fetchCurrentWeather(lat, lon);
    fetchForecast(lat, lon);
}

//store data into localStorage
function storeCity(lat, lon, city, state) {
    savedCities.push({ name: city, state: state, lat: lat, lon: lon });
    localStorage.setItem('savedCities', JSON.stringify(savedCities));
}

//remove city button and remove from localStorage savedCities
function removeCity(event) {
    event.stopPropagation();
    var btnEvent = $(event.target);
    var city = btnEvent.parent().attr('data-city');
    var result = savedCities.findIndex(item => item.name === city);
    savedCities.splice(result, 1);

    localStorage.setItem('savedCities', JSON.stringify(savedCities));
    btnEvent.parent().parent().remove();
}

//api fetch current weather and call addCurrentWeather
function fetchCurrentWeather(lat, lon) {
    var url = getCurrentWeather(lat, lon, apiKey);
    fetch(url)
        .then(function (response) {
            if (response.status !== 200) {
                throw response.json();
            }
            return response.json();
        })
        .then(function (data) {
            addCurrentWeather(data.name, data.weather[0].icon, data.main.temp, data.wind.speed, data.main.humidity, data.dt);
        });
}

//append data to the board
function addCurrentWeather(city, icon, temp, speed, humidity, date) {
    var currentDay = dayjs.unix(date).format('(MM/DD/YYYY hh:mm:ssa)');
    var iconEl = $('.cIcon');
    iconEl.attr('style', 'width: 50px;');
    iconEl.attr('src', `https://openweathermap.org/img/wn/${icon}@2x.png`);

    $('.cCity').text(`${city} ${currentDay} `);
    $('.cTemp').text(`Temp: ${temp}\xB0F`);
    $('.cWind').text(`Wind Speed: ${speed}MPH`);
    $('.cHumidity').text(`Humidity: ${humidity}%`);
}

//api fecth forecast and append 5 days to the board
function fetchForecast(lat, lon) {
    var url = setForecastUrl(lat, lon, apiKey);
    fetch(url)
        .then(function (response) {
            if (response.status !== 200) {
                throw response.json();
            }
            return response.json();
        })
        .then(function (data) {
            var time, arrEl;
            forecastEl.text("");
            for (var i = 0; i < 5; i++) {
                arrEl = data.list[i * 8]; //40 data points from every 3 hr from api call
                time = dayjs.unix(arrEl.dt).format('MMM D, YYYY');
                forecastEl.append($(`
                <div class="col-lg-2 col-md-6 forecastDay border border-black h-25 bg-primary text-white">
                    <div>${time}</div>
                    <div><img src="https://openweathermap.org/img/wn/${arrEl.weather[0].icon}@2x.png" style="width:50px;"></div>
                    <div>Temp: ${arrEl.main.temp}\xB0F</div>
                    <div>Wind: ${arrEl.wind.speed}MPH</div>
                    <div>Humidity: ${arrEl.main.humidity}%</div>
                </div>
                `));
            }
        });
}

//set api urls

function setGeoUrl(city, apiKey) {
    return `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=5&appid=${apiKey}`;
}

function getCurrentWeather(lat, lon, apiKey) {
    return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
}

function setForecastUrl(lat, lon, apiKey) {
    return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
}