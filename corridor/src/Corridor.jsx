import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

import CustomShaderMaterial from 'three-custom-shader-material'

import wallpaperVertexShader from './shaders/wallpaper/vert.glsl'
import wallpaperFragmentShader from './shaders/wallpaper/frag.glsl'
import ceilingVertexShader from './shaders/ceiling/vert.glsl'
import ceilingFragmentShader from './shaders/ceiling/frag.glsl'

const boxGeometry = new THREE.BoxGeometry(1,1,1)

const floorMaterial = new THREE.MeshStandardMaterial({ color: '#A38E3D' })
const ceilingMaterial = new THREE.MeshStandardMaterial({ color: '#F2E1AF' })
const wallMaterial = new THREE.MeshStandardMaterial({ color: '#968D24' })
const wallMaterial2 = new THREE.MeshStandardMaterial({ color: '#615A04' })

export function BlockStart({ position = [ 0, 0, 0 ] }) {
    return <group position={ position }>
        <mesh geometry = {boxGeometry}
            position-y={ -0.1 } 
            scale = { [4, 0.2, 4] }
            receiveShadow
            material ={ floorMaterial }
           />
    </group>
}

function Floor({size = 16}) {
    return <mesh geometry = {boxGeometry}
        position={ [0, -0.5, -size + 2] } 
        scale = { [size * 2, 0.2, size * 2] }
        receiveShadow
        material ={ floorMaterial }
       />
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
        receiveShadow
        material ={ ceilingMaterial }>

            <CustomShaderMaterial
                ref={materialRef}   
                baseMaterial={THREE.MeshPhysicalMaterial}
                vertexShader={ceilingVertexShader} 
                fragmentShader={ceilingFragmentShader} 
                uniforms={{
                    uTime: { value: 0 },
                    // aspectRatio: { value: size / 2.5 },
                    }}
                    // Base material properties
                flatShading
                color={'#F2E1AF'}
            />

        </mesh>
}

function BoundsForward({ length = 8}) {

    return <>
        <RigidBody type="fixed" restitution={0.2} friction={0}>
            {/* right wall */}
            <mesh geometry = {boxGeometry}
                position={ [ length - 0.15, 0.75, - (length) + 2] } 
                scale = { [0.3, 2.5, length * 2] }
                material ={ wallMaterial }
                castShadow
            />
            {/* left wall */}
            <mesh geometry = {boxGeometry}
                position={ [ -length + 0.15, 0.75, - (length) + 2] } 
                scale = { [0.3, 2.5, length * 2] }
                material ={ wallMaterial }
                receiveShadow
            />
            {/* back wall */}
            <mesh geometry = {boxGeometry}
                position={ [ 0, 0.75, - (length * 2) + 2] } 
                scale = { [length * 2, 2.5, 0.3] }
                material ={ wallMaterial }
                receiveShadow
            />
            {/* front wall */}
            <mesh geometry = {boxGeometry}
                position={ [ 0, 0.75, 2] } 
                scale = { [length * 2, 2.5, 0.3] }
                material ={ wallMaterial }
                receiveShadow
            />

            <CuboidCollider
                 args={ [ length, 0.1, length ] } 
                 position={ [ 0, -0.5, - (length ) + 2 ] }
                 restitution={ 0.2 }
                 friction={ 1 }/>
        </RigidBody>
    </>

}

function WallHorizontal({position = [0, 0, 0], length=14}) {
    const materialRef = useRef()

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    return <RigidBody type="fixed" restitution={0.2} friction={0}>
            <mesh geometry = {boxGeometry}
                position={ position } 
                scale = { [length, 2.5, 0.3] }
                receiveShadow>

                <CustomShaderMaterial
                    ref={materialRef}   
                    baseMaterial={THREE.MeshPhysicalMaterial}
                    vertexShader={wallpaperVertexShader} 
                    fragmentShader={wallpaperFragmentShader} 
                    uniforms={{
                        uTime: { value: 0 },
                        aspectRatio: { value: length / 2.5 },
        
                    }}
                    // Base material properties
                    flatShading
                    color={0x968D24}
                />
            </mesh>
        </RigidBody>
}

function WallVertical({position = [0, 0, 0], length=14}) {
    return <RigidBody type="fixed" restitution={0.2} friction={0}>
            <mesh geometry = {boxGeometry}
                position={ position } 
                scale = { [0.3, 2.5, length] }
                material ={ wallMaterial2 }
                receiveShadow
            />
        </RigidBody>
}
export default function Corridor() {


    return <>
        <Floor size={ 16 }/>
        {/* GROUP A*/}
        <WallHorizontal position={ [-9.7, 0.75, -4] } length = {12} />
        <WallVertical position={ [-3.85, 0.75, -8.15] }length = {8}/>

        {/* GROUP B*/}
        <WallHorizontal position={ [-7.0, 0.75, -20] }length = {10 } />
        <WallVertical position={ [-6.6, 0.75, -25.0] }length = {9.75}/>

        {/* GROUP C*/}
        <WallHorizontal position={ [12.7, 0.75, -22] } length = {6}/>
        <WallVertical position={ [6.6, 0.75, -20.65] }length = {13}/>
        <WallHorizontal position={ [8.7, 0.75, -14] } length = {14}/>

        {/* GROUP D*/}
        <WallVertical position={ [6.6, 0.75, -2.15] }length = {8}/>

        <BoundsForward length={ 16} />
        {/* <Ceiling size={ 16 }/> */}
    </>
}