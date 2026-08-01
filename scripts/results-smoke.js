const { io } = require('socket.io-client');
const url = process.env.TEST_URL || 'http://localhost:3108';
const host = io(url, { transports: ['websocket'] });
const guest = io(url, { transports: ['websocket'] });
let code, joined = false, started = false;
const timer = setTimeout(() => { console.error('results-timeout'); process.exit(1); }, 7000);
host.on('connect', () => host.emit('create', { name: 'Finalista A' }));
host.on('state', state => {
  code = state.code;
  if (!joined) { joined = true; guest.emit('join', { name: 'Finalista B', code }); return; }
  if (state.status === 'lobby' && state.players.length === 2 && !started) { started = true; host.emit('start'); return; }
  if (state.status === 'playing') { host.emit('finishRoom'); return; }
  if (state.status !== 'finished') return;
  const valid = state.finalResults?.length === 2 && state.finalResults.every((item, index) => item.rank === index + 1 && item.cash === 150000 && item.netWorth === 150000 && item.stats);
  if (!valid) { console.error('results-invalid'); process.exit(1); }
  clearTimeout(timer); console.log('resultados-finales: ok'); host.close(); guest.close(); process.exit(0);
});
