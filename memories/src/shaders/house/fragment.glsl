uniform sampler2D uMap;
uniform vec3 uTouchPosition;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    //retrievening the original color:
    vec4 textureColor = texture2D(uMap, vUv);
    //center:
    vec2 center = vec2(0.5, 0.0);
    vec3 centerRaycastExample = vec3(0.25, 0.0, 1.2);
    //distance to center:
    vec2 pos = vPosition.xz;
    // float distance = length(pos - center);
    float distance = pow(length(vPosition - uTouchPosition), 4.0);
    // map distance to 0 from 1:
    float alpha = distance*0.15;
    // float alpha = step(1.3, distance);
    //alpha based on distance:
    csm_DiffuseColor = vec4(textureColor.rgb, alpha);
    // csm_DiffuseColor = vec4(vUv, 0.0, 1.0);
}




