
export default function Lights()
{
    return <>
        <pointLight
            position={ [ 0, 2.3, -6.5 ] }
            intensity={ 8.0 }
            castShadow
        />
        <pointLight
            position={ [ -14, 2.5, -16 ] }
            intensity={ 8.0 }
            castShadow
        />
        <pointLight
            position={ [ 12, 2.5, -27] }
            intensity={ 6.0 }
            castShadow
        />
        <pointLight
            position={ [ -12, 2.5, -24 ] }
            intensity={ 6.0 }
            castShadow
        />
    </>
}