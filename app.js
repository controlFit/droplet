const http = require('http');
const { createProvider} = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

const main = async () => {
    const adapterDB = new MockAdapter();
    //const adapterFlow = createFlow([flowPrincipal]);
    const adapterProvider = createProvider(BaileysProvider);

    /*const bot = createBot({
        //flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });*/

    QRPortalWeb();

    // Crear un servidor HTTP para manejar solicitudes POST
    const server = http.createServer((req, res) => {
        console.log('Solicitud recibida:', req.method, req.url);
        if (req.method === 'POST' && req.url === '/send-message') {
            let body = '';

            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const {number, message } = JSON.parse(body);
                    const formattedNumber = '${number}@s.whatsapp.net';
            
                        // Extraer todas las URLs de imágenes del mensaje
                    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|pdf|xml|mp4))/ig;
                    const urlMatches = message.match(urlRegex);
                    const textWithoutUrls = message.replace(urlRegex, '').trim();

                        // Enviar texto primero si hay texto aparte de las URLs
                    if (textWithoutUrls) {
                        await adapterProvider.sendText(formattedNumber, textWithoutUrls);
                    }

                        // Luego, si hay URLs de imagen, enviar cada imagen
                    if (urlMatches && urlMatches.length > 0) {
                        for (const imageUrl of urlMatches) {
                            await adapterProvider.sendMedia(formattedNumber, imageUrl); // Asegúrate de que este método es correcto según tu proveedor
                        }
                    }

            
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Mensaje y/o imagen enviados' }));
                } catch (error) {
                    console.error(error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                }
            });
        }else if(req.method === 'GET' && req.url === '/qr'){
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'C:/Control Fit/api_whatsapp/bot.qr.png' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });

    server.listen(3001, () => {
        console.log('Servidor HTTP corriendo en el puerto 3001');
    });
};

main();