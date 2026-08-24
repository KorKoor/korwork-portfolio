import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps { onInteractDesk: () => void; }
type V3 = [number, number, number];
const FLOOR_ROTATION: V3 = [-Math.PI / 2, 0, 0];
const WALL_ROTATION: V3 = [0, 0, 0];
const LEFT_WALL_ROTATION: V3 = [0, Math.PI / 2, 0];

const C = {
  board:{x:350,y:22,width:385,height:302}, plant:{x:744,y:11,width:116,height:296}, window:{x:880,y:28,width:244,height:278}, poster:{x:1150,y:15,width:143,height:197}, guitar:{x:1424,y:16,width:102,height:312}, wallShelf:{x:1103,y:202,width:323,height:164}, todo:{x:1080,y:371,width:177,height:191}, map:{x:1270,y:367,width:251,height:227}, laptop:{x:220,y:359,width:178,height:210}, monitor:{x:394,y:344,width:264,height:198}, sideMonitor:{x:662,y:335,width:135,height:220}, deskLamp:{x:799,y:318,width:166,height:244}, keyboard:{x:431,y:545,width:236,height:81}, mousePad:{x:660,y:558,width:138,height:72}, mouse:{x:792,y:558,width:105,height:108}, camera:{x:801,y:478,width:58,height:68}, phone:{x:852,y:555,width:64,height:73}, pencilCup:{x:950,y:413,width:51,height:86}, bed:{x:1,y:569,width:422,height:373}, skateboard:{x:431,y:648,width:84,height:260}, backpack:{x:518,y:638,width:151,height:190}, burger:{x:681,y:638,width:95,height:70}, pizza:{x:681,y:710,width:95,height:67}, drink:{x:783,y:625,width:47,height:78}, glass:{x:852,y:640,width:53,height:67}, bowl:{x:792,y:708,width:82,height:66}, coffee:{x:610,y:826,width:88,height:78}, couchCats:{x:698,y:773,width:195,height:100}, sleepingCats:{x:901,y:770,width:200,height:110}, cityPrint:{x:1055,y:582,width:131,height:105}, pinkNote:{x:1200,y:582,width:92,height:105}, purpleNote:{x:1305,y:588,width:88,height:103}, greenNote:{x:1405,y:600,width:84,height:95}, globe:{x:1020,y:697,width:115,height:94}, vase:{x:1080,y:697,width:90,height:105}, ideas:{x:1141,y:697,width:123,height:100}, photo:{x:1265,y:713,width:149,height:86}, console:{x:1112,y:809,width:123,height:67}, cameraLarge:{x:1265,y:787,width:96,height:145}, books:{x:1350,y:787,width:80,height:145}, plantLarge:{x:1409,y:697,width:122,height:168},
} as const;

