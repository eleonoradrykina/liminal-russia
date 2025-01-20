import * as THREE from 'three'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useState, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

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

function Floor() {
    return <mesh geometry = {boxGeometry}
        position={ [0, -0.5, -16 + 2] } 
        scale = { [32, 0.2, 32] }
        receiveShadow
        material ={ floorMaterial }
       />
}

function Ceiling() {
    return <mesh geometry = {boxGeometry}
        position={ [0, 2.1, -16 + 2] }
        scale = { [32, 0.2, 32] }
        receiveShadow
        material ={ ceilingMaterial }
       />
}

function BoundsForward({ length = 1}) {

    return <>
        <RigidBody type="fixed" restitution={0.2} friction={0}>
            {/* right wall */}
            <mesh geometry = {boxGeometry}
                position={ [ 16.15, 0.75, - (length * 2) + 2] } 
                scale = { [0.3, 2.5, length * 4] }
                material ={ wallMaterial }
                castShadow
            />
            {/* left wall */}
            <mesh geometry = {boxGeometry}
                position={ [ -16.15, 0.75, - (length * 2) + 2] } 
                scale = { [0.3, 2.5, length * 4] }
                material ={ wallMaterial }
                receiveShadow
            />
            {/* back wall */}
            <mesh geometry = {boxGeometry}
                position={ [ 0, 0.75, - (length * 4) + 2] } 
                scale = { [32, 2.5, 0.3] }
                material ={ wallMaterial }
                receiveShadow
            />
            {/* front wall */}
            <mesh geometry = {boxGeometry}
                position={ [ 0, 0.75, 4] } 
                scale = { [32, 2.5, 0.3] }
                material ={ wallMaterial }
                receiveShadow
            />

            <CuboidCollider
                 args={ [ 16, 0.1, 2 * length ] } 
                 position={ [ 0, -0.5, - (length * 2) + 2 ] }
                 restitution={ 0.2 }
                 friction={ 1 }/>
        </RigidBody>
    </>

}

function Wall({position = [0, 0, 0]}) {
    return <RigidBody type="fixed" restitution={0.2} friction={0}>
            <mesh geometry = {boxGeometry}
                position={ position } 
                scale = { [12, 2.5, 0.3] }
                material ={ wallMaterial2 }
                receiveShadow
            />
        </RigidBody>
}
export default function Corridor() {


    return <>
        <Floor />
        <Wall position={ [-10, 0.75, -4] } />
        <Wall position={ [-10, 0.75, -12] } />
        <Wall position={ [-10, 0.75, -20] } />
        <Wall position={ [-10, 0.75, -4] } />
        <Wall position={ [10, 0.75, -6] } />
        <Wall position={ [10, 0.75, -14] } />
        <Wall position={ [10, 0.75, -22] } />
        <Wall position={ [10, 0.75, -25] } />
        <Ceiling />
        <BoundsForward length={ 8} />

    </>
}