const fs = require('fs');
const { io } = require('socket.io-client');
const url = process.env.TEST_URL || 'http://localhost:3108';
const stateFile = process.env.TEST_STATE;
const mode = process.env.TEST_MODE || 'create';
const timer = setTimeout(() => { console.error('persistence-timeout'); process.exit(1); }, 6000);
if (mode === 'create') {
  const client = io(url, { transports: ['websocket'] });
  let session;
  client.on('connect', () => client.emit('create', { name: 'Persistente' }));
  client.on('session', value => { session = value; });
  client.on('state', state => {
    if (!session) return;
    fs.writeFileSync(stateFile, JSON.stringify(session));
    clearTimeout(timer); console.log('guardado: ok'); client.close(); process.exit(0);
  });
} else {
  const session = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const client = io(url, { transports: ['websocket'] });
  client.on('connect', () => client.emit('join', { code: session.code, reconnectToken: session.token, name: '' }));
  client.on('state', state => {
    const player = state.players.find(item => item.id === client.id);
    if (!player) return;
    if (player.name !== 'Persistente' || !player.connected) { console.error('restore-invalid'); process.exit(1); }
    clearTimeout(timer); console.log('restauracion-despues-de-reinicio: ok'); client.close(); process.exit(0);
  });
}
