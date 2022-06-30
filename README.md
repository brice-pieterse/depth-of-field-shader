# depth-of-field-shader
A simple depth of field post-processing shader that can be passed to THREEJS EffectComposer. Implemented using a simplified (horizontal) Gaussian Blur algorithm. 

## Usage

- Create a new EffectComposer to run post-processing passes before render: `const effectComposer = new EffectComposer(renderer, target)`
- Create a new BlurFocusPass, passing in the scene in camera so it can capture depth: `const blurFocusPass = new FocusBlurPass(scene, camera)`
- Add it to EffectComposer: `effectComposer.addPass(blurFocusPass)`

<img width="1382" alt="Screen Shot 2022-06-30 at 12 35 54 PM" src="https://user-images.githubusercontent.com/70064144/176730956-5c78b236-86da-49ca-8a53-1c4642dbd847.png">
