const { io } = require('socket.io-client');
const url = process.env.TEST_URL || 'http://localhost:3108';
let roomCode, reconnectToken, originalName;
const timer = setTimeout(() => { console.error('reconnect-timeout'); process.exit(1); }, 7000);
const first = io(url, { transports: ['websocket'] });
first.on('connect', () => first.emit('create', { name: 'Reconecta' }));
first.on('session', session => { roomCode = session.code; reconnectToken = session.token; });
first.on('state', state => {
  const me = state.players.find(player => player.id === first.id);
  if (!me || !reconnectToken) return;
  originalName = me.name;
  first.close();
  const second = io(url, { transports: ['websocket'] });
  second.on('connect', () => second.emit('join', { code: roomCode, reconnectToken, name: '' }));
  second.on('state', restored => {
    const recovered = restored.players.find(player => player.id === second.id);
    if (!recovered) return;
    if (restored.players.length !== 1 || recovered.name !== originalName || recovered.connected !== true || recovered.bankrupt || recovered.reconnectToken || recovered.connectionId) {
      console.error('reconnect-state-invalid'); process.exit(1);
    }
    clearTimeout(timer); console.log('reconexion: ok'); second.close(); process.exit(0);
  });
});
