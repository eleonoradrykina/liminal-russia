import { RigidBody, useRapier } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls} from '@react-three/drei'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

export default function Player() {

    const body = useRef()
    const radius = 3
    const [ subscribeKeys, getKeys ] = useKeyboardControls()
    const { rapier, world } = useRapier()

    const [ smoothedCameraPosition ] = useState(() => new THREE.Vector3(10,10,10))  
    const [ smoothedCameraTarget ] = useState(() => new THREE.Vector3())  
    const [ angle, setAngle ] = useState(0)

    const jump = () => {
        const origin = body.current.translation()
        origin.y -= 0.31
        const direction = { x: 0, y: -1, z: 0 }

        const ray = new rapier.Ray(origin, direction)
        const hit = world.castRay(ray, 10, true)
        console.log(hit.timeOfImpact)

        if( hit.timeOfImpact < 0.15 ) {
            body.current.applyImpulse({ x: 0, y: 0.05, z: 0 })
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
        const { forward, backward, left, right } = getKeys()

        const impulseStrength = 0.2 * delta

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
            setAngle(angle + 0.5*delta)
            }
        if (right) {
            setAngle(angle - 0.5*delta)
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

        const cameraTarget = new THREE.Vector3()
        cameraTarget.copy(bodyPosition)
        
        smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
        smoothedCameraTarget.lerp(cameraTarget, 5 * delta )

        state.camera.position.copy(smoothedCameraPosition)
        state.camera.lookAt(smoothedCameraTarget)

    })

    return (
        <RigidBody 
            ref={ body }
            canSleep={false} 
            colliders="ball" 
            restituition={ 0.2 } 
            friction={ 1 } 
            linearDamping={ 0.5}
            angularDamping={ 0.5 }
            position={ [0, 1, 0] }
        >
        <mesh castShadow>
            <capsuleGeometry args={ [0.1, 0.15, 10, 12 ] } />
            <meshStandardMaterial flatShading color="mediumpurple" />
        </mesh>
        </RigidBody>
    )
}