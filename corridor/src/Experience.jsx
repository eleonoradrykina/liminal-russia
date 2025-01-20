
import { Physics } from '@react-three/rapier'
import { OrbitControls} from '@react-three/drei'
import { Perf } from 'r3f-perf'

import Lights from './Lights.jsx'
import Corridor from './Corridor.jsx'
import Player from './Player.jsx'

export default function Experience()
{
    return <>
        <Perf position="top-left" />
        <OrbitControls makeDefault />
        <Physics debug={ true }>
            <Lights />
            <Corridor />
            <Player />
        </Physics>


    </>
}