import { connect } from 'cloudflare:sockets';

let userID = '38eadc27-ae6c-4563-9db2-810711fa8302';
let proxyIP = 'cdn.cloudflare.net';

if (!isValidUUID(userID)) {
  throw new Error('uuid is not valid');
}

export default {
  async fetch(request, env, ctx) {
    try {
      userID = env.UUID || userID;
      proxyIP = env.PROXYIP || proxyIP;
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        const url = new URL(request.url);
        switch (url.pathname) {
          case '/':
            return new Response(JSON.stringify(request.cf), { status: 200 });
          case `/${userID}`:
            const vlessConfig = getVLESSConfig(userID, request.headers.get('Host'));
            return new Response(`${vlessConfig}`, {
              status: 200,
              headers: {
                "Content-Type": "text/plain;charset=utf-8",
              }
            });
          default:
            return new Response('Not found', { status: 404 });
        }
      }
    } catch (err) {
      return new Response(err.toString());
    }
  }
};

function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

function getVLESSConfig(userID, hostName) {
  return `vless://${userID}@${hostName}:443?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}#Cloudflare-Vpn`;
}
