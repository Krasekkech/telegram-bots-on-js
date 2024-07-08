const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEATHER_TOKEN = process.env.WEATHER_API_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function get_weather_info(place, token){
    const url = process.env.WEATHER_API_URL;
    const param = {
        q: place,
        appid: token,
        lang: "ru",
        units: "metric"
    }

    const queryString = new URLSearchParams(param).toString();
    const requestUrl = `${url}?${queryString}`;

    try {
        const response = await fetch(requestUrl);
        if (response.ok) {
            return await response.json();
        } else {
            console.error(`Ошибка HTTP:` + response.status);
            return "Ошибка при получении информации о погоде";
        }
    } catch (error) {
        console.error("Ошибка при получении информации о погоде:", error);
        return "Ошибка при получении информации о погоде";
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

async function send_voice(voice, chatId) {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('voice', new Blob([voice], { type: 'audio/ogg' }), 'voice.ogg');
    await fetch(`${TELEGRAM_API_URL}/sendVoice`, {
        method: 'POST',
        body: formData
    });
}

async function download_file(fileId) {
    const getFileParams = { file_id: fileId };

    const getFileResponse = await fetch(`${TELEGRAM_API_URL}/getFile`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(getFileParams)
    });
    const fileData = await getFileResponse.json();
    const filePath = fileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    const downloadResponse = await fetch(downloadUrl);
    const fileBuffer = await downloadResponse.arrayBuffer();
    return Buffer.from(fileBuffer);
}


function deg_decoder(deg){
    switch (true) {
        case deg === 0:
            return "C"
        case deg < 90:
            return "СВ"
        case deg === 90:
            return "В"
        case deg < 180:
            return "ЮВ"
        case deg === 180:
            return "Ю"
        case deg < 270:
            return "ЮЗ"
        case deg === 270:
            return "З"
        case deg < 360:
            return "СЗ"
        case deg === 360:
            return "C"
    }
}

function unix_convertor(time){
    const date = new Date(time * 1000);

    const hours = date.getHours() + 3;

    const minutes = "0" + date.getMinutes();

    return `${hours}:${minutes.substr(-2)}`
}
async function stt(voice, token) {
    const url = 'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'audio/ogg'
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: voice
    });
    const data = await response.json();
    return data.result;
}

async function tts(text, token) {
    const url = 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize';
    const params = new URLSearchParams({
        text: text,
        voice: 'ermil',
        emotion: 'good'
    });
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: params
    });
    const audioBuffer = await response.arrayBuffer();
    return Buffer.from(audioBuffer);
}




module.exports.handler = async (event, context) =>{

    const yc_token = context.token.access_token;

    const FUNCTION_ACCESS = {
        statusCode: 200,
        body: ''
    }


    const update = JSON.parse(event.body);

    const message = update.message;

    const message_id = message.message_id;
    const chat_id = message.chat.id;

    if (message.text) {
        if (message.text === "/start" || message.text === "/help"){
            send_message("Я расскажу о текущей погоде для населенного пункта. \n \nЯ могу ответить на: \n- Текстовое сообщение с названием населенного пункта. \n- Голосовое сообщение с названием населенного пункта.\n - Сообщение с геопозицией.", chat_id, message_id);
            return FUNCTION_ACCESS
        }else {
            const place = message.text;
            const weather_data = await get_weather_info(place, WEATHER_TOKEN);
            if(weather_data !== "Ошибка при получении информации о погоде"){
                const weather_info = weather_data.weather[0].description.charAt(0).toUpperCase() + weather_data.weather[0].description.slice(1);
                const temperature = weather_data.main.temp;
                const temp_feel_like = weather_data.main.feels_like;
                const pressure = weather_data.main.pressure;
                const humidity = weather_data.main.humidity;
                const visibility = weather_data.visibility;
                const wind_speed = weather_data.wind.speed;
                const wind_deg = deg_decoder(weather_data.wind.deg);
                const sunrise_time = unix_convertor(weather_data.sys.sunrise);
                const sunset_time = unix_convertor(weather_data.sys.sunset);

                const message = `${weather_info}. \nТемпература ${temperature} ℃, ощущается как ${temp_feel_like} ℃. \nАтмосферное давление ${pressure} мм рт. ст. \nВлажность ${humidity} %. \nВидимость ${visibility} метров. \nВетер ${wind_speed} м/с ${wind_deg}. \nВосход солнца ${sunrise_time} МСК. Закат ${sunset_time} МСК. `

                send_message(message, chat_id, message_id);
            } else {
                send_message("Извините, не удалось получить информацию о погоде для данного места.", chat_id, message_id);
            }
            return FUNCTION_ACCESS;
        }
    }
    if (message.voice) {
        const voice = message.voice;

        if (voice.duration > 30) {
            const error_text = "Голосовое сообщение должно быть короче 30 секунд";
            await send_message(error_text, chat_id, message_id);
            return FUNCTION_ACCESS;
        }

        const voice_content = await download_file(voice.file_id);
        const place = await stt(voice_content, yc_token);
        const weather_data = await get_weather_info(place, WEATHER_TOKEN);
        if(weather_data !== "Ошибка при получении информации о погоде") {
            const text = `Населенный пункт ${place}. ${weather_data.weather[0].description}. Температура ${Math.round(weather_data.main.temp)} градусов цельсия. Ощущается как ${Math.round(weather_data.main.feels_like)} градусов цельсия. Давление ${Math.round(weather_data.main.pressure)} миллиметров ртутного столба. Влажность ${Math.round(weather_data.main.humidity)} процентов. `
            const yc_tts_voice = await tts(text, yc_token);
            await send_voice(yc_tts_voice, chat_id);
        }
        else {
            send_message("Извините, не удалось получить информацию о погоде для данного места.", chat_id, message_id);
        }
    }
    return FUNCTION_ACCESS
}