import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './backrooms/Experience.jsx'
import UI from './ui/UI.jsx'
import { KeyboardControls } from '@react-three/drei'
const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <>
    <UI />
    <KeyboardControls
        map={ [
            { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
            { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
            { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
            { name: 'right', keys: ['KeyD', 'ArrowRight'] },
            { name: 'jump', keys: ['Space'] }
        ] } 
    >
        <Canvas
            shadows
            camera={ {
                fov: 45,
                near: 0.1,
                far: 200,
                position: [ 2.5, 4, 6 ]
            } }
        >
            <Experience />
         </Canvas>
    </KeyboardControls>
    </>
)