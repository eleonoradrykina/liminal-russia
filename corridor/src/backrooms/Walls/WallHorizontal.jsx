import * as THREE from 'three'
import { RigidBody } from "@react-three/rapier"
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

import CustomShaderMaterial from 'three-custom-shader-material'

import wallpaperVertexShader from '../shaders/wallpaper/vert.glsl'
import wallpaperFragmentShader from '../shaders/wallpaper/frag.glsl'


const boxGeometry = new THREE.BoxGeometry(1,1,1)
const wallMaterial2 = new THREE.MeshStandardMaterial({ color: '#615A04' })

export default function WallHorizontal({position = [0, 0, 0], length=14, wallpaper=true}) {
    const materialRef = useRef()

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    return <>
        <RigidBody type="fixed" restitution={0.2} friction={0}>
                <mesh geometry = {boxGeometry}
                    position={ position } 
                    scale = { [length, 2.5, 0.3] }
                    receiveShadow
                    castShadow
                    material={!wallpaper && wallMaterial2}
                >
                    {wallpaper && 
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
                    />}
                </mesh>
            </RigidBody>
          </>
}