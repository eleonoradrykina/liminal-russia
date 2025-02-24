import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

//handle resize
const handleResize = (camera, renderer, particles) => {

    window.addEventListener('resize', () => {
        // Update sizes
        sizes.width = window.innerWidth
        sizes.height = window.innerHeight
        sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

        // Materials
        particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

        // Update camera
        camera.aspect = sizes.width / sizes.height
        camera.updateProjectionMatrix()

        // Update renderer
        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(sizes.pixelRatio)
    })
}

//set scene with the camera and orbit controls
const setScene = (orbitcontrols = true, canvas) => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.001, 1000)
    camera.position.set(12, 0, 20)
    scene.add(camera)
    if (orbitcontrols) {
        const controls = new OrbitControls(camera, canvas)
        controls.enableDamping = true
        controls.enablePan = false
        controls.maxDistance = 50
        controls.minDistance = 5
        controls.maxPolarAngle = Math.PI / 2
        controls.minPolarAngle = Math.PI / 3
        return { scene, camera, controls }
    } else {
        return { scene, camera }
    }
}

//set renderer
const setRenderer = (canvas, clearColor) => {
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
    renderer.setClearColor(clearColor)
    return renderer
}

export { sizes, handleResize, setScene, setRenderer }