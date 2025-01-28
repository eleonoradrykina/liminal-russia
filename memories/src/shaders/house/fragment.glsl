varying vec2 vUv;

void main() {
    //retrievening the original color:
    vec3 color = csm_DiffuseColor.rgb;
    //center:
    vec2 center = vec2(0.5, 0.5);
    //distance to center:
    vec2 distance = (vUv - center);
    float length = length(distance);
    //alpha based on distance:
    csm_DiffuseColor = vec4( color, 1.0);
}