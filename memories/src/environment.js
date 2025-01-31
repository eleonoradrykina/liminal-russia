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
    cube.position.set(-8, -0.2, 8)
    cube.rotation.set(0, -Math.PI / 2, 0)
    groupEnvironment.add(cube)

    const cube2 = cube.clone()
    cube2.position.set(8, -0.2, 8)
    groupEnvironment.add(cube2)

    const cube3 = cube.clone()
    cube3.position.set(8, -0.2, -8)
    groupEnvironment.add(cube3)

    const cube4 = cube.clone()
    cube4.position.set(-8, -0.2, -8)
    groupEnvironment.add(cube4)

    //load textures
    const textureLoader = new THREE.TextureLoader()
    const asphaltAlpha = textureLoader.load('./textures/snow_field_textures/asphalt_04_alpha.png')
    // const asphaltDiffuse = textureLoader.load('./textures/snow_field_textures/snow_field_aerial_col_1k.jpg')
    // const asphaltNormal = textureLoader.load('./textures/snow_field_textures/snow_field_aerial_nor_gl_1k.jpg')
    // const asphaltDisplacement = textureLoader.load('./textures/snow_field_textures/snow_field_aerial_height_1k.jpg')
    // const asphaltARM = textureLoader.load('./textures/snow_field_textures/snow_field_aerial_arm_1k.jpg')
    // asphaltDiffuse.repeat.set(1, 1)
    // asphaltDiffuse.wrapS = THREE.RepeatWrapping
    // asphaltDiffuse.wrapT = THREE.RepeatWrapping

    //material
    const material = new THREE.MeshStandardMaterial({
        alphaMap: asphaltAlpha,
        color: 0x636458,
        // map: asphaltDiffuse,
        // normalMap: asphaltNormal,
        // displacementMap: asphaltDisplacement,
        // roughnessMap: asphaltARM,
        // metalnessMap: asphaltARM,
        // displacementScale: 0.05,
        // displacementBias: -0.125,
        transparent: true,
    })
    // material.map.colorSpace = THREE.SRGBColorSpace

    //add plane
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1, 10, 10),
        material
    )
    plane.position.set(0, -1.2, 0)
    plane.rotation.set(-Math.PI / 2, 0, 0)
    plane.scale.set(28, 28, 10)
    groupEnvironment.add(plane)

    return groupEnvironment
}