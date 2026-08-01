const { io } = require('socket.io-client');
const url = process.env.TEST_URL || 'http://localhost:3108';
const client = io(url, { transports: ['websocket'] });
let chatSent = false;
const timer = setTimeout(() => { console.error('timeout'); process.exit(1); }, 5000);
client.on('connect', () => client.emit('create', { name: 'Prueba' }));
client.on('state', state => {
  const me = state.players.find(player => player.id === client.id);
  if (me?.token === 'frog') {
    const invalid = state.decks || state.offers || state.board.length !== 40
      || state.board[0].name !== 'SALIDA' || state.board[1].name !== 'Marruecos'
      || state.board[10].name !== 'DEPORTADO' || state.board[20].name !== 'AUSTRALIA'
      || state.board[39].name !== 'Alemania' || me.money !== 150000
      || state.board[1].group !== state.board[4].group
      || state.board[21].group !== state.board[24].group
      || state.board[26].group !== state.board[29].group
      || state.board[1].rents?.length !== 6 || state.board[1].mortgage !== 6000
      || state.board[1].rents[0] !== 1500 || state.board[1].rents[5] !== 60000
      || state.board[1].houseCost !== 5000 || state.board[6].rents[1] !== 9500
      || state.board[7].rents[2] !== 30500 || state.board[9].rents[5] !== 190000
      || state.bankBuildings !== undefined;
    if (invalid) { console.error('tablero, economia, construcciones, bloques o privacidad invalidos'); process.exit(1); }
    if (!chatSent) { chatSent = true; client.emit('sendChat', 'Hola viajeros'); return; }
    if (state.chatMessages?.at(-1)?.text !== 'Hola viajeros') return;
    clearTimeout(timer); console.log('seleccion-ficha-chat: ok'); client.close(); process.exit(0);
  }
  if (state.status === 'lobby') client.emit('selectToken', 'frog');
});
