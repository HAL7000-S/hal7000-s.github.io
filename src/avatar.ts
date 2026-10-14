import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export async function mountAvatar(host: HTMLElement, glbUrl: string | null) {
 let renderer: THREE.WebGLRenderer | undefined;
 let frame = 0;
 let observer: ResizeObserver | undefined;
 let scene: THREE.Scene | undefined;
 let controls: OrbitControls | undefined;
 let modelRadius: number | undefined;
 const fallback = () => { host.dataset.mode = 'fallback'; host.querySelector('canvas')?.remove(); };
 try {
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', glbUrl ? '3Dモデル。左ドラッグで回転、ホイールで拡大縮小、右ドラッグで平行移動' : '仮の3D案内人。青いロボットと軌道リング');
  renderer.domElement.setAttribute('role', 'img');
  scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  camera.position.set(0, 1.2, 7.5); camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x99aac8, 3));
  const light = new THREE.DirectionalLight(0xffffff, 4); light.position.set(3,4,5); scene.add(light);
  const guide = new THREE.Group(); scene.add(guide);
  if (glbUrl) {
   const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
   const gltf = await new GLTFLoader().loadAsync(glbUrl);
   const box = new THREE.Box3().setFromObject(gltf.scene); const size = box.getSize(new THREE.Vector3());
   const extent = Math.max(size.x,size.y,size.z); if (!Number.isFinite(extent) || extent <= 0) throw new Error('Empty model');
   const center = box.getCenter(new THREE.Vector3()); gltf.scene.position.sub(center); const wrapper = new THREE.Group(); wrapper.add(gltf.scene); wrapper.scale.setScalar(2.8/extent); guide.add(wrapper);
   modelRadius = new THREE.Box3().setFromObject(guide).getBoundingSphere(new THREE.Sphere()).radius;
   controls = new OrbitControls(camera, renderer.domElement);
   controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
   controls.minDistance = modelRadius * .1;
   controls.maxDistance = modelRadius * 30;
   camera.near = modelRadius / 100;
   camera.far = modelRadius * 100;
  } else {
   const blue = new THREE.MeshStandardMaterial({ color: 0x244ee8, roughness: .38 });
   const cream = new THREE.MeshStandardMaterial({ color: 0xf9f4de, roughness: .6 });
   const orange = new THREE.MeshStandardMaterial({ color: 0xf26340 });
   const part = (geometry: THREE.BufferGeometry, material: THREE.Material, x:number,y:number,z:number) => { const mesh = new THREE.Mesh(geometry,material); mesh.position.set(x,y,z); guide.add(mesh); return mesh; };
   part(new THREE.BoxGeometry(1.55,1.12,.95),blue,0,.57,0).rotation.z = -.08;
   part(new THREE.BoxGeometry(.88,.85,.65),cream,0,-.5,0);
   for (const x of [-.37,.37]) part(new THREE.SphereGeometry(.12,24,16),cream,x,.65,.51);
   part(new THREE.BoxGeometry(.45,.055,.05),cream,0,.31,.52);
   part(new THREE.CylinderGeometry(.025,.025,.45),orange,0,1.35,0);
   part(new THREE.SphereGeometry(.1),orange,0,1.62,0);
   for (const x of [-.72,.72]) { part(new THREE.SphereGeometry(.18),blue,x,-.45,0); part(new THREE.BoxGeometry(.3,.3,.55),blue,x*.5,-1.04,.12); }
   const ring = part(new THREE.TorusGeometry(1.9,.015,8,100),orange,0,-.05,0); ring.rotation.x = 1.12; ring.rotation.y = .2;
  }
  const resize = () => {
   const w = host.clientWidth, h = host.clientHeight;
   if (!w || !h) return;
   renderer!.setSize(w,h); camera.aspect=w/h;
   if (modelRadius) {
    const vertical = THREE.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical/2) * camera.aspect);
    const distance = modelRadius / Math.sin(Math.min(vertical,horizontal)/2) * 1.15;
    camera.position.set(0,0,distance); camera.lookAt(0,0,0);
    controls!.target.set(0,0,0); controls!.update();
   }
   camera.updateProjectionMatrix();
  };
  observer = new ResizeObserver(resize); observer.observe(host); resize();
  host.dataset.mode = '3d';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  const button = host.parentElement?.querySelector<HTMLButtonElement>('[data-motion]');
  if (glbUrl && button) button.hidden = true;
  button?.addEventListener('click', () => { paused = !paused; button.textContent = paused ? '動きを再開 ↗' : '動きを止める Ⅱ'; button.setAttribute('aria-pressed', String(paused)); });
  const tick = (time:number) => { frame = requestAnimationFrame(tick); if (!glbUrl && !paused && !reduced.matches && !document.hidden) { guide.rotation.y = Math.sin(time*.00035)*.25; guide.position.y = Math.sin(time*.001)*.07; } controls?.update(); renderer!.render(scene!,camera); }; tick(0);
  renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); cancelAnimationFrame(frame); fallback(); });
 } catch (error) { console.error('3Dモデルを表示できませんでした。', error); cancelAnimationFrame(frame); observer?.disconnect(); controls?.dispose(); renderer?.dispose(); fallback(); }
 window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); observer?.disconnect(); controls?.dispose(); scene?.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose(); } }); renderer?.dispose(); }, { once:true });
}
