const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEATHER_TOKEN = process.env.WEATHER_API_ID;
const TELEGRAM_API_URL = "https://api.telegram.org/bot7132393270:AAEmLSZa2vr4zvABInWEmpjVNsZ9JScgOYk";

async function get_weather_info(place, token){
    const url = process.env.WEATHER_API_URL;
    const param = {
        q: place,
        appid: token,
        lang: "ru",
        units: "metric"
    }

    const queryString = new URLSearchParams(param).toString();
    const requestUrl = url + "?" + queryString;

    try {
        const response = await fetch(requestUrl);
        if (response.ok) {
            return await response.json();
        } else {
            console.error("Ошибка HTTP: " + response.status);
        }
    } catch (error) {
        console.error("Ошибка при получении температуры:", error);
        return "Ошибка при получении температуры";
    }

}


function send_message(text, chat_id, message_id) {

    const reply_parameters = {
        message_id: message_id
    };

    const param ={
        chat_id: chat_id,
        text: text,
        reply_parameters: reply_parameters

    }

    fetch(TELEGRAM_API_URL + "/sendMessage", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(param)
    }).then(response =>{
        if(response.ok){
            console.log('The Message has been sent!')
        }
    });
}

const weather_data = '';




module.exports.handler = async (event, context) =>{

    const FUNCTION_ACCESS = {
        statusCode: 200,
        body: ''
    }




    const update = JSON.parse(event.body);

    const message = update.message;

    const message_id = message.message_id;
    const chat_id = message.chat.id;

    if (message.text) {
        const place = message.text;
        const weather_data = await get_weather_info(place, WEATHER_TOKEN);
        if(weather_data !== "Ошибка при получении температуры"){
            console.log(weather_data)
            const weather_info = weather_data.weather[0].description.charAt(0).toUpperCase() + weather_data.weather[0].description.slice(1);
            const temperature = weather_data.main.temp;
            const temp_feel_like = weather_data.main.feels_like;
            const pressure = weather_data.main.pressure;
            const humidity = weather_data.main.humidity;
            const visibility = weather_data.visibility;
            const wind_speed = weather_data.wind.speed;
            const wind_deg = weather_data.wind.deg;

            const message = `${weather_info}. \n Температура ${temperature} ℃, ощущается как ${temp_feel_like} ℃. \n Атмосферное давление ${pressure} мм рт. ст. \n Влажность ${humidity} %. \n Видимость ${visibility} метров. \n Ветер ${wind_speed} м/с ${wind_deg}.`

            send_message(message, chat_id, message_id);
        } else {
            send_message("Извините, не удалось получить информацию о погоде для данного места.", chat_id, message_id);
        }
        return FUNCTION_ACCESS;
    }

}