uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uTime;
uniform float uScroll;
uniform vec2 uResolution;

// Physics-driven shape positions
uniform vec3 uShapePos0;
uniform vec3 uShapePos1;
uniform vec3 uShapePos2;
uniform vec3 uShapePos3;
uniform vec3 uShapePos4;

// Physics-driven shape rotations
uniform vec3 uShapeRot0;
uniform vec3 uShapeRot1;
uniform vec3 uShapeRot2;
uniform vec3 uShapeRot3;
uniform vec3 uShapeRot4;

varying vec2 vUv;

// Helper
float dot2( in vec3 v ) { return dot(v,v); }

// 3D Signed Distance Functions
float sdSphere( vec3 p, float s )
{
    return length(p)-s;
}

float sdBox( vec3 p, vec3 b )
{
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdCone( in vec3 p, in vec2 c, float h )
{
    vec2 q = h*vec2(c.x/c.y,-1.0);
    vec2 w = vec2( length(p.xz), p.y );
    vec2 a = w - q*clamp( dot(w,q)/dot(q,q), 0.0, 1.0 );
    vec2 b = w - q*vec2( clamp( w.x/q.x, 0.0, 1.0 ), 1.0 );
    float k = sign( q.y );
    float d = min(dot( a, a ),dot(b, b));
    float s = max( k*(w.x*q.y-w.y*q.x),k*(w.y-q.y) );
    return sqrt(d)*sign(s);
}

float sdOctahedron( vec3 p, float s )
{
    p = abs(p);
    float m = p.x + p.y + p.z - s;
    vec3 q;
         if( 3.0*p.x < m ) q = p.xyz;
    else if( 3.0*p.y < m ) q = p.yzx;
    else if( 3.0*p.z < m ) q = p.zxy;
    else return m*0.57735027;
    float k = clamp(0.5*(q.z-q.y+s),0.0,s);
    return length(vec3(q.x,q.y-s+k,q.z-k));
}

// Rotation matrices
mat3 rotateY( float a ) {
    float c = cos(a), s = sin(a);
    return mat3(c,0,s, 0,1,0, -s,0,c);
}

mat3 rotateX( float a ) {
    float c = cos(a), s = sin(a);
    return mat3(1,0,0, 0,c,-s, 0,s,c);
}

mat3 rotateZ( float a ) {
    float c = cos(a), s = sin(a);
    return mat3(c,-s,0, s,c,0, 0,0,1);
}

// Scene - returns vec2(distance, materialId)
vec2 opU( vec2 d1, vec2 d2 ) {
    return (d1.x<d2.x) ? d1 : d2;
}

vec2 map( in vec3 p )
{
    vec2 res = vec2(1e10, -1.0);

    // Shape 0: Large sphere
    vec3 p1 = p - uShapePos0;
    p1 = rotateY(uShapeRot0.y) * rotateX(uShapeRot0.x) * rotateZ(uShapeRot0.z) * p1;
    res = opU( res, vec2( sdSphere(p1, 2.5), 0.0 ) );

    // Shape 1: Cube
    vec3 p2 = p - uShapePos1;
    p2 = rotateY(uShapeRot1.y) * rotateX(uShapeRot1.x) * rotateZ(uShapeRot1.z) * p2;
    res = opU( res, vec2( sdBox(p2, vec3(1.2)), 1.0 ) );

    // Shape 2: Cone
    vec3 p3 = p - uShapePos2;
    p3 = rotateX(3.14159) * p3;
    p3 = rotateY(uShapeRot2.y) * rotateX(uShapeRot2.x) * rotateZ(uShapeRot2.z) * p3;
    res = opU( res, vec2( sdCone(p3, vec2(0.5, 0.866), 1.8), 2.0 ) );

    // Shape 3: Small sphere
    vec3 p4 = p - uShapePos3;
    res = opU( res, vec2( sdSphere(p4, 0.9), 3.0 ) );

    // Shape 4: Octahedron
    vec3 p5 = p - uShapePos4;
    p5 = rotateY(uShapeRot4.y) * rotateX(uShapeRot4.x) * rotateZ(uShapeRot4.z) * p5;
    res = opU( res, vec2( sdOctahedron(p5, 1.5), 4.0 ) );

    return res;
}

// https://iquilezles.org/articles/rmshadows
float calcSoftshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
    float res = 1.0;
    float t = mint;
    float ph = 1e20;

    for( int i=0; i<32; i++ )
    {
        float h = map( ro + rd*t ).x;
        float y = h*h/(2.0*ph);
        float d = sqrt(h*h-y*y);
        res = min( res, 10.0*d/max(0.0,t-y) );
        ph = h;
        t += h;
        if( res<0.0001 || t>tmax ) break;
    }
    return clamp( res, 0.0, 1.0 );
}

// https://iquilezles.org/articles/normalsSDF
vec3 calcNormal( in vec3 pos )
{
    vec3 n = vec3(0.0);
    for( int i=0; i<4; i++ )
    {
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e*map(pos+0.0005*e).x;
    }
    return normalize(n);
}