function Block({position,size,color,roughness=0.86,metalness=0,emissive,emissiveIntensity=0}:{position:[number,number,number];size:[number,number,number];color:string;roughness?:number;metalness?:number;emissive?:string;emissiveIntensity?:number}) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive} emissiveIntensity={emissiveIntensity}/></mesh>;
}
function Leg({x,z,height=0.78}:{x:number;z:number;height?:number}) { return <Block position={[x,height/2,z]} size={[0.16,height,0.16]} color="#191216" roughness={0.95}/>; }
function WoodTable({position,width,depth,height=0.82}:{position:[number,number,number];width:number;depth:number;height?:number}) {
  const lx=width/2-0.20,lz=depth/2-0.20;
  return <group position={position}><Block position={[0,height-0.08,0]} size={[width+0.14,0.16,depth+0.14]} color="#151014"/><Block position={[0,height,0]} size={[width,0.14,depth]} color="#70472e" roughness={0.78}/><Block position={[0,height+0.078,0]} size={[width-0.12,0.035,depth-0.12]} color="#9b623d" roughness={0.70}/><Leg x={-lx} z={-lz} height={height-0.03}/><Leg x={lx} z={-lz} height={height-0.03}/><Leg x={-lx} z={lz} height={height-0.03}/><Leg x={lx} z={lz} height={height-0.03}/></group>;
}
function Chair({position,rotation=0}:{position:[number,number,number];rotation?:number}) {
  return <group position={position} rotation={[0,rotation,0]}><Block position={[0,0.48,0]} size={[0.78,0.14,0.78]} color="#754a30" roughness={0.80}/><Block position={[0,1.02,-0.31]} size={[0.78,0.95,0.14]} color="#503323" roughness={0.86}/><Leg x={-0.28} z={-0.28} height={0.46}/><Leg x={0.28} z={-0.28} height={0.46}/><Leg x={-0.28} z={0.28} height={0.46}/><Leg x={0.28} z={0.28} height={0.46}/></group>;
}
function Rug({position,width,depth,color="#25243b"}:{position:[number,number,number];width:number;depth:number;color?:string}) {
  return <group position={position}><Block position={[0,0.025,0]} size={[width+0.20,0.07,depth+0.20]} color="#100f17" roughness={1}/><Block position={[0,0.065,0]} size={[width,0.035,depth]} color={color} roughness={1}/><Block position={[0,0.088,-depth/2+0.045]} size={[width-0.08,0.025,0.06]} color="#5b4a69"/><Block position={[0,0.088,depth/2-0.045]} size={[width-0.08,0.025,0.06]} color="#5b4a69"/><Block position={[-width/2+0.045,0.088,0]} size={[0.06,0.025,depth-0.08]} color="#5b4a69"/><Block position={[width/2-0.045,0.088,0]} size={[0.06,0.025,depth-0.08]} color="#5b4a69"/></group>;
}
function Platform({position,width,depth,height,color}:{position:[number,number,number];width:number;depth:number;height:number;color:string}) {
  return <group position={position}><Block position={[0,height*0.35,0]} size={[width+0.16,height*0.70,depth+0.16]} color="#09080d" roughness={1}/><Block position={[0,height*0.70,0]} size={[width,height*0.60,depth]} color="#18151e" roughness={0.96}/><Block position={[0,height+0.025,0]} size={[width-0.06,0.05,depth-0.06]} color={color} roughness={0.82}/><Block position={[0,height+0.06,-depth/2]} size={[width,0.035,0.05]} color="#5d5065"/><Block position={[0,height+0.06,depth/2]} size={[width,0.035,0.05]} color="#5d5065"/></group>;
}
function Staircase({position,steps=4}:{position:[number,number,number];steps?:number}) {
  return <group position={position} rotation={[0,Math.PI,0]}>{Array.from({length:steps},(_,i)=>{const depth=0.72,y=(steps-i)*0.13,z=-i*depth;return <Block key={`step-${i}`} position={[0,y/2,z]} size={[2.25-i*0.12,y,depth]} color="#302937" roughness={0.93}/>;})}<Block position={[0,0.025,0.55]} size={[2.65,0.05,0.12]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.3}/></group>;
}
function WindowFrame({position,width=2.25,height=1.70,rotation=[0,0,0] as V3}:{position:[number,number,number];width?:number;height?:number;rotation?:V3}) {
  return <group position={position} rotation={rotation}><Block position={[0,0,0]} size={[width+0.24,height+0.24,0.12]} color="#17131b" roughness={0.90}/><Block position={[0,0,0.07]} size={[width,height,0.045]} color="#10203b" roughness={0.45} metalness={0.1} emissive="#183a66" emissiveIntensity={0.35}/><Block position={[0,height/2+0.08,0.12]} size={[width+0.18,0.10,0.10]} color="#3b2a25"/><Block position={[0,-height/2-0.08,0.12]} size={[width+0.18,0.10,0.10]} color="#3b2a25"/><Block position={[-width/2-0.08,0,0.12]} size={[0.10,height,0.10]} color="#3b2a25"/><Block position={[width/2+0.08,0,0.12]} size={[0.10,height,0.10]} color="#3b2a25"/><Block position={[0,0,0.14]} size={[0.045,height,0.04]} color="#2f4161"/><Block position={[0,0,0.14]} size={[width,0.045,0.04]} color="#2f4161"/></group>;
}
function WallPanel({position,width,height=1.05,rotation=[0,0,0] as V3}:{position:[number,number,number];width:number;height?:number;rotation?:V3}) {
  return <group position={position} rotation={rotation}><Block position={[0,0,0]} size={[width,height,0.07]} color="#121a2b" roughness={0.92}/><Block position={[0,height/2-0.04,0.055]} size={[width-0.10,0.045,0.025]} color="#2a3b58"/><Block position={[0,-height/2+0.04,0.055]} size={[width-0.10,0.045,0.025]} color="#2a3b58"/></group>;
}

