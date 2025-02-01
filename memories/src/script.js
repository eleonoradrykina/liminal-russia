import * as THREE from 'three'

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'
import { sizes, handleResize, setScene, setRenderer } from './utils.js'
import environment from './environment.js'
import GUI from 'lil-gui'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'


import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'
import gpgpuParticlesShader from './shaders/gpgpu/particles.glsl'

import houseVertexShader from './shaders/house/vertex.glsl'
import houseFragmentShader from './shaders/house/fragment.glsl'


/**
 * Base
 */
// Debug
// const gui = new GUI({ width: 340 })
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Basic scene with camera and orbit controls
const { scene, camera, controls } = setScene(true, canvas)



// Loaders
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const rgbeLoader = new RGBELoader()

/**
 * Renderer
 */
debugObject.clearColor = '#1e1e1e'
const renderer = setRenderer(canvas, debugObject.clearColor)


//add background texture sky
const textureLoader = new THREE.TextureLoader()
const bgTexture = textureLoader.load('./env_maps/background-sky.jpeg')
bgTexture.colorSpace = THREE.SRGBColorSpace

scene.background = bgTexture

/**
 * Scene's environment
 */
const environmentGroup = environment()
scene.add(environmentGroup)


//uniforms for House material
const uniforms = {
    uMap: { value: null }, //setting it to inital map later
    uTouchPosition: { value: new THREE.Vector3(0, 0, 0) }
}

// Material
const shaderMaterial = new CustomShaderMaterial({
    //CSM
    baseMaterial: THREE.MeshStandardMaterial,
    // map: colorTexture,
    vertexShader: houseVertexShader,
    fragmentShader: houseFragmentShader,
    // silent: true,
    uniforms: uniforms,

    // MeshBasicMaterial properties
    transparent: true,
    wireframe: false
})



/**
 * Load model
 */
const gltf = await gltfLoader.loadAsync('/compressed_house.glb')

scene.add(gltf.scene)
const house = gltf.scene.children[0]

//taking initial map from the house
const map = house.material.map
//setting shader material to the house
house.material = shaderMaterial
//passing initial map as a uniform into the shader material
shaderMaterial.uniforms.uMap.value = map

//ambient light
const ambientLight = new THREE.AmbientLight(0xFFF7D7, 0.5)
scene.add(ambientLight)

//directional light
const directionalLight = new THREE.DirectionalLight(0xFFF7ED, 10)
directionalLight.position.set(4, 14, 6)
scene.add(directionalLight)

const directionalLightBack = new THREE.DirectionalLight(0xFFF7ED, 3)
directionalLightBack.position.set(-8, 14, -6)
scene.add(directionalLightBack)

/**
 * Base Geometry
 */

const baseGeometry = {}
baseGeometry.instance = gltf.scene.children[0].geometry
//set the scale
baseGeometry.instance.scale(0.25, 0.25, 0.25)
//rotate
baseGeometry.instance.rotateX(Math.PI / 2)

//taking this from atts of the instance
baseGeometry.count = baseGeometry.instance.attributes.position.count

/**
 * GPU Compute
 */
//Setup
const gpgpu = {}
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count))
gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer) //square: width , height

//Base particles
const baseParticlesTexture = gpgpu.computation.createTexture()

for (let i = 0; i < baseGeometry.count; i++) {
    const i3 = i * 3
    const i4 = i * 4

    // Position based on geometry
    baseParticlesTexture.image.data[i4 + 0] = baseGeometry.instance.attributes.position.array[i3 + 0]
    baseParticlesTexture.image.data[i4 + 1] = baseGeometry.instance.attributes.position.array[i3 + 1]
    baseParticlesTexture.image.data[i4 + 2] = baseGeometry.instance.attributes.position.array[i3 + 2]
    baseParticlesTexture.image.data[i4 + 3] = Math.random()

}

