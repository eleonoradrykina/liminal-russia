import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

import WallVertical from './Walls/WallVertical.jsx'
import WallHorizontal from './Walls/WallHorizontal.jsx'

import CustomShaderMaterial from 'three-custom-shader-material'

import wallpaper2VertexShader from './shaders/wallpaper2/vert.glsl'
import wallpaper2FragmentShader from './shaders/wallpaper2/frag.glsl'
import ceilingVertexShader from './shaders/ceiling/vert.glsl'
import ceilingFragmentShader from './shaders/ceiling/frag.glsl'
import carpetVertexShader from './shaders/carpet/vert.glsl'
import carpetFragmentShader from './shaders/carpet/frag.glsl'
import linkspotVertexShader from './shaders/linkspot/vert.glsl'
import linkspotFragmentShader from './shaders/linkspot/frag.glsl'

const boxGeometry = new THREE.BoxGeometry(1,1,1)
const planeGeometry = new THREE.PlaneGeometry(2.0, 2.0, 12,12)



const ceilingMaterial = new THREE.MeshStandardMaterial({ color: '#F2E1AF' })
const wallMaterial = new THREE.MeshStandardMaterial({ color: '#968D24' })



function Floor({size = 16}) {
    const materialRef = useRef()

    const floorValues = {
        freq: 0.005,
        strength: 0.15,
        tile: 1.0,
        scale: 2500.0,
        threshold: 0.01
    }

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    return <mesh geometry = {boxGeometry}
        position={ [0, -0.5, -size + 2] } 
        scale = { [size * 2, 0.2, size * 2] }
        receiveShadow
       >
        <CustomShaderMaterial
            ref={materialRef}   
            baseMaterial={THREE.MeshPhysicalMaterial}
            vertexShader={carpetVertexShader} 
            fragmentShader={carpetFragmentShader} 
            uniforms={{
                uTime: { value: 0 },
                freq: { value: floorValues.freq },
                strength: { value: floorValues.strength },
                tile: { value: floorValues.tile },
                scale: { value: floorValues.scale },
                threshold: { value: floorValues.threshold },
                }}
            flatShading
            color={'#F2E1AF'}
        />
    </mesh>
}

function Ceiling({size = 16}) {

    const materialRef = useRef()

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    return <mesh geometry = {boxGeometry}
        position={ [0, 2.1, -size + 2] }
        scale = { [size * 2, 0.2, size * 2] }
        material ={ ceilingMaterial }>

            <CustomShaderMaterial
                ref={materialRef}   
                baseMaterial={THREE.MeshPhysicalMaterial}
                vertexShader={ceilingVertexShader} 
                fragmentShader={ceilingFragmentShader} 
                uniforms={{
                    uTime: { value: 0 },
                    }}
                    // Base material properties
                color={'#BEA049'}
            />

        </mesh>
}

function Bounds({ length = 8}) {

    const materialRef = useRef()

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    return <>
        <RigidBody type="fixed" restitution={0.2} friction={0}>
            {/* right wall */}
            <mesh geometry = {boxGeometry}
                position={ [ length - 0.15, 0.75, - (length) + 2] } 
                scale = { [0.3, 2.5, length * 2] }
                material ={ wallMaterial }
                castShadow
                receiveShadow
            />
            {/* left wall */}
            <mesh geometry = {boxGeometry}
                position={ [ -length + 0.15, 0.75, - (length) + 2] } 
                scale = { [0.3, 2.5, length * 2] }
                material ={ wallMaterial }
                receiveShadow
                castShadow
                >
                    <CustomShaderMaterial
                        ref={materialRef}   
                        baseMaterial={THREE.MeshPhysicalMaterial}
                        vertexShader={wallpaper2VertexShader} 
                        fragmentShader={wallpaper2FragmentShader} 
                        uniforms={{
                            uTime: { value: 0 },
                            aspectRatio: { value: length * 2 / 2.5 },

                            offset: { value: 0.2125 },
                        }}
                        // Base material properties
                        flatShading
                        color={0x968D24}
                    />
            </mesh>
            {/* back wall */}
            <mesh geometry = {boxGeometry}
                position={ [ 0, 0.75, - (length * 2) + 2] } 
                scale = { [length * 2, 2.5, 0.3] }
                receiveShadow
                castShadow
                >
                <CustomShaderMaterial
                    ref={materialRef}   
                    baseMaterial={THREE.MeshPhysicalMaterial}
                    vertexShader={wallpaper2VertexShader} 
                    fragmentShader={wallpaper2FragmentShader} 
                    uniforms={{
                        uTime: { value: 0 },
                        aspectRatio: { value: length / 2.5 },
                        offset: { value: 0.2125 },
                    }}
                    // Base material properties
                    flatShading
                    color={0x968D24}
                    />
            </mesh>
            {/* front wall */}
            <mesh geometry = {boxGeometry}
                position={ [ 0, 0.75, 2] } 
                scale = { [length * 2, 2.5, 0.3] }
                material ={ wallMaterial }
                receiveShadow
                castShadow
            />

            <CuboidCollider
                 args={ [ length, 0.1, length ] } 
                 position={ [ 0, -0.5, - (length ) + 2 ] }
                 restitution={ 0.2 }
                 friction={ 1 }/>
        </RigidBody>
    </>

}

function Linkspot({position = [0, 0, 0]}) {
    const materialRef = useRef()

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })
    return <mesh geometry = {planeGeometry}
        position={ position }
        rotation={ [-Math.PI / 2, 0, 0] }
    >
        <CustomShaderMaterial
            ref={materialRef}   
            baseMaterial={THREE.MeshPhysicalMaterial}
            vertexShader={linkspotVertexShader} 
            fragmentShader={linkspotFragmentShader} 
            uniforms={{
                uTime: { value: 0 },
                }}
            color={'#000000'}
            transparent
            />
    </mesh>
}

export default function Corridor() {

    return <>
        <Floor size={ 16 }/>
        <Ceiling size={ 16 }/>

        {/* BASE */}

        {/* top part */}
        <WallVertical position={ [-4.85, 0.75, -18.03] }length = {7.75}/> 
        <WallVertical position={ [6.7, 0.75, -18.03] }length = {7.75}/> 
        <WallVertical position={ [0, 0.75, -25.95] }length = {7.75}/> 

        {/* central corridor*/}
        <WallHorizontal position={[3.0, 0.75, -14]  } length = {16}/>
        <WallHorizontal position={[6.0, 0.75, -8]  } length = {9}/>

         {/* bottom part */}
        <WallVertical position={ [10.35, 0.75, -4.85] }length = {6.0}/> 
        <WallVertical position={ [-4.85, 0.75, -4.53] }length = {7.0}/> 
        <WallVertical position={ [-10.0, 0.75, -4.53] }length = {7.0}/> 
        <WallHorizontal position={[-7.42, 0.75, -0.872]  } length = {5.45}/>

        {/* link spot plane*/}
        <Linkspot position={ [-7.2, -0.35, -4.0] }/>
        <Linkspot position={ [12.0, -0.35, -26.5] }/>

        <Bounds length={ 16} />
    </>
}