// https://iquilezles.org/articles/nvscene2008/rwwtt.pdf
float calcAO( in vec3 pos, in vec3 nor )
{
    float occ = 0.0;
    float sca = 1.0;
    for( int i=0; i<5; i++ )
    {
        float h = 0.01 + 0.12*float(i)/4.0;
        float d = map( pos + h*nor ).x;
        occ += (h-d)*sca;
        sca *= 0.95;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 );
}

// Material color based on shape ID
vec3 getMaterial( float m )
{
    if( m < 0.5 ) return uColorA * 1.2;        // Large sphere
    if( m < 1.5 ) return uColorB * 1.3;        // Cube
    if( m < 2.5 ) return uColorC * 1.2;        // Cone
    if( m < 3.5 ) return uColorA * 1.0;        // Small sphere
    return mix(uColorB, uColorC, 0.5) * 1.1;   // Octahedron
}

vec3 render( in vec3 ro, in vec3 rd )
{
    // Background gradient based on extracted colors
    vec3 col = mix( uColorA * 0.15, uColorB * 0.1, rd.y * 0.5 + 0.5 );
    col += uColorC * 0.05 * (1.0 - abs(rd.y));

    // Raycast
    float t = 0.0;
    float tmax = 40.0;
    vec2 res = vec2(-1.0);

    for( int i=0; i<128; i++ )
    {
        vec3 p = ro + rd*t;
        vec2 h = map(p);
        if( abs(h.x)<0.0001*t || t>tmax ) break;
        t += h.x;
        res = h;
    }

    if( t < tmax )
    {
        vec3 pos = ro + t*rd;
        vec3 nor = calcNormal( pos );
        vec3 ref = reflect( rd, nor );

        // Material
        col = getMaterial( res.y );
        float ks = 1.0;

        // Lighting
        float occ = calcAO( pos, nor );

        vec3 lin = vec3(0.0);

        // Sun
        {
            vec3 lig = normalize( vec3(-0.5, 0.4, -0.6) );
            vec3 hal = normalize( lig - rd );
            float dif = clamp( dot( nor, lig ), 0.0, 1.0 );
                  dif *= calcSoftshadow( pos, lig, 0.02, 5.0 );
            float spe = pow( clamp( dot( nor, hal ), 0.0, 1.0 ), 16.0 );
                  spe *= dif;
                  spe *= 0.04 + 0.96*pow( clamp(1.0-dot(hal,lig),0.0,1.0), 5.0 );
            lin += col * 2.20 * dif * vec3(1.30,1.00,0.70);
            lin +=       5.00 * spe * vec3(1.30,1.00,0.70) * ks;
        }

        // Sky
        {
            float dif = sqrt( clamp( 0.5+0.5*nor.y, 0.0, 1.0 ) );
                  dif *= occ;
            float spe = smoothstep( -0.2, 0.2, ref.y );
                  spe *= dif;
                  spe *= 0.04 + 0.96*pow( clamp(1.0+dot(nor,rd), 0.0, 1.0), 5.0 );
                  spe *= calcSoftshadow( pos, ref, 0.02, 5.0 );
            lin += col * 0.60 * dif * vec3(0.40,0.60,1.15);
            lin +=       2.00 * spe * vec3(0.40,0.60,1.30) * ks;
        }

        // Back light
        {
            float dif = clamp( dot( nor, normalize(vec3(0.5,0.0,0.6)) ), 0.0, 1.0 );
                  dif *= occ;
            lin += col * 0.55 * dif * vec3(0.25,0.25,0.25);
        }

        // Subsurface scattering approximation
        {
            float dif = pow( clamp(1.0+dot(nor,rd), 0.0, 1.0), 2.0 );
                  dif *= occ;
            lin += col * 0.25 * dif * vec3(1.00,1.00,1.00);
        }

        col = lin;

        // Fog / atmospheric perspective
        col = mix( col, uColorA * 0.2, 1.0 - exp( -0.00005*t*t*t ) );
    }

    return col;
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
    vec3 cw = normalize(ta-ro);
    vec3 cp = vec3(sin(cr), cos(cr), 0.0);
    vec3 cu = normalize( cross(cw,cp) );
    vec3 cv = cross(cu,cw);
    return mat3( cu, cv, cw );
}

void main()
{
    vec2 fragCoord = vUv * uResolution;
    float time = uTime * 0.3;

    // Camera - gentle orbit
    vec3 ta = vec3( 0.0, 0.0, -6.0 );
    vec3 ro = ta + vec3( 8.0*cos(0.1*time), 2.0 + sin(time*0.15)*0.5, 8.0*sin(0.1*time) );

    mat3 ca = setCamera( ro, ta, 0.0 );

    // Ray direction
    vec2 p = (2.0*fragCoord - uResolution) / uResolution.y;
    vec3 rd = ca * normalize( vec3(p, 2.5) );

    // Render
    vec3 col = render( ro, rd );

    // Gamma
    col = pow( col, vec3(0.4545) );

    gl_FragColor = vec4( col, 1.0 );
}
