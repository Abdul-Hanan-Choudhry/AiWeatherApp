const API_KEY = '7e464c591905e9d3022d4e72be54cf7d';
const GEMINI_API_KEY = 'AIzaSyC3Bm8OhI-5M6fUUCYnf7_VQleeHI9WHac';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

let tempChart, conditionChart, tempLineChart;
let allForecastData = [];
let weatherContext = '';
let currentWeatherData = null;

document.getElementById('menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
});

document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    if (!sidebar.contains(e.target) && e.target !== menuBtn) {
        sidebar.classList.add('-translate-x-full');
    }
});

function showView(view) {
    document.getElementById('dashboard-view').classList.toggle('hidden', view !== 'dashboard');
    document.getElementById('tables-view').classList.toggle('hidden', view !== 'tables');
    document.getElementById('sidebar').classList.add('-translate-x-full');
}

async function searchWeather() {
    const city = document.getElementById('city-input').value;
    const unit = document.querySelector('input[name="unit"]:checked').value;
    if (city) {
        clearChatArea(); 
        currentWeatherData = await getWeather(city, unit);
        await getForecast(city, unit);
    }
}


async function getWeather(city, unit) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${API_KEY}`);
        const data = await response.json();
        displayWeather(data, unit);
        updateWeatherWidget(data);
        return data;
    } catch (error) {
        console.error('Error fetching weather:', error);
    }
}

function displayWeather(data, unit) {
    document.getElementById('city-name').textContent = `Weather in ${data.name}`;
    const temp = unit === 'metric' ? data.main.temp : (data.main.temp * 9/5) + 32;
    document.getElementById('temperature').textContent = `${Math.round(temp)}°${unit === 'metric' ? 'C' : 'F'}`;
    document.getElementById('condition').textContent = data.weather[0].description;
    document.getElementById('humidity').textContent = `Humidity: ${data.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `Wind Speed: ${data.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}`;
    document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

function updateWeatherWidget(data) {
    const widget = document.getElementById('weather-widget');
    const condition = data.weather[0].main.toLowerCase();
    const hour = new Date().getHours();
    let gradient;

    if (hour >= 6 && hour < 18) {
        switch (condition) {
            case 'clear':
                gradient = 'from-yellow-400 to-orange-500';
                break;
            case 'clouds':
                gradient = 'from-gray-300 to-gray-500';
                break;
            case 'rain':
                gradient = 'from-blue-400 to-blue-600';
                break;
            case 'snow':
                gradient = 'from-blue-100 to-blue-300';
                break;
            case 'thunderstorm':
                gradient = 'from-gray-600 to-gray-800';
                break;
            default:
                gradient = 'from-blue-500 to-blue-700';
        }
    } else {
        switch (condition) {
            case 'clear':
                gradient = 'from-indigo-800 to-purple-900';
                break;
            case 'clouds':
                gradient = 'from-gray-700 to-gray-900';
                break;
            case 'rain':
                gradient = 'from-blue-800 to-blue-900';
                break;
            case 'snow':
                gradient = 'from-blue-900 to-indigo-900';
                break;
            case 'thunderstorm':
                gradient = 'from-gray-800 to-black';
                break;
            default:
                gradient = 'from-gray-800 to-blue-900';
        }
    }

    widget.className = `bg-gradient-to-r ${gradient} p-6 rounded-lg shadow-lg mb-6 text-white transition-all duration-500 ease-in-out`;
}

async function getForecast(city, unit) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${API_KEY}`);
        const data = await response.json();
        allForecastData = processForecastData(data.list);
        displayForecast(allForecastData, unit);
        createCharts(allForecastData, unit);
        updateWeatherContext(allForecastData, unit);  // Add this line
    } catch (error) {
        console.error('Error fetching forecast:', error);
    }
}



function processForecastData(forecastList) {
    const processedData = [];
    const dailyData = {};

    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyData[date] || item.main.temp > dailyData[date].main.temp) {
            dailyData[date] = item;
        }
    });

    for (const date in dailyData) {
        processedData.push(dailyData[date]);
    }

    return processedData;
}

function displayForecast(forecastData, unit) {
    const forecastGrid = document.getElementById('forecast-grid');
    forecastGrid.innerHTML = '';

    forecastData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const card = document.createElement('div');
        card.className = 'bg-white p-4 rounded-lg shadow transition-all duration-300 hover:shadow-lg';
        card.innerHTML = `
            <h4 class="font-bold text-lg">${date.toLocaleDateString()}</h4>
            <p class="text-sm text-gray-600">${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            <img src="http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}" class="w-16 h-16 mx-auto my-2">
            <p class="text-2xl font-semibold">${Math.round(day.main.temp)}°${unit === 'metric' ? 'C' : 'F'}</p>
            <p class="text-sm">Feels like: ${Math.round(day.main.feels_like)}°${unit === 'metric' ? 'C' : 'F'}</p>
            <p class="text-sm">${day.weather[0].description}</p>
            <p class="text-sm">Humidity: ${day.main.humidity}%</p>
            <p class="text-sm">Wind: ${day.wind.speed} ${unit === 'metric' ? 'm/s' : 'mph'}</p>
        `;
        forecastGrid.appendChild(card);
    });
}
function createCharts(forecastData, unit) {
    const dates = forecastData.map(day => new Date(day.dt * 1000).toLocaleDateString());
    const temperatures = forecastData.map(day => day.main.temp);
    const conditions = forecastData.map(day => day.weather[0].main);

    const brightColors = {
        Clear: 'rgba(255, 200, 0, 0.8)',
        Clouds: 'rgba(169, 169, 169, 0.8)',
        Rain: 'rgba(30, 144, 255, 0.8)',
        Snow: 'rgba(255, 250, 250, 0.8)',
        Thunderstorm: 'rgba(138, 43, 226, 0.8)'
    };

    if (tempChart) tempChart.destroy();
    if (conditionChart) conditionChart.destroy();
    if (tempLineChart) tempLineChart.destroy();

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return value + '°' + (unit === 'metric' ? 'C' : 'F');
                    }
                }
            }
        },
        hover: {
            mode: 'nearest',
            intersect: true
        },
    };

    tempChart = new Chart(document.getElementById('temp-chart'), {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: `Temperature (°${unit === 'metric' ? 'C' : 'F'})`,
                data: temperatures,
                backgroundColor: temperatures.map(temp => 
                    temp > 25 ? 'rgba(255, 99, 132, 0.8)' :
                    temp > 15 ? 'rgba(255, 159, 64, 0.8)' :
                    'rgba(54, 162, 235, 0.8)'
                ),
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: '5-Day Temperature Forecast'
                },
            },
        }
    });

    const conditionCounts = conditions.reduce((acc, condition) => {
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
    }, {});

    conditionChart = new Chart(document.getElementById('condition-chart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(conditionCounts),
            datasets: [{
                data: Object.values(conditionCounts),
                backgroundColor: Object.keys(conditionCounts).map(condition => brightColors[condition] || 'rgba(75, 192, 192, 0.8)')
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Weather Conditions Distribution'
                },
            },
        }
    });

    tempLineChart = new Chart(document.getElementById('temp-line-chart'), {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: `Temperature (°${unit === 'metric' ? 'C' : 'F'})`,
                data: temperatures,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true,
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Temperature Trend'
                },
            },
        }
    });
}

function updateWeatherContext(forecastData, unit) {
    const dailyData = forecastData.filter((item, index) => index % 8 === 0);
    weatherContext = `Weather forecast for the next 5 days:\n`;
    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000).toLocaleDateString();
        weatherContext += `${date}: Temperature ${day.main.temp}°${unit === 'metric' ? 'C' : 'F'}, ${day.weather[0].description}\n`;
    });
}

function applyFilter(filterType) {
    let filteredData = [...allForecastData];

    switch (filterType) {
        case 'ascending':
            filteredData.sort((a, b) => a.main.temp - b.main.temp);
            break;
        case 'descending':
            filteredData.sort((a, b) => b.main.temp - a.main.temp);
            break;
        case 'rainy':
            filteredData = filteredData.filter(day => day.weather[0].main.toLowerCase().includes('rain'));
            break;
        case 'highest':
            filteredData = [filteredData.reduce((max, day) => max.main.temp > day.main.temp ? max : day)];
            break;
    }

    displayForecast(filteredData, document.querySelector('input[name="unit"]:checked').value);
    createCharts(filteredData, document.querySelector('input[name="unit"]:checked').value);
}

async function sendChatMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value;
    if (message) {
        appendChatMessage('You', message);
        chatInput.value = '';

        try {
            const response = await callGeminiAPI(message);
            appendChatMessage('Bot', response);
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            appendChatMessage('Bot', 'Sorry, I encountered an error. Please try again.');
        }
    }
}

async function callGeminiAPI(message) {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are a weather assistant chatbot. You have access to the following weather data:\n${weatherContext}\n\nUser question: ${message}\n\nIf the question is related to the provided weather data, answer based on that information. If it's a general question or not related to the provided weather data, provide a general response to the best of your ability. Always stay in character as a weather assistant.`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
                stopSequences: []
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function appendChatMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `mb-2 ${sender === 'You' ? 'text-right' : 'text-left'}`;
    const innerElement = document.createElement('span');
    innerElement.className = `inline-block p-2 rounded-lg ${sender === 'You' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`;
    innerElement.textContent = `${sender}: ${message}`;
    messageElement.appendChild(innerElement);
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function clearChatArea() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    weatherContext = '';
}


function applyVisualEnhancements() {
    const forecastGrid = document.getElementById('forecast-grid');
    forecastGrid.style.background = 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)';
    forecastGrid.style.borderRadius = '15px';
    forecastGrid.style.padding = '20px';
    forecastGrid.style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';

    const forecastCards = forecastGrid.querySelectorAll('.forecast-card');
    forecastCards.forEach((card, index) => {
        card.style.background = `linear-gradient(120deg, hsl(${index * 30}, 70%, 80%) 0%, hsl(${index * 30 + 60}, 70%, 80%) 100%)`;
        card.style.borderRadius = '10px';
        card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        card.style.transition = 'transform 0.3s ease';
    });

    const chatArea = document.getElementById('chat-area');
    chatArea.style.background = 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)';
    chatArea.style.borderRadius = '15px';
    chatArea.style.padding = '20px';
    chatArea.style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';

    const chatMessages = document.querySelectorAll('.chat-message');
    chatMessages.forEach((message, index) => {
        message.style.background = index % 2 === 0 ? '#ffffff' : '#f0f0f0';
        message.style.borderRadius = '10px';
        message.style.padding = '10px';
        message.style.marginBottom = '10px';
        message.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    const chartArea = document.getElementById('chart-area');
    chartArea.style.background = 'linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%)';
    chartArea.style.borderRadius = '15px';
    chartArea.style.padding = '20px';
    chartArea.style.boxShadow = '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';

    const chartCanvases = chartArea.querySelectorAll('canvas');
    chartCanvases.forEach((canvas) => {
        canvas.style.borderRadius = '10px';
        canvas.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    });
}




// Event listeners
document.getElementById('chat-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
});

document.getElementById('filter-ascending').addEventListener('click', () => applyFilter('ascending'));
document.getElementById('filter-descending').addEventListener('click', () => applyFilter('descending'));
document.getElementById('filter-rainy').addEventListener('click', () => applyFilter('rainy'));
document.getElementById('filter-highest').addEventListener('click', () => applyFilter('highest'));

document.querySelectorAll('input[name="unit"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (currentWeatherData) {
            const newUnit = radio.value;
            displayWeather(currentWeatherData, newUnit);
            getForecast(currentWeatherData.name, newUnit);
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    applyVisualEnhancements();
    showView('dashboard');
});


