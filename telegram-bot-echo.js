// module.exports.bot = async (event) => {
//
//     const body = JSON.parse(event.body);
//
//     const msg = {
//         'method': 'sendMessage',
//         'chat_id': body.message.chat.id,
//         'text': body.message.text
//     };
//
//     return {
//         'statusCode': 200,
//         'headers': {
//             'Content-Type': 'application/json'
//         },
//         'body': JSON.stringify(msg),
//         'isBase64Encoded': false
//     };
// };
const FUNC_RESPONSE = {
    statusCode: 200,
    body: ''
};


const TELEGRAM_API_URL = "https://api.telegram.org/bot7063379967:AAFUSOjf-U1loFjcDkEXU66jcQ9kOel9TV8";

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
            console.log('Message sent!')
        }
    });
}

exports.handler = async (event, context) => {

    const update = JSON.parse(event.body);


    if (!update.message) {
        return {
            statusCode: 200,
            body: update,
        };
    }

    const message_in = update.message;

    const echo_text = message_in.text.toUpperCase();

    send_message(echo_text, message_in);

    return FUNC_RESPONSE;
};