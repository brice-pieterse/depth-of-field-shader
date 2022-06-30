import { ShaderMaterial } from 'three';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import * as THREE from 'three'


class FocusBlurPass extends Pass {

	constructor(scene, camera) {

		super();

        this.scene = scene
        this.camera = camera



        // render targets
        this.renderTargetX = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
        this.renderTargetX.texture.minFilter = THREE.NearestFilter;
        this.renderTargetX.texture.magFilter = THREE.NearestFilter;
        this.renderTargetX.stencilBuffer = false;
        this.renderTargetX.depthTexture = new THREE.DepthTexture();
        this.renderTargetX.depthTexture.format = THREE.DepthFormat;
        this.renderTargetX.depthTexture.type = THREE.UnsignedShortType;


		this.fsQuad = new FullScreenQuad( );

        this.blurMaterial = new ShaderMaterial({
            uniforms: BlurShader.uniforms,
            vertexShader: BlurShader.vertexShader,
			fragmentShader: BlurShader.fragmentShader,
            transparent: true
        })

        // Used for testing the depth extraction
        this.testDepthMaterial = new ShaderMaterial({
            uniforms: TestDepthShader.uniforms,
            vertexShader: TestDepthShader.vertexShader,
			fragmentShader: TestDepthShader.fragmentShader,
        })


        // render scene into target to extract blur
        this.extractDepthTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
        this.extractDepthTarget.depthTexture = new THREE.DepthTexture();
        // OPTIONS
        // this.extractDepthTarget.texture.minFilter = THREE.NearestFilter;
        // this.extractDepthTarget.texture.magFilter = THREE.NearestFilter;
        // this.extractDepthTarget.stencilBuffer = false;
        // this.extractDepthTarget.depthTexture.format = THREE.DepthFormat;
        // this.extractDepthTarget.depthTexture.type = THREE.UnsignedShortType;


	}

    setSize(width, height){
        this.renderTargetX.setSize(width, height)
    }

	render( renderer, writeBuffer, readBuffer /*, deltaTime, maskActive */ ) {


        renderer.setRenderTarget( this.extractDepthTarget );
        //this.fsQuad.render( renderer ); // don't render here, only depth will be the quad which has no depth
        renderer.render(this.scene, this.camera); // allows us to get the depth of elements in the scene

        // WORK IN PROGRESS
        // we now have depth in this.extractDepthTarget.depthTexture, let's use it in blurMaterial

		this.blurMaterial.uniforms.tDiffuse.value = this.extractDepthTarget.texture;
        this.blurMaterial.uniforms.tDepth.value = this.extractDepthTarget.depthTexture;
        this.fsQuad.material = this.blurMaterial;

        // Render input to screen
		if ( this.renderToScreen ) {

			renderer.setRenderTarget( null );
			renderer.clear();
			this.fsQuad.render( renderer );

		}
        else {
            renderer.setRenderTarget( writeBuffer );
            this.fsQuad.render( renderer );
        }

	}

}



// Blur Pass
const BlurShader = {
    uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        targetWidth: { value: window.innerWidth },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 100 }

    },
    vertexShader: `
    uniform float targetWidth;
    varying vec2 blurTextureCoords[11];
    varying vec2 vUv;
    void main(){
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vUv = uv;
        float pixelSize = 1.0/targetWidth * 4.0;

        for (int i=-5;i<=5; i++){
            blurTextureCoords[i+5] = vec2(float(i) * pixelSize, 0.0);
        }
    }
    `,
    fragmentShader: `
    #include <packing>
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    varying vec2 vUv;
    varying vec2 blurTextureCoords[11];
    uniform float cameraNear;
    uniform float cameraFar;

    float readDepth( sampler2D depthSampler, vec2 coord ) {
        float fragCoordZ = texture2D( depthSampler, coord ).x;
        float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
        return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
    }

    float getDepthAfterVector (vec2 v1, vec2 v2) {
        return readDepth( tDepth, v1 + v2 );
    }

    void main(){

        float depth = readDepth( tDepth, vUv );
        //vec4 depthDiffuse = texture2D( tDepth, vUv);
 

        depth = step(1.0, depth);

        vec4 color = texture2D(tDiffuse, vUv + blurTextureCoords[0] * depth * getDepthAfterVector(blurTextureCoords[0], vUv))  * 0.0093;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[1] * depth * getDepthAfterVector(blurTextureCoords[1], vUv)) * 0.0093;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[2] * depth * getDepthAfterVector(blurTextureCoords[2], vUv)) * 0.028002;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[3] * depth * getDepthAfterVector(blurTextureCoords[3], vUv)) * 0.065984;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[4] * depth * getDepthAfterVector(blurTextureCoords[4], vUv)) * 0.121703;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[5] * depth * getDepthAfterVector(blurTextureCoords[5], vUv)) * 0.175713;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[6] * depth * getDepthAfterVector(blurTextureCoords[6], vUv)) * 0.198596;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[7] * depth * getDepthAfterVector(blurTextureCoords[7], vUv)) * 0.175713;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[8] * depth * getDepthAfterVector(blurTextureCoords[8], vUv)) * 0.121703;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[9] * depth * getDepthAfterVector(blurTextureCoords[9], vUv)) * 0.065984;
        color += texture2D(tDiffuse, vUv + blurTextureCoords[10] * depth * getDepthAfterVector(blurTextureCoords[10], vUv)) * 0.0093;
        //gl_FragColor.rgb = 1.0 - vec3( depth );
        //gl_FragColor.a = 1.0;
        gl_FragColor = color;
    }
    `
}


// Test Depth Pass -> Use this to test the depth extraction by rendering depth to screen
const TestDepthShader = {
    uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 100 }
    },
    vertexShader: `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    #include <packing>

    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float cameraNear;
    uniform float cameraFar;


    float readDepth( sampler2D depthSampler, vec2 coord ) {
        float fragCoordZ = texture2D( depthSampler, coord ).x;
        float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
        return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
    }

    void main() {
        float depth = readDepth( tDepth, vUv );
        vec4 depthDiffuse = texture2D( tDepth, vUv);

        gl_FragColor.rgb = 1.0 - vec3( depth );
        gl_FragColor.a = 1.0;
    }
    `
}


export { FocusBlurPass };