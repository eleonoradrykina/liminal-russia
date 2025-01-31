import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
const floorMaterial = new THREE.MeshStandardMaterial({ color: 'limegreen' })

export default function Level() {
    return <>
        <RigidBody type='fixed'>
        <mesh position={[0,0,0]}
            material={floorMaterial}>
            <boxGeometry args={[30, 0.2, 30]}/>
        </mesh>
        </RigidBody>
        <mesh position={[10,0.4,1]}>
            <boxGeometry args={[3, 3, 3]}/>
            <meshStandardMaterial 
                color='springgreen'
                roughness={ 0.5 }
                metalness={ 0.5 }
                doubleSided={ true }
            />
        </mesh>
        <mesh position={[5,0.2,5]}>
            <boxGeometry args={[6, 8, 10]}/>
            <meshStandardMaterial 
            color='peru'
            doubleSided={ true }/>

        </mesh>
        <mesh position={[8,0.2,20]}>
            <boxGeometry args={[2, 2, 3]}/>
            <meshStandardMaterial color='mediumvioletred' doubleSided={ true }/>
        </mesh>
        <mesh position={[6,0.2,6]}>
            <boxGeometry args={[1, 0.2, 2]}/>
            <meshStandardMaterial color='cornflowerblue' doubleSided={ true }/>
        </mesh>
    </>
}

