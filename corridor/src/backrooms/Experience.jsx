import { Bloom, ToneMapping, EffectComposer } from '@react-three/postprocessing'
import { Physics } from '@react-three/rapier'
import { OrbitControls} from '@react-three/drei'
import { Perf } from 'r3f-perf'

import Lights from './Lights.jsx'
import Corridor from './Corridor.jsx'
import Player from './Player.jsx'
import { useRef } from 'react'

export default function Experience()
{
    return <>
        <Perf position="top-left" />
        <EffectComposer>
        <Bloom luminanceThreshold={0.9} mipmapBlur intensity={0.67} />
        <ToneMapping />
        </EffectComposer>
        <OrbitControls />
        <Physics debug={ false }>
            <Lights />
            <Corridor />
            {/* <Player  /> */}
        </Physics>
    </>
}