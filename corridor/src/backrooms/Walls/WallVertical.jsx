import * as THREE from 'three'
import { RigidBody } from "@react-three/rapier"


export default function WallVertical({position = [0, 0, 0], length=14}) {
    const wallMaterial2 = new THREE.MeshStandardMaterial({ color: '#615A04' })
    const boxGeometry = new THREE.BoxGeometry(1,1,1)

    return <RigidBody type="fixed" restitution={0.2} friction={0}>
            <mesh geometry = {boxGeometry}
                position={ position } 
                scale = { [0.3, 2.5, length] }
                material ={ wallMaterial2 }
                receiveShadow
                castShadow
            />
        </RigidBody>
}