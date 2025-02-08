import WallHorizontal from "./Walls/WallHorizontal"
import WallVertical from "./Walls/WallVertical"

export default function MovingWalls({ gameState })
{
    return <>
         {/*GOING  FROM LEFT TO RIGHT, FROM Z=0 FURTHER AWAY*/}
        {gameState === 'A' && <WallVertical position={[-4.85, 0.75, 0.55]} length={2.56} />}
        {gameState !== 'B' && <WallVertical position={[1.65, 0.75, -3.0]} length={9.7} />}

        {gameState === 'D' && <WallHorizontal position={[-12.9, 0.75, -8]} length={5.5} />} 
        {gameState === 'C' && <WallHorizontal position={[-7.425, 0.75, -8]} length={4.85} />} 
        {(gameState === 'B' || gameState === 'C'  ) && <WallHorizontal position={[-1.6, 0.75, -8]} length={6.2} />} 
        {gameState === 'C' && <WallHorizontal position={[13.1, 0.75, -8]} length={5.2} />} 

        {gameState !== 'C' && <WallVertical position={[-4.85, 0.75, -10.95]} length={5.8} />}

        {gameState === 'C' && <WallHorizontal position={[-10.35, 0.75, -14]} length={10.7} />}
        {gameState !== 'C' && <WallHorizontal position={[13.35, 0.75, -14]} length={4.7} />}
    </>
}