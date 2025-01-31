import { RigidBody, useRapier } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls, PerspectiveCamera } from '@react-three/drei'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

export default function Player({ orbitControlsRef }) {

    const body = useRef()
    const camera = useRef()
    const radius = 2.5
    const [ subscribeKeys, getKeys ] = useKeyboardControls()
    const { rapier, world } = useRapier()

    const [ smoothedCameraPosition ] = useState(() => new THREE.Vector3(0, 0.65, 2.25))  
    const [ smoothedCameraTarget ] = useState(() => new THREE.Vector3(0, 0.25, -2.25))
    const [ angle, setAngle ] = useState(0)

    const jump = () => {
        const origin = body.current.translation()
        origin.y -= 0.31
        const direction = { x: 0, y: -1, z: 0 }

        const ray = new rapier.Ray(origin, direction)
        const hit = world.castRay(ray, 10, true)

        if( hit.timeOfImpact < 0.15 ) {
            body.current.applyImpulse({ x: 0, y: 0.15, z: 0 })
        }


    }

    useEffect(() => {
        const unsubscriveJump = subscribeKeys(
            //selector "I want to listen to this"
            (state) => state.jump,
            //callback "When this happens"
            (value) => {
                if (value) jump()
            }
        )

        return() => {
            unsubscriveJump()
        }
    }, [])

    useFrame((state, delta) => {
    
        /**
         * Controls
         */
        const { forward, backward, left, right, jump } = getKeys()

        const impulseStrength = 0.1 * delta

        const direction = new THREE.Vector3()

        if (forward) {
            direction.x = -Math.cos(angle) * impulseStrength
            direction.z = -Math.sin(angle) * impulseStrength
            }
        if (backward) {
            direction.x = Math.cos(angle) * impulseStrength
            direction.z = Math.sin(angle) * impulseStrength
            }
        if (left) {
            setAngle(angle - 0.3*delta)
            }
        if (right) {
            setAngle(angle + 0.3*delta)
            }
        
        body.current.applyImpulse(direction)


        /**
         * Camera
         */
        const bodyPosition = body.current.translation()

        const cameraPosition = new THREE.Vector3()
        cameraPosition.x = bodyPosition.x + Math.cos(angle) * radius
        cameraPosition.y = bodyPosition.y + 0.5
        cameraPosition.z = bodyPosition.z + Math.sin(angle) * radius

        // clamp camera position to the bounds of the corridor
        cameraPosition.x = Math.min(15.5, Math.max(-15.5, cameraPosition.x)) //from -15.5 to 14.5
        cameraPosition.z = Math.min(0.5, Math.max(-29.7, cameraPosition.z)) // from -29.7 to 1

        const cameraTarget = new THREE.Vector3()
        cameraTarget.copy(bodyPosition)

        // look a bit up
        cameraTarget.y += 0.25
        
        smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
        smoothedCameraTarget.lerp(cameraTarget, 5 * delta )

        state.camera.position.copy(smoothedCameraPosition)
        state.camera.lookAt(smoothedCameraTarget)

    })

    return <>
    <RigidBody 
        ref={ body }
        canSleep={false} 
        colliders="ball" 
        restituition={ 0.2 } 
        friction={ 1 } 
        linearDamping={ 0.5}
        angularDamping={ 0.5 }
        position={ [0, 1, -0.5] }
    >
        <mesh castShadow>
            <capsuleGeometry args={ [0.1, 0.15, 10, 12 ] } />
            <meshStandardMaterial 
                flatShading
                color="#1e1e1e"
                opacity={ 0.98 }
                transparent
                roughness={ 0.1 }
                metalness={ 0.7 }
                />
        </mesh>
    </RigidBody>

    </>

}