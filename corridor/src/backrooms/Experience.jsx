import { Bloom, ToneMapping, EffectComposer } from '@react-three/postprocessing'
import { Physics } from '@react-three/rapier'
import { OrbitControls, Environment } from '@react-three/drei'
import { Perf } from 'r3f-perf'

import Lights from './Lights.jsx'
import Corridor from './Corridor.jsx'
import Player from './Player.jsx'
import { useRef, useState } from 'react'
import MovingWalls from './MovingWalls.jsx'
export default function Experience()
{
    // const gameStates = ['A', 'B', 'C', 'D']
    const [gameState, setGameState] = useState('A')

    return <>
        {/* <Perf position="top-left" /> */}
        <EffectComposer>
        <Environment 
            preset="lobby" 
            environmentIntensity={0.75}
            backgroundIntensity={0.75}
        />
        <Bloom luminanceThreshold={0.95} mipmapBlur intensity={0.6} />
        <ToneMapping />
        </EffectComposer>
        <OrbitControls />
        <Physics debug={ false }>
            <Lights />
            <Corridor />
            <MovingWalls gameState={gameState} />
            <Player currentState={gameState} changeState={setGameState}/>
        </Physics>
    </>
}