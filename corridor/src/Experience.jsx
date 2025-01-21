
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
        <OrbitControls 
            enablePan={ false }
            enableZoom={ false }
            maxPolarAngle={ Math.PI / 2 }
            minPolarAngle={ Math.PI / 2 }
            maxAzimuthAngle={ Math.PI / 2 }
            minAzimuthAngle={ -Math.PI / 2 }
            makeDefault 
        />
        <Physics debug={ true }>
            <Lights />
            <Corridor />
            <Player />
        </Physics>
    </>
}