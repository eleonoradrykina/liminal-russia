import * as THREE from 'three'

export default function environment() {
    const groupEnvironment = new THREE.Group()

    //cube
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(8, 2, 1.7, 8, 8, 8),
        new THREE.MeshBasicMaterial({
            color: 0xB0B2A4,
            // opacity: 0.5,
            wireframe: true,
            // transparent: true
        })
    )

    // Create outer ring of cubes
    const positions = [
        { x: -8, z: 8, rotation: -Math.PI / 2 },
        { x: 8, z: 8, rotation: -Math.PI / 2 },
        { x: 8, z: -8, rotation: -Math.PI / 2 },
        { x: -8, z: -8, rotation: -Math.PI / 2 },
        { x: 0, z: 16, rotation: 0 },
        { x: 16, z: 16, rotation: 0 },
        { x: -16, z: 16, rotation: 0 },
        { x: 0, z: -16, rotation: 0 },
        { x: 16, z: -16, rotation: 0 },
        { x: -16, z: -16, rotation: 0 },
        { x: -24, z: -8, rotation: -Math.PI / 2 },
        { x: -24, z: 8, rotation: -Math.PI / 2 },
        { x: 24, z: -8, rotation: -Math.PI / 2 },
        { x: 24, z: 8, rotation: -Math.PI / 2 }
    ];

    positions.forEach(pos => {
        const newCube = cube.clone();
        newCube.position.set(pos.x, -0.2, pos.z);
        newCube.rotation.set(0, pos.rotation, 0);
        groupEnvironment.add(newCube);
    });

    //load textures
    const textureLoader = new THREE.TextureLoader()
    const asphaltAlpha = textureLoader.load('./textures/snow_field_textures/asphalt_04_alpha.png')

    //material
    const material = new THREE.MeshStandardMaterial({
        alphaMap: asphaltAlpha,
        color: 0x636458,
        transparent: true,
    })
    // material.map.colorSpace = THREE.SRGBColorSpace

    //add plane
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60, 10, 10),
        material
    )
    plane.position.set(0, -1.2, 0)
    plane.rotation.set(-Math.PI / 2, 0, 0)
    groupEnvironment.add(plane)

    return groupEnvironment
}