// Store values in the last pixel
const lastPixelIndex = (baseGeometry.count) * 4
//flowFieldInfluence 0.0
baseParticlesTexture.image.data[lastPixelIndex + 0] = 0.0 //start with 0.0
//time of standby 0.0
baseParticlesTexture.image.data[lastPixelIndex + 1] = 0.0 //start with 0.0



//Particles variable
gpgpu.particlesVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticlesShader, baseParticlesTexture)
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [gpgpu.particlesVariable]) //you can pass more dependencies here

// Uniforms
gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0)
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0)
gpgpu.particlesVariable.material.uniforms.uBase = new THREE.Uniform(baseParticlesTexture)
gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new THREE.Uniform(0.55)
gpgpu.particlesVariable.material.uniforms.uTouchPosition = new THREE.Uniform(new THREE.Vector3(0, 0, 0))
gpgpu.particlesVariable.material.uniforms.uPreviousTouchPosition = new THREE.Uniform(new THREE.Vector3(0, 0, 0))

//Init
gpgpu.computation.init()

// Debug 
gpgpu.debug = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
        map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture
    })
)

scene.add(gpgpu.debug)

gpgpu.debug.visible = false


/**
 * Particles
 */
const particles = {}

//Geometry
const particlesUvArray = new Float32Array(baseGeometry.count * 2)
const sizesArray = new Float32Array(baseGeometry.count)

for (let y = 0; y < gpgpu.size; y++) {
    for (let x = 0; x < gpgpu.size; x++) {
        const i = (y * gpgpu.size + x)
        const i2 = i * 2

        //Particles UV
        const uvX = (x + 0.5) / gpgpu.size
        const uvY = (y + 0.5) / gpgpu.size

        particlesUvArray[i2 + 0] = uvX
        particlesUvArray[i2 + 1] = uvY

        //sizes
        sizesArray[i] = Math.random()
    }
}




particles.geometry = new THREE.BufferGeometry()
particles.geometry.setDrawRange(0, baseGeometry.count)
particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesUvArray, 2))
particles.geometry.setAttribute('aColor', baseGeometry.instance.attributes.color_1)
particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1))




// Material
particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms:
    {
        uSize: new THREE.Uniform(0.028),
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
        uParticlesTexture: new THREE.Uniform(),
    },
    transparent: true,
    wireframe: false
})

// Points
particles.points = new THREE.Points(particles.geometry, particles.material)
scene.add(particles.points)

/**
 * Tweaks
 */
// gui.addColor(debugObject, 'clearColor').onChange(() => { renderer.setClearColor(debugObject.clearColor) })
// gui.add(particles.material.uniforms.uSize, 'value').min(0).max(1).step(0.001).name('uSize')
// gui
//     .add(gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency, 'value')
//     .min(0)
//     .max(1)
//     .step(0.01)
//     .name('uFlowFieldFrequency')

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

//handle resize window
handleResize(camera, renderer, particles, sizes)

/**
 * Cursor
 */

const mouse = new THREE.Vector2()
window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX / sizes.width * 2 - 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1
}
)

/**
 * Raycasting
 */
const raycaster = new THREE.Raycaster()

const checkIntersects = (object) => {
    const modelIntersects = raycaster.intersectObject(object)
    if (modelIntersects.length) {
        // Store current position as previous before updating current
        gpgpu.particlesVariable.material.uniforms.uPreviousTouchPosition.value.copy(
            gpgpu.particlesVariable.material.uniforms.uTouchPosition.value
        )

        // Update current touch position
        uniforms.uTouchPosition.value = modelIntersects[0].point
        gpgpu.particlesVariable.material.uniforms.uTouchPosition.value = modelIntersects[0].point
    }
}

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update controls
    controls.update()
    // console.log(controls)

    // put time into shader
    gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime
    gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime

    //gpgpu update
    gpgpu.computation.compute()

    //now put this texture into the particles material
    particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture

    // Render normal scene
    renderer.render(scene, camera)

    //raycasting
    raycaster.setFromCamera(mouse, camera)
    if (house) {
        checkIntersects(house)
    }

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()