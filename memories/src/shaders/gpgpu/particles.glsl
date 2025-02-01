uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uBase;

// uniform float uFlowFieldStrength;
uniform float uFlowFieldFrequency; //0.55

uniform vec3 uTouchPosition;
uniform vec3 uPreviousTouchPosition;


#include ../includes/simplexNoise4d.glsl

void main() 
{   
    float time = uTime * 0.1;

    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle = texture(uParticles, uv);
    vec4 base = texture(uBase, uv);


    // Calculate movement speed based on distance between current and previous touch positions
    float touchMovementDistance = length(uTouchPosition - uPreviousTouchPosition);
    float speedFactor = clamp(touchMovementDistance * 3.0, 0.0, 1.0); // Adjust multiplier to tune sensitivity

    // Dead ?
    if (particle.a >= 1.0) 
    {
        particle.a = mod(particle.a, 1.0);
        particle.xyz = base.xyz;
    } else 
    {   
        // Get the data from the last pixel
        vec4 lastPixel = texture(uParticles, vec2(1.0));
        //Get the initial flow field influence
        float initialInfluence = lastPixel.x;
        //get the time of standby
        float timeStandby = lastPixel.y;

        //strength with speed influence
        float baseInfluence = simplexNoise4d(vec4(base.xyz * 0.2, time + 1.0));
        //desired FlowFieldInfluence is between 0.75 and 1
        float dynamicInfluence = (speedFactor - 0.5) * (-2.0); //-0.2 to -1

        // if we're in standby, use time of standby instead of speedFactor
        if (touchMovementDistance < 0.01) {
            dynamicInfluence = -timeStandby;
            //clamp dynamicInfluence between 0.0 and 1.0
            dynamicInfluence = clamp(dynamicInfluence, -5.0, 0.0);
            timeStandby += uDeltaTime*0.1;
        }  else {
            timeStandby = 0.0;  // Reset the timer when there's movement
        }

        float targetInfluence = smoothstep(dynamicInfluence, 1.0, baseInfluence);

        // Gradually interpolate between initial and target influence
        // float lerpFactor = uDeltaTime * 0.5; // Adjust this value to control transition speed
        float flowFieldInfluence = mix(initialInfluence, targetInfluence, 0.5);

         // Store the updated influence and time for the next frame (only for the last pixel)
        if (gl_FragCoord.x >= resolution.x - 1.0 && gl_FragCoord.y >= resolution.y - 1.0) {
            gl_FragColor = vec4(flowFieldInfluence, timeStandby, 0.0, 0.0);
            return;
        }

        //Flow field
        vec3 flowField = vec3(
            simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 0.0, time)),
            (simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency+ 1.0, time))),
            simplexNoise4d(vec4(particle.xyz * uFlowFieldFrequency + 2.0, time))
        );

    //normalize direction
     flowField = normalize(flowField);

     //flowfieldStrength depending on distance between base and touch position
     float distance = length(base.xyz - uTouchPosition);

     //flowFieldStrength between 0 and 7, increased when moving faster
     float baseFlowStrength = (1.0 - smoothstep(0.0, 1.0, distance)) * 7.0;
     float dynamicFlowStrength = mix(baseFlowStrength, baseFlowStrength * 2.0, speedFactor);

     //apply flowfield to the particle
     particle.xyz += flowField * uDeltaTime * flowFieldInfluence * dynamicFlowStrength;

     //particle life span
     particle.a += uDeltaTime * 0.3;
    }

    gl_FragColor = particle;
}