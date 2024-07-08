const FUNC_RESPONSE = {
    statusCode: 200,
    body: ''
};

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

function send_message(text, message) {
    const message_id = message.message_id;
    const chat_id = message.chat.id;
    const reply_message = {
        chat_id: chat_id,
        text: text,
        reply_to_message_id: message_id
    };

    fetch(TELEGRAM_API_URL + "/sendMessage", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reply_message)
    }).then(response =>{
        if(response.ok){
            console.log('The Message has been sent!')
        }
    });
}

module.exports.handler = async (event, context) => {

    if (!TELEGRAM_BOT_TOKEN) {
        return FUNC_RESPONSE;
    }

    const update = JSON.parse(event.body);

    if (!update.message) {
        return {
            statusCode: 200,
            body: update,
        };
    }

    const message_in = update.message;

    if (!message_in.text) {
        send_message('Могу обработать только текстовое сообщение!', message_in);
        return FUNC_RESPONSE;
    }

    const echo_text = message_in.text.toUpperCase();


    send_message(echo_text, message_in);

    return FUNC_RESPONSE
};