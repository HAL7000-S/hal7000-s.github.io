# Third-party assets

MediaPipe Tasks Vision **0.10.32** (Google LLC), Apache-2.0:
https://github.com/google-ai-edge/mediapipe
https://www.apache.org/licenses/LICENSE-2.0
Full license text is included in LICENSE-Apache-2.0.txt.

The WASM binaries and JavaScript loaders are copied from the pinned npm package.
The `.mjs` files are the original loaders with a single appended line assigning
`ModuleFactory` to `self.ModuleFactory` to support module workers. Original JS
files are also retained. Regenerate with `npm run prepare:hand-assets`.

Hand Landmarker model (Google), float16 version 1:
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
Model documentation and license information:
https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker
https://storage.googleapis.com/mediapipe-assets/Model%20Card%20Hand%20Tracking%20%28Lite_Full%29%20with%20Fairness%20Oct%202021.pdf

Model provenance and SHA-256 are in manifest.json. No runtime CDN requests are made.

Plotly.js basic distribution **3.3.0**, MIT, Copyright Plotly, Inc.:
https://github.com/plotly/plotly.js/blob/v3.3.0/LICENSE
The distributed JavaScript retains its license header.
