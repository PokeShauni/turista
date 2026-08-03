const assert=require('assert');
const Uno=require('../uno-engine');

const oldId='socket-old',newId='socket-new',otherId='socket-other',now=Date.now();
const absorbedTrap={id:'absorb-trap',type:'absorb',absorbCharges:3,absorbedAmount:8};
const room={
  game:'uno',status:'playing',turn:0,phase:'unoPlay',unoChaosMode:true,unoDirection:1,unoColor:'red',
  unoDeck:[],unoDiscard:[],unoChaosForbidden:[],players:[
    {id:newId,name:'Reconectado',reconnectToken:'token-a',unoHand:[{id:'energy-1',unoAbsorbed:true,absorbedTrapId:'absorb-trap'}],unoChaosTraps:[absorbedTrap]},
    {id:otherId,name:'Rival',reconnectToken:'token-b',unoHand:[],unoChaosTraps:[]}
  ],
  unoChaosTomato:{id:'tomato',sourceId:otherId,targetId:oldId,targetReconnectToken:'token-a',clicksRemaining:2,throws:{[oldId]:1},lastThrow:{fromId:otherId,toId:oldId}},
  unoChaosDuel:{id:'duel',challengerId:oldId,targetId:otherId,winnerId:oldId,loserId:otherId,responses:{[oldId]:{score:12}},progress:{[oldId]:2},transfer:{fromId:oldId,toId:otherId},resolved:false,deadline:now+60000},
  unoChaosGamble:{id:'gamble',sourceId:otherId,targetId:oldId,amount:4,result:null,deadline:now+60000},
  unoChaosRedirectChoice:{id:'redirect',ownerId:oldId,attackerId:otherId,amount:4},
  unoChaosAbsorbChoice:{id:'absorb-choice',ownerId:oldId,attackerId:otherId,trapId:'absorb-trap',amount:8,forced:true}
};

Uno.migrateTransientIds(room,oldId,newId);

assert.equal(room.unoChaosTomato.targetId,newId,'Tomate no migró la víctima');
assert.equal(room.unoChaosTomato.throws[newId],1,'Tomate no migró los lanzamientos');
assert.equal(room.unoChaosTomato.lastThrow.toId,newId,'Tomate no migró la animación pendiente');
assert.equal(room.unoChaosDuel.challengerId,newId,'Duelo no migró al contrincante');
assert.deepEqual(room.unoChaosDuel.responses[newId],{score:12},'Duelo no conservó la respuesta');
assert.equal(room.unoChaosDuel.progress[newId],2,'Duelo no conservó el progreso');
assert.equal(room.unoChaosDuel.transfer.fromId,newId,'Duelo no migró la transferencia de premio');
assert.equal(room.unoChaosGamble.targetId,newId,'+N no migró al jugador que debe responder');
assert.equal(room.unoChaosRedirectChoice.ownerId,newId,'Cambio de víctima no migró su elección');
assert.equal(room.unoChaosAbsorbChoice.ownerId,newId,'Absorción no migró su liberación obligatoria');

const tomatoState=Uno.publicState(room,newId);
assert.equal(tomatoState.unoChaosTomato.isTarget,true,'El reconectado entomatado recibió la interfaz incorrecta');
assert.equal(tomatoState.unoChaosResolution.type,'redirect','La cola no restauró la primera resolución pendiente');
assert.equal(tomatoState.ownChaosTraps[0].absorbedAmount,8,'Absorción perdió la energía acumulada');
assert.equal(tomatoState.hand[0].absorbedTrapId,'absorb-trap','Absorción perdió sus cartas plantilla');

room.unoChaosRedirectChoice=null;
assert.equal(Uno.publicState(room,newId).unoChaosResolution.type,'absorb','Absorción no retomó prioridad tras la redirección');
room.unoChaosAbsorbChoice=null;
assert.equal(Uno.publicState(room,newId).unoChaosResolution.type,'gamble','+N no se restauró en la cola');
room.unoChaosGamble=null;
assert.equal(Uno.publicState(room,newId).unoChaosResolution.type,'duel','Duelo no se restauró en la cola');

console.log('hugo-caos-reconexion-tomate-duelo-n-redireccion-absorcion: ok');