export const Room: React.FC<RoomProps> = React.memo(({onInteractDesk}) => {
  const interactDesk=useCallback(()=>onInteractDesk(),[onInteractDesk]);
  return <group>
    {/* Larger 16.4 x 14.2 room shell with layered floor relief. */}
    <Block position={[0,-0.45,0]} size={[16.8,0.80,14.6]} color="#05070d" roughness={1}/>
    <Block position={[0,-0.04,0]} size={[16.35,0.18,14.15]} color="#17131d" roughness={0.98}/>
    <Block position={[0,0.075,0]} size={[16.05,0.12,13.85]} color="#292331" roughness={0.94}/>
    {Array.from({length:15},(_,i)=><mesh key={`plank-z-${i}`} position={[0,0.145,-6.55+i*0.92]} receiveShadow><boxGeometry args={[15.75,0.045,0.035]}/><meshStandardMaterial color={i%2?'#45394a':'#382f40'} roughness={0.92}/></mesh>)}
    {Array.from({length:15},(_,i)=><mesh key={`plank-x-${i}`} position={[-6.8+i*0.97,0.165,0]} receiveShadow><boxGeometry args={[0.025,0.025,13.45]}/><meshStandardMaterial color="#1d1823" roughness={1}/></mesh>)}
    <Block position={[0,0.27,-6.75]} size={[16.15,0.18,0.32]} color="#4a4051"/><Block position={[-7.70,0.27,0]} size={[0.32,0.18,13.75]} color="#4a4051"/><Block position={[7.70,0.27,0]} size={[0.32,0.18,13.75]} color="#4a4051"/><Block position={[0,0.27,6.75]} size={[16.15,0.18,0.32]} color="#4a4051"/>
    <Block position={[0,0.34,6.53]} size={[15.25,0.04,0.05]} color="#8ab8ff" emissive="#4d8dff" emissiveIntensity={1.45}/>

    {/* Walls, panel relief and low front wall for the bottom-wall shelf. */}
    <Block position={[0,3.55,-7.05]} size={[16.35,7.10,0.30]} color="#0a1222" roughness={0.98}/><Block position={[-7.05,3.55,0]} size={[0.30,7.10,13.70]} color="#0e1729" roughness={0.98}/><Block position={[0,0.88,6.95]} size={[16.25,1.76,0.26]} color="#0b1020" roughness={0.98}/><Block position={[0,1.82,6.80]} size={[15.90,0.12,0.34]} color="#1c263d" roughness={0.9}/><Block position={[0,0.40,-6.82]} size={[15.95,0.32,0.26]} color="#04060c" roughness={1}/><Block position={[-6.82,0.40,0]} size={[0.26,0.32,13.25]} color="#04060c" roughness={1}/><Block position={[0,6.99,-6.85]} size={[16.55,0.24,0.42]} color="#060910" roughness={0.96}/><Block position={[-6.86,6.99,0]} size={[0.42,0.24,13.95]} color="#060910" roughness={0.96}/><Block position={[0,2.55,-6.86]} size={[15.55,0.06,0.05]} color="#1d3556" emissive="#102746" emissiveIntensity={0.35}/><Block position={[-6.86,2.55,0]} size={[0.05,0.06,13.0]} color="#1d3556" emissive="#102746" emissiveIntensity={0.35}/>
    {[-5.8,-2.9,0,2.9,5.8].map(x=><Block key={`panel-back-${x}`} position={[x,3.55,-6.86]} size={[0.055,5.90,0.035]} color="#1b2b45" roughness={0.90}/>)}
    {[-4.8,-1.6,1.6,4.8].map(z=><Block key={`panel-left-${z}`} position={[-6.86,3.55,z]} size={[0.035,5.90,0.055]} color="#20314d" roughness={0.90}/>)}

    {/* Recessed windows with skyline props. */}
    <WindowFrame position={[-3.45,4.85,-6.87]} width={2.35} height={1.72}/><RoomSprite position={[-3.45,4.85,-6.68]} crop={C.window} height={1.55} rotation={WALL_ROTATION} depthOffset={0.01}/>
    <WindowFrame position={[1.15,4.82,-6.87]} width={2.45} height={1.80}/><RoomSprite position={[1.15,4.82,-6.68]} crop={C.window} height={1.62} rotation={WALL_ROTATION} depthOffset={0.01}/>
    <WindowFrame position={[5.25,3.95,-6.87]} width={1.65} height={1.55}/><RoomSprite position={[5.25,3.95,-6.68]} crop={C.window} height={1.38} rotation={WALL_ROTATION} depthOffset={0.01}/>
    <WindowFrame position={[-6.87,4.55,2.85]} width={1.85} height={1.65} rotation={LEFT_WALL_ROTATION}/><RoomSprite position={[-6.68,4.55,2.85]} crop={C.window} height={1.46} rotation={LEFT_WALL_ROTATION} depthOffset={0.01}/>

    {/* Raised bedroom/office deck and bedroom rug. */}
    <Platform position={[-0.15,0,-3.75]} width={13.55} depth={4.65} height={0.44} color="#1c1825"/>
    <Rug position={[-3.55,0.49,-3.80]} width={4.95} depth={3.75} color="#24223a"/>
    <group position={[-3.55,0.50,-3.95]}><Block position={[0,0.22,0]} size={[4.45,0.38,3.35]} color="#08090f" roughness={1}/><Block position={[0,0.46,0]} size={[4.20,0.20,3.12]} color="#3a2527" roughness={0.86}/><Block position={[0,0.59,0]} size={[4.00,0.06,2.94]} color="#7c5135" roughness={0.78}/><Block position={[0,1.20,-1.47]} size={[4.08,1.24,0.28]} color="#392528" roughness={0.90}/><Block position={[0,1.80,-1.63]} size={[4.28,0.18,0.38]} color="#845839" roughness={0.74}/><Block position={[0,1.64,-1.76]} size={[3.90,0.04,0.035]} color="#bd7c4c"/><RoomSprite position={[0,0.64,0.03]} crop={C.bed} height={2.92} rotation={FLOOR_ROTATION} depthOffset={0.08}/><RoomSprite position={[1.82,0.72,0.15]} crop={C.sleepingCats} height={0.72} rotation={FLOOR_ROTATION} depthOffset={0.04}/></group>
    <group position={[-0.72,0.50,-5.88]}><Block position={[0,0.46,0]} size={[1.05,0.82,0.88]} color="#2d1d1d" roughness={0.92}/><Block position={[0,0.93,0]} size={[1.18,0.12,0.98]} color="#795039" roughness={0.76}/><RoomSprite position={[0,1.02,0.03]} crop={C.coffee} height={0.30} rotation={FLOOR_ROTATION}/></group>

    {/* Desk is on the same upper deck but separated from the bed. */}
    <group onClick={interactDesk}><WoodTable position={[2.75,0.50,-4.82]} width={5.20} depth={1.28} height={0.98}/><Block position={[2.75,0.96,-4.82]} size={[4.50,0.70,0.12]} color="#2a1a1a" roughness={0.92}/><RoomSprite position={[1.45,1.25,-5.31]} crop={C.laptop} height={0.95} depthOffset={0.04}/><RoomSprite position={[2.72,1.30,-5.31]} crop={C.monitor} height={1.30} depthOffset={0.05}/><RoomSprite position={[4.00,1.20,-5.30]} crop={C.sideMonitor} height={1.16} depthOffset={0.05}/><RoomSprite position={[1.88,1.06,-4.17]} crop={C.keyboard} height={0.34} rotation={FLOOR_ROTATION}/><RoomSprite position={[3.05,1.06,-4.14]} crop={C.mousePad} height={0.28} rotation={FLOOR_ROTATION}/><RoomSprite position={[3.58,1.06,-4.12]} crop={C.mouse} height={0.20} rotation={FLOOR_ROTATION}/><RoomSprite position={[4.18,1.10,-4.12]} crop={C.phone} height={0.26} rotation={FLOOR_ROTATION}/><RoomSprite position={[4.58,1.17,-4.10]} crop={C.camera} height={0.22} rotation={FLOOR_ROTATION}/><RoomSprite position={[0.95,1.12,-4.08]} crop={C.pencilCup} height={0.34}/><RoomSprite position={[4.82,1.52,-4.35]} crop={C.deskLamp} height={0.96} depthOffset={0.04}/></group>
    <group position={[2.75,0.50,-3.15]}><Block position={[0,0.62,0]} size={[1.25,0.14,1.12]} color="#4c3528"/><Block position={[0,1.20,-0.38]} size={[1.05,1.18,0.16]} color="#27212a"/><Leg x={-0.43} z={-0.40} height={0.54}/><Leg x={0.43} z={-0.40} height={0.54}/><Leg x={-0.43} z={0.40} height={0.54}/><Leg x={0.43} z={0.40} height={0.54}/></group>

    {/* Stairs now descend toward the lower lounge/dining side. */}
    <Staircase position={[0.45,0.44,-0.55]} steps={4}/>

    {/* Horizontal sofa in lower-left corner, against the wall. */}
    <Rug position={[-4.55,0.16,3.95]} width={5.25} depth={3.05} color="#26233b"/>
    <group position={[-4.55,0.17,4.62]}><Block position={[0,0.58,0]} size={[4.45,1.08,1.34]} color="#20202e" roughness={0.98}/><Block position={[0,1.18,-0.46]} size={[4.48,0.82,0.42]} color="#2d2b3d" roughness={0.96}/><Block position={[-2.10,0.64,0]} size={[0.25,1.28,1.52]} color="#14141f"/><Block position={[2.10,0.64,0]} size={[0.25,1.28,1.52]} color="#14141f"/><Block position={[0,0.10,0.02]} size={[4.68,0.16,1.58]} color="#11111a"/><RoomSprite position={[0,1.36,-0.66]} crop={C.couchCats} height={0.96}/></group>
    <WoodTable position={[-4.45,0.20,2.85]} width={2.75} depth={1.55} height={0.78}/><RoomSprite position={[-5.25,1.07,2.84]} crop={C.burger} height={0.28} rotation={FLOOR_ROTATION}/><RoomSprite position={[-4.52,1.07,2.84]} crop={C.pizza} height={0.27} rotation={FLOOR_ROTATION}/><RoomSprite position={[-3.85,1.07,2.72]} crop={C.bowl} height={0.28} rotation={FLOOR_ROTATION}/><RoomSprite position={[-4.88,1.08,3.27]} crop={C.drink} height={0.30} rotation={FLOOR_ROTATION}/><RoomSprite position={[-4.30,1.08,3.28]} crop={C.glass} height={0.28} rotation={FLOOR_ROTATION}/>

    {/* Dining corner: table, four chairs and a deliberate prop arrangement. */}
    <Rug position={[3.65,0.16,3.55]} width={5.15} depth={3.95} color="#29263d"/>
    <WoodTable position={[3.65,0.23,3.48]} width={3.25} depth={1.95} height={0.86}/><Chair position={[3.65,0.24,2.12]}/><Chair position={[3.65,0.24,4.84]} rotation={Math.PI}/><Chair position={[1.55,0.24,3.48]} rotation={Math.PI/2}/><Chair position={[5.75,0.24,3.48]} rotation={-Math.PI/2}/>
    <RoomSprite position={[2.72,1.17,3.42]} crop={C.pizza} height={0.34} rotation={FLOOR_ROTATION}/><RoomSprite position={[3.55,1.17,3.42]} crop={C.bowl} height={0.31} rotation={FLOOR_ROTATION}/><RoomSprite position={[4.32,1.17,3.40]} crop={C.burger} height={0.30} rotation={FLOOR_ROTATION}/><RoomSprite position={[3.00,1.18,4.02]} crop={C.drink} height={0.32} rotation={FLOOR_ROTATION}/><RoomSprite position={[4.05,1.18,4.00]} crop={C.glass} height={0.29} rotation={FLOOR_ROTATION}/><RoomSprite position={[3.65,1.20,2.96]} crop={C.coffee} height={0.30} rotation={FLOOR_ROTATION}/>

    {/* Shelf mounted directly to the lower/front wall. */}
    <group position={[4.45,1.58,6.72]}><Block position={[0,0,0]} size={[3.35,0.13,0.46]} color="#5f3d2b" roughness={0.76}/><Block position={[0,0.48,0]} size={[3.10,0.08,0.36]} color="#8a5738" roughness={0.72}/><Block position={[-1.40,0.23,0]} size={[0.10,0.48,0.32]} color="#38241e"/><Block position={[1.40,0.23,0]} size={[0.10,0.48,0.32]} color="#38241e"/><RoomSprite position={[-1.02,0.22,-0.25]} crop={C.books} height={0.46} rotation={WALL_ROTATION}/><RoomSprite position={[0,0.22,-0.25]} crop={C.console} height={0.32} rotation={WALL_ROTATION}/><RoomSprite position={[0.88,0.28,-0.25]} crop={C.photo} height={0.34} rotation={WALL_ROTATION}/><RoomSprite position={[1.45,0.54,-0.25]} crop={C.plantLarge} height={0.82} rotation={WALL_ROTATION}/></group>

    {/* Entry props are grouped instead of scattered across the floor. */}
    <group position={[-6.15,0.18,0.45]}><RoomSprite position={[0,0.05,0]} crop={C.skateboard} height={1.62} depthOffset={0.02}/><RoomSprite position={[0.78,0.05,0.20]} crop={C.backpack} height={0.88}/></group>

    {/* Wall decoration clusters. */}
    <WallPanel position={[-4.90,3.30,-6.88]} width={2.65} height={1.15}/><RoomSprite position={[-4.90,3.38,-6.70]} crop={C.board} height={1.48} rotation={WALL_ROTATION}/><RoomSprite position={[-1.15,5.95,-6.70]} crop={C.poster} height={1.22} rotation={WALL_ROTATION}/><RoomSprite position={[4.62,5.25,-6.70]} crop={C.board} height={1.52} rotation={WALL_ROTATION}/><RoomSprite position={[5.85,4.25,-6.70]} crop={C.guitar} height={1.72} rotation={WALL_ROTATION}/><RoomSprite position={[6.10,2.98,-6.70]} crop={C.todo} height={0.78} rotation={WALL_ROTATION}/><RoomSprite position={[4.82,2.82,-6.70]} crop={C.map} height={0.86} rotation={WALL_ROTATION}/><RoomSprite position={[0.10,2.92,-6.70]} crop={C.plant} height={1.38} rotation={WALL_ROTATION}/><RoomSprite position={[-6.70,2.85,-0.70]} crop={C.cityPrint} height={0.72} rotation={LEFT_WALL_ROTATION} depthOffset={0.03}/><RoomSprite position={[-6.70,2.15,0.90]} crop={C.pinkNote} height={0.46} rotation={LEFT_WALL_ROTATION} depthOffset={0.03}/><RoomSprite position={[-6.70,1.62,2.00]} crop={C.purpleNote} height={0.44} rotation={LEFT_WALL_ROTATION} depthOffset={0.03}/>

    <pointLight position={[-3.55,2.35,-4.90]} intensity={0.48} color="#ffad62" distance={3.6} decay={2}/><pointLight position={[2.70,2.20,-4.30]} intensity={0.72} color="#38bdf8" distance={4.0} decay={2}/><pointLight position={[-4.55,1.90,3.55]} intensity={0.38} color="#a855f7" distance={3.6} decay={2}/><pointLight position={[3.65,1.60,3.48]} intensity={0.46} color="#f5a63c" distance={3.8} decay={2}/><pointLight position={[4.45,1.65,6.15]} intensity={0.34} color="#60a5fa" distance={3.0} decay={2}/>

    <Player onInteractDesk={onInteractDesk} initialPosition={[0.25,0.63,0.85]} deskPosition={[2.75,-4.82]} speed={2.55}/>
  </group>;
});
Room.displayName='Room';
