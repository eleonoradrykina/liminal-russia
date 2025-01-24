export default function Lights()
{
    return <>
        <directionalLight
            castShadow
            position={ [ 0, 4, 0 ] }
            intensity={ 1.0 }
            shadow-mapSize={ [ 1024, 1024 ] }
            shadow-camera-near={ 1 }
            shadow-camera-far={ 50 }
            shadow-camera-top={ 50 }
            shadow-camera-right={ 50 }
            shadow-camera-bottom={ - 50 }
            shadow-camera-left={ - 30 }
        />
        <ambientLight intensity={ 1.0 } />
    </>
}