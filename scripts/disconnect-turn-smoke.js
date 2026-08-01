const { io } = require('socket.io-client');
const url = process.env.TEST_URL || 'http://localhost:3108';
let code, token, joined = false, started = false, reconnecting = false;
const host = io(url, { transports: ['websocket'] });
const guest = io(url, { transports: ['websocket'] });
const timer = setTimeout(() => { console.error('disconnect-turn-timeout'); process.exit(1); }, 8000);
host.on('connect', () => host.emit('create', { name: 'Turno Pausado' }));
host.on('session', session => { code = session.code; token = session.token; });
host.on('state', state => {
  if (!token) return;
  if (!joined) { joined = true; guest.emit('join', { name: 'Anfitrion Nuevo', code }); return; }
  if (state.players.length === 2 && state.status === 'lobby' && !started) { started = true; host.emit('start'); return; }
  if (state.status === 'playing' && !reconnecting) { reconnecting = true; host.close(); }
});
guest.on('state', state => {
  if (!reconnecting || !state.turnPaused) return;
  if (state.host !== guest.id || state.players[state.turn].connected !== false || state.turnDeadline !== null) { console.error('pause-invalid'); process.exit(1); }
  const restored = io(url, { transports: ['websocket'] });
  restored.on('connect', () => restored.emit('join', { code, reconnectToken: token, name: '' }));
  restored.on('state', resumed => {
    const current = resumed.players[resumed.turn];
    if (current.id !== restored.id || !current.connected || resumed.turnPaused || resumed.turnDeadline !== null) return;
    clearTimeout(timer); console.log('pausa-reconexion-turno: ok'); restored.close(); guest.close(); process.exit(0);
  });
});
