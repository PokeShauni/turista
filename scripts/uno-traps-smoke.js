const {io}=require('socket.io-client');
const url=process.env.TEST_URL||'http://localhost:3012';
const host=io(url),guest=io(url);
let code,started=false,placing=false,ownerId,trapId,placed=false;
const latest={};
const finish=error=>{clearTimeout(timer);host.close();guest.close();if(error){console.error(error);process.exit(1)}console.log('hugo-trampas-colocacion-turno-privacidad: ok');process.exit(0)};
const timer=setTimeout(()=>finish('HUGO trampas smoke: tiempo agotado'),12000);

host.on('connect',()=>host.emit('create',{name:'TrampaA',game:'uno'}));
host.on('state',state=>{
  latest[host.id]=state;
  if(!code){code=state.code;return host.emit('unoSetChaosMode',true,ok=>ok?guest.emit('join',{name:'TrampaB',code}):finish('No se pudo activar Caos'))}
  if(state.players.length===2&&!started){started=true;return host.emit('start',{unoChaosMode:true})}
  drive(state,host);
});
guest.on('state',state=>{latest[guest.id]=state;drive(state,guest)});

function drive(state,client){
  if(state.status!=='playing')return;
  if(placed){
    const ownerState=latest[ownerId],observerId=ownerId===host.id?guest.id:host.id,observerState=latest[observerId];
    if(!ownerState||!observerState)return;
    const owner=ownerState.players.find(player=>player.id===ownerId),observerView=observerState.players.find(player=>player.id===ownerId);
    if(owner?.trapCount!==1||ownerState.ownChaosTraps?.length!==1)return;
    if(observerView?.trapCount!==1||observerState.ownChaosTraps?.length)return finish('La identidad de la trampa se filtró al rival.');
    if(ownerState.players[ownerState.turn]?.id===ownerId)return finish('Colocar una trampa no consumió el turno.');
    return finish();
  }
  const current=state.players[state.turn];
  if(current?.id!==client.id||placing)return;
  if(state.phase==='unoChooseStartColor'){placing=true;client.emit('unoChooseColor','red');return setTimeout(()=>placing=false,80)}
  const trap=state.hand.find(card=>card.kind==='trap'&&card.chaosType!=='parasite');
  if(!trap)return finish('La mano inicial de prueba no incluyó una trampa colocable.');
  ownerId=client.id;trapId=trap.id;placing=true;
  client.emit('unoPlaceTrap',{cardId:trapId},result=>{
    if(!result?.ok)return finish(result?.message||'No se pudo colocar la trampa.');
    placed=true;placing=false;
  });
}

host.on('connect_error',error=>finish(error.message));
guest.on('connect_error',error=>finish(error.message));
