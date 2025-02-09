import { RigidBody, useRapier, CapsuleCollider } from '@react-three/rapier'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { useRef, useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { createPortal } from 'react-dom'

export default function Player({ currentState, changeState }) {

    const body = useRef()
    const camera = useRef()
    const radius = 2.5
    const [ subscribeKeys, getKeys ] = useKeyboardControls()
    const { rapier, world } = useRapier()

    const baltica = useGLTF('./baltica.glb')
    baltica.scene.children.forEach(child => {
        child.castShadow = true
    })

    const [ smoothedCameraPosition ] = useState(() => new THREE.Vector3(0, 0.65, 2.25))  
    const [ smoothedCameraTarget ] = useState(() => new THREE.Vector3(0, 0.25, -2.25))
    const [ angle, setAngle ] = useState(Math.PI / 2)
    const [isInLinkMemoriesSpot, setIsInLinkMemoriesSpot] = useState(false)
    const [isInLinkConspiracySpot, setIsInLinkConspiracySpot] = useState(false)
    const [colliderType, setColliderType] = useState('ball')

    const checkChangeState = (position) => {
        //first position change is at x between 10 and 15, z between -8 and -7.2 
        if ((currentState === 'A') && (position.x > 10.5 && position.x < 15.5 && position.z > -8 && position.z < -7.2)) {
            changeState('B')
        }
        //second position change is at x between -0.9 and 0.5, z between -22.1 and -14.3
        if ((currentState === 'B') && (position.x > -0.9 && position.x < 0.5 && position.z > -22.1 && position.z < -14.3)) {
            changeState('C')
        }
        //third position change is at x between -9.5 and -7.5, z between -0.54 and 1.68
        if ((currentState === 'C') && (position.x > -9.5 && position.x < -7.5 && position.z > -0.54 && position.z < 1.68)) {
            changeState('D')
        }
        //last position change is at x between 4.2 and 7, z between -13.25 and -8.2
        if ((currentState === 'D') && (position.x > 4.2 && position.x < 7 && position.z > -13.25 && position.z < -8.2)) {
            changeState('A')
        }
    }

    const visitLinkMemories = () => {
        // window.open('https://memories-jet-xi.vercel.app/', '_parent')
        window.open('https://memories-jet-xi.vercel.app/', '_blank')
    }

    const visitLinkConspiracy = () => {
        window.open('https://conspiracy-theories-nu.vercel.app/', '_blank')
    }

    const checkLinkSpot = (position) => {
        //memories link spot is at x -7.2, z -4.0
        const inMemoriesSpot = position.x > -7.5 && position.x < -6.8 && 
                      position.z > -5.0 && position.z < -3.5
        
        //conspiracy link spot is at x 7.2, z -4.0 (mirrored position)
        const inConspiracySpot = position.x > 11.3 && position.x < 12.5 && 
                      position.z > -27.0 && position.z < -26.0
        
        setIsInLinkMemoriesSpot(inMemoriesSpot)
        setIsInLinkConspiracySpot(inConspiracySpot)
    }

    const jump = () => {
        const origin = body.current.translation()
        origin.y -= 0.1
        const direction = { x: 0, y: -1, z: 0 }

        const ray = new rapier.Ray(origin, direction)
        const hit = world.castRay(ray, 10, true)

        if( hit.timeOfImpact < 0.01 ) {
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

    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.key === 'Enter') {
                if (isInLinkMemoriesSpot) {
                    visitLinkMemories()
                }
                if (isInLinkConspiracySpot) {
                    visitLinkConspiracy()
                }
            }
        }

        // Add UI overlay
        const overlay = document.createElement('div')
        overlay.style.position = 'fixed'
        overlay.style.top = '50%'
        overlay.style.left = '50%'
        overlay.style.transform = 'translate(-50%, -50%)'
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
        overlay.style.color = 'white'
        overlay.style.padding = '1rem 2rem'
        overlay.style.borderRadius = '8px'
        overlay.style.fontFamily = 'Arial, sans-serif'
        overlay.style.zIndex = '1000'
        overlay.style.display = 'none'
        overlay.textContent = 'Press "Enter" to visit'
        document.body.appendChild(overlay)

        // Show/hide overlay based on player position
        if (isInLinkMemoriesSpot || isInLinkConspiracySpot) {
            overlay.style.display = 'block'
        }

        window.addEventListener('keydown', handleKeyPress)
        
        return () => {
            window.removeEventListener('keydown', handleKeyPress)
            document.body.removeChild(overlay)
        }
    }, [isInLinkMemoriesSpot, isInLinkConspiracySpot])

    useEffect(() => {
        // Add UI overlay
        const button = document.createElement('button')
        button.style.position = 'fixed'
        button.style.bottom = '20px'
        button.style.right = '20px'
        button.style.padding = '8px 16px'
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
        button.style.color = 'white'
        button.style.border = '1px solid white'
        button.style.borderRadius = '4px'
        button.style.cursor = 'pointer'
        button.style.fontFamily = 'Arial, sans-serif'
        button.style.zIndex = '1000'
        button.textContent = `Collider: ${colliderType}`

        button.onclick = () => {
            setColliderType(prev => prev === 'ball' ? 'hull' : 'ball')
        }

        document.body.appendChild(button)
        
        return () => {
            document.body.removeChild(button)
        }
    }, [colliderType])

    useFrame((state, delta) => {
    
        /**
         * Controls
         */
        const { forward, backward, left, right, jump } = getKeys()

        // const impulseStrength = 0.1 * delta
        const impulseStrength = 0.15 * delta

        const direction = new THREE.Vector3()
        const bodyPosition = body.current.translation()

        if (forward) {
            direction.x = -Math.cos(angle) * impulseStrength
            direction.z = -Math.sin(angle) * impulseStrength
            }
        if (backward)  {
            direction.x = Math.cos(angle) * impulseStrength
            direction.z = Math.sin(angle) * impulseStrength
            }
        if (left) {
            if ((bodyPosition.x > -14.5 ) &&
             (bodyPosition.x < 14.5) &&
             (bodyPosition.z > -30.7) &&
             (bodyPosition.z < 0.25)) {
            setAngle(angle - 0.3*delta)
            }
        }
        if (right) {
            if ((bodyPosition.x > -14.5 ) &&
             (bodyPosition.x < 14.5) &&
             (bodyPosition.z > -30.7) &&
             (bodyPosition.z < 0.25)) {
            setAngle(angle + 0.3*delta)
            }
        }
        body.current.applyImpulse(direction)
        /**
         * Camera
         */
        const cameraPosition = new THREE.Vector3()

        cameraPosition.x = bodyPosition.x + Math.cos(angle) * radius
        cameraPosition.y = bodyPosition.y + 0.5
        cameraPosition.z = bodyPosition.z + Math.sin(angle) * radius

        const cameraTarget = new THREE.Vector3()
        cameraTarget.copy(bodyPosition)

        // look a bit up
        cameraTarget.y += 0.25
        
        smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
        smoothedCameraTarget.lerp(cameraTarget, 5 * delta )

        state.camera.position.copy(smoothedCameraPosition)
        state.camera.lookAt(smoothedCameraTarget)

        // console.log(bodyPosition)

        checkChangeState(bodyPosition)
        checkLinkSpot(bodyPosition)
    })

    return <>
        <RigidBody 
            ref={ body }
            canSleep={false} 
            colliders={colliderType}
            restituition={ 0.2 } 
            friction={ 0.5 } 
            linearDamping={ 0.5}
            angularDamping={ 0.5 }
            position={ [0, 1, -0.5] }
        >
            <primitive object={baltica.scene} scale={0.06}/>
        </RigidBody>
    </>
}