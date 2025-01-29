import { useHelper } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { DirectionalLightHelper, SpotLightHelper, PointLightHelper } from "three";

export default function Lights()
{
    // const directionalLightRef = useRef()
    // useHelper(directionalLightRef, DirectionalLightHelper, 3, "red");
    // const spotLightRef1 = useRef()
    // useHelper(spotLightRef1, SpotLightHelper, 3, "blue");
    // const spotLightRef2 = useRef()
    // useHelper(spotLightRef2, SpotLightHelper, 3, "yellow");
    // const spotLightRef3 = useRef()
    // useHelper(spotLightRef3, SpotLightHelper, 3, "red");
    // const pointLightRef1 = useRef()
    // useHelper(pointLightRef1, PointLightHelper, 3, "green");
    // const pointLightRef2 = useRef()
    // useHelper(pointLightRef2, PointLightHelper, 3, "blue");
    // const pointLightRef3 = useRef()
    // useHelper(pointLightRef3, PointLightHelper, 3, "yellow");
    // const pointLightRef4 = useRef()
    // useHelper(pointLightRef4, PointLightHelper, 3, "red");

    //change the target position of the spot light once
    useEffect(() => {
        // directionalLightRef.current.target.position.set(0, 0, -2)
        // directionalLightRef.current.target.updateMatrixWorld()
        // spotLightRef1.current.target.position.set(-12, 0, -16)
        // spotLightRef1.current.target.updateMatrixWorld()
        // spotLightRef2.current.target.position.set(0, 0, -16)
        // spotLightRef2.current.target.updateMatrixWorld()
        // spotLightRef3.current.target.position.set(12, 0, -16)
        // spotLightRef3.current.target.updateMatrixWorld()
    }, [])

    return <>
        <ambientLight 
            intensity={ 0.5 } 
            color={ '#F2E1AF' }
        />
        {/* <directionalLight
            ref={ directionalLightRef }
            castShadow
            position={ [ 0, 8, -1.5 ] }
            intensity={ 1.0 }
            shadow-mapSize={ [ 1024, 1024 ] }
            shadow-camera-near={ 1 }
            shadow-camera-far={ 50 }
            shadow-camera-top={ 50 }
            shadow-camera-right={ 50 }
            shadow-camera-bottom={ - 50 }
            shadow-camera-left={ - 30 }
        /> */}
        <pointLight
            // ref={ pointLightRef1 }
            position={ [ 0, 2.3, -6.5 ] }
            intensity={ 12.0 }
            castShadow
        />
        <pointLight
            // ref={ pointLightRef2 }
            position={ [ -14, 2.5, -16 ] }
            intensity={ 10.0 }
            castShadow
        />
        <pointLight
            // ref={ pointLightRef3 }
            position={ [ 12, 2.5, -27] }
            intensity={ 8.0 }
            castShadow
        />
        <pointLight
            // ref={ pointLightRef4 }
            position={ [ -12, 2.5, -24 ] }
            intensity={ 8.0 }
            castShadow
        />
    </>
}