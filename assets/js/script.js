const apiKey = "e18e0d6d656219def625378423208939";

const inputEl = document.getElementById("search-input");
const errorMsg = document.getElementById("error-msg");
const searchBtn = document.getElementById("search-btn");
const historyEl = document.getElementById("history");
const clearBtn = document.getElementById("clear-btn");
const weatherEl = document.getElementById("weather");
const cityNameEl = document.getElementById("city-name");
const dateToday = document.getElementById("date-today");
const iconToday = document.getElementById("icon-today");
const tempToday = document.getElementById("temp-today");
const windToday = document.getElementById("wind-today");
const humToday = document.getElementById("hum-today");
const dayBoxes = document.getElementsByClassName("day-box");
let searchHistory = JSON.parse(localStorage.getItem("search")) || [];

const weatherIcons = {
    "01d": String.fromCodePoint(0x2600), // clear sky
    "01n": String.fromCodePoint(0x2600), // clear sky (night)
    "02d": String.fromCodePoint(0x1f324), // few clouds
    "02n": String.fromCodePoint(0x1f324), // few clouds (night)
    "03d": String.fromCodePoint(0x26c5), // scattered clouds
    "03n": String.fromCodePoint(0x26c5), // scattered clouds (night)
    "04d": String.fromCodePoint(0x2601), // broken clouds
    "04n": String.fromCodePoint(0x2601), // broken clouds (night)
    "09d": String.fromCodePoint(0x1f326), // shower rain
    "10d": String.fromCodePoint(0x1f327), // rain
    "10n": String.fromCodePoint(0x1f327), // rain (night)
    "11d": String.fromCodePoint(0x1f329), // thunderstorm
    "11n": String.fromCodePoint(0x1f329), // thunderstorm (night)
    "13d": String.fromCodePoint(0x2744), // snow
    "13n": String.fromCodePoint(0x2744), // snow (night)
    "50d": String.fromCodePoint(0x1f32b), // mist
    "50n": String.fromCodePoint(0x1f32b) // mist (night)
}

// on load, render the current history and pull up the last search city's weather report (if applicable)
function init() {
    renderHistory();
    if (historyEl.firstChild) {
        const lastCity = historyEl.firstChild.innerText;
        getWeather(lastCity);
    }
};

// render the history buttons
function renderHistory() {
    // remove the current history buttons
    while (historyEl.firstChild) {
        historyEl.removeChild(historyEl.lastChild);
    };

    // add new buttons based on values from the searchHistory array
    for (var i = 0; i < searchHistory.length; i++) {
        const historyBtn = document.createElement("button");
        // reverse the order of the array so the newest search shows at the top
        historyBtn.textContent = searchHistory.slice().reverse()[i];

        historyEl.appendChild(historyBtn);

        // perform a search for the button text on click
        const searchTerm = historyBtn.textContent;
        historyBtn.addEventListener("click", function() {
            getWeather(searchTerm);
        }); 
    };
};

// when search button is clicked...
searchBtn.addEventListener("click", function() {
    const searchTerm = inputEl.value;
    getWeather(searchTerm);
});

// ... render the full weather report
function getWeather(city) {
    // get today's weather
    const queryUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + apiKey + "&units=imperial";
    
    fetch(queryUrl)
    .then (function (response) {
        if (response.ok) {
            response.json()
            // render today's weather
            .then (function (todaysWeather) {
                // store the city in localStorage only after it returns a successful result
                // if the city is already in history, delete it and re-add it at the end of the array
                if (searchHistory.includes(city)) {
                    const indexCity = searchHistory.indexOf(city);
                    // delete the city from the array (leaves a null value)
                    delete searchHistory[indexCity];
                    // remove null values from array
                    searchHistory = searchHistory.filter(n => n);
                };
                searchHistory.push(city);
                localStorage.setItem("search",JSON.stringify(searchHistory));
                renderHistory();
                
                cityNameEl.textContent = todaysWeather.name;
                dateToday.textContent = convertDate(todaysWeather.dt);
                iconToday.textContent = weatherIcons[todaysWeather.weather[0].icon];
                tempToday.textContent = todaysWeather.main.temp;
                windToday.textContent = todaysWeather.wind.speed;
                humToday.textContent = todaysWeather.main.humidity;

                // get the latitude and longitude to use for the forecast query
                const lat = todaysWeather.coord.lat;
                const lon = todaysWeather.coord.lon;

                // get five day forecast
                const forecastQueryUrl = "https://api.openweathermap.org/data/2.5/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + apiKey + "&units=imperial";
                
                fetch (forecastQueryUrl)
                .then (function (response) {
                    if (response.ok) {
                        response.json()
                        // render five day forecast
                        .then (function (forecast) {
                            // variable for incrementing
                            let listIndex = 0;
                            // for each of the five days...
                            for (var i = 0; i < 5; i++) {
                                // define the DOM elements for the selected box based on the index
                                const dateEl = dayBoxes[i].querySelector(".date");
                                const iconEl = dayBoxes[i].querySelector(".emoji");
                                const tempEl = dayBoxes[i].querySelector(".temp");
                                const windEl = dayBoxes[i].querySelector(".wind");
                                const humEl = dayBoxes[i].querySelector(".hum");

                                // populate the data for each box, but skip the hourly forecasts via listIndex
                                dateEl.textContent = convertDate(forecast.list[listIndex].dt);
                                iconEl.textContent = weatherIcons[forecast.list[listIndex].weather[0].icon];
                                tempEl.textContent = forecast.list[listIndex].main.temp;
                                windEl.textContent = forecast.list[listIndex].wind.speed;
                                humEl.textContent = forecast.list[listIndex].main.humidity;

                                // increment listIndex so it skips the hourly forecasts (24 hours/3 = 8)
                                listIndex += 8;
                            };

                            // unhide the initially hidden weather section once the whole thing is populated
                            if (weatherEl.classList.contains("invisible")) {
                                weatherEl.classList.remove("invisible");
                            };
                        });
                    };
                });
            });
        } else {
            // display an error message if result is invalid
            errorMsg.classList.remove("hidden");
    
            // wait three seconds, then hide it again
            setTimeout(function() {
                errorMsg.classList.add("hidden");
            }, 3000);
        };
    
    });
};

// when clear history is clicked, clear stored history and the buttons
clearBtn.addEventListener("click", function() {
    // empty the localStorage and the parsed array
    localStorage.removeItem("search");
    searchHistory = [];

    // remove all history buttons
    while (historyEl.firstChild) {
        historyEl.removeChild(historyEl.lastChild);
    };

    // hide the weather report
    //if (!weatherEl.classList.contains("invisible")) {
    //    weatherEl.classList.add("invisible");
    //};
});

// convert the date from Unix timestamp to readable
function convertDate(unixDate) {
    let today = new Date(unixDate * 1000);
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    today = mm + "/" + dd + "/" + yyyy;
    return today;
}

init();
