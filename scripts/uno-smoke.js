const {io}=require('socket.io-client');
const url=process.env.TEST_URL||'http://localhost:3012',a=io(url),b=io(url);let code,started=false,played=false,initialCount;
const fail=message=>{clearTimeout(timer);console.error(message);a.close();b.close();process.exit(1)};
const done=()=>{clearTimeout(timer);console.log('hugo-normal-7-cartas-privacidad-mazo-infinito: ok');a.close();b.close();process.exit(0)};
const timer=setTimeout(()=>fail('HUGO normal smoke: tiempo agotado'),9000);
a.on('connect',()=>a.emit('create',{name:'Ana',game:'uno'}));
a.on('state',state=>{if(!code){code=state.code;if(state.game!=='uno')return fail('La sala no conservó HUGO');return b.emit('join',{name:'Beto',code})}if(state.players.length===2&&!started){started=true;return a.emit('start',{unoChaosMode:false})}if(state.status!=='playing')return;initialCount=state.hand.length;if(![7,9].includes(initialCount))return fail(`Ana recibió ${initialCount} cartas en modo normal`);if(!state.unoDeckInfinite)return fail('El mazo normal no está marcado como infinito');if(state.players.some(player=>'unoHand'in player))return fail('Se filtró una mano privada');done()});
b.on('state',state=>{if(state.status!=='playing'||state.players[state.turn].id!==b.id)return;if(state.phase==='unoChooseStartColor')return b.emit('unoChooseColor','red');if(state.phase==='unoPlay')return setTimeout(()=>b.emit('unoDraw'),700);if(state.phase==='unoDrawn'){const card=state.hand.find(item=>item.id===state.unoDrawnCardId);if(card)b.emit('unoPlay',{cardId:card.id,chosenColor:card.color||'blue',calledUno:false})}});
a.on('connect_error',error=>fail(error.message));b.on('connect_error',error=>fail(error.message));
