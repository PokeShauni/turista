const {io}=require('socket.io-client');
const url=process.env.TEST_URL||'http://localhost:3012',host=io(url),guest=io(url);
let code,activated=false,joined=false,started=false,hostChecked=false,guestChecked=false;
const finish=error=>{clearTimeout(timer);host.close();guest.close();if(error){console.error(error);process.exit(1)}console.log('hugo-caos-check-persistente-20-cartas-mazo-infinito: ok');process.exit(0)};
const timer=setTimeout(()=>finish('HUGO Caos smoke: tiempo agotado'),9000);
host.on('connect',()=>host.emit('create',{name:'CaosA',game:'uno'}));
host.on('state',state=>{
  if(!code){code=state.code;return host.emit('unoSetChaosMode',true,ok=>{if(!ok)return finish('No se pudo activar Caos antes de que entrara el rival');activated=true;guest.emit('join',{name:'CaosB',code})})}
  if(activated&&state.status==='lobby'&&!state.unoChaosMode)return finish('El check Caos se perdió al actualizar el lobby');
  if(state.players.length===2&&!joined){joined=true;guest.emit('selectToken','frog',ok=>{if(!ok)return finish('El segundo jugador no pudo cambiar de ficha')});return}
  if(joined&&state.players.length===2&&state.status==='lobby'&&!started){if(!state.unoChaosMode)return finish('Cambiar una ficha desactivó Caos');started=true;return host.emit('start',{unoChaosMode:true})}
  if(state.status==='playing'&&!hostChecked){hostChecked=true;if(!state.unoChaosMode)return finish('La partida no inició en Caos');if(state.hand.length!==20)return finish(`El anfitrión recibió ${state.hand.length} cartas, no 20`);if(!state.unoDeckInfinite)return finish('El mazo no está marcado como infinito');if('unoChaosDeck'in state||'chaosHand'in state)return finish('Existe un segundo mazo o mano')}
  if(hostChecked&&guestChecked)finish();
});
guest.on('state',state=>{if(state.status==='playing'&&!guestChecked){guestChecked=true;if(state.hand.length!==20)return finish(`El invitado recibió ${state.hand.length} cartas, no 20`);if(!state.unoDeckInfinite)return finish('El invitado no ve el mazo infinito');if(hostChecked)finish()}});
host.on('connect_error',error=>finish(error.message));guest.on('connect_error',error=>finish(error.message));
