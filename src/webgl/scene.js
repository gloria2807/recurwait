import * as THREE from "three";


export function initWebGL() {

  const canvas = document.querySelector("#webgl");

  if (!canvas) return;


  /* ==========================================
     SCENE
  ========================================== */

  const scene = new THREE.Scene();

  scene.fog = new THREE.FogExp2(
    0x050505,
    0.055
  );


  /* ==========================================
     CAMERA
  ========================================== */

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(
    0,
    1.8,
    8
  );


  /* ==========================================
     RENDERER
  ========================================== */

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );


  /* ==========================================
     TERRAIN
  ========================================== */

  const geometry = new THREE.PlaneGeometry(
    22,
    22,
    180,
    180
  );

  const material = new THREE.ShaderMaterial({

    transparent: true,

    uniforms: {
      uTime: {
        value: 0
      },

      uScroll: {
        value: 0
      },

      uMouse: {
        value: new THREE.Vector2(0, 0)
      }
    },

    vertexShader: `

      uniform float uTime;
      uniform float uScroll;
      uniform vec2 uMouse;

      varying vec2 vUv;
      varying float vHeight;

      void main() {

        vUv = uv;

        vec3 pos = position;

        float wave1 =
          sin(pos.x * 1.35 + uTime * 0.25)
          * 0.22;

        float wave2 =
          sin(pos.y * 1.7 - uTime * 0.18)
          * 0.16;

        float wave3 =
          sin(
            (pos.x + pos.y) * 2.4
            + uTime * 0.3
          )
          * 0.08;

        float radial =
          sin(
            length(pos.xy) * 2.5
            - uTime * 0.45
          )
          * 0.07;

        float mouseInfluence =
          0.35 *
          exp(
            -(
              pow(pos.x - uMouse.x * 5.0, 2.0)
              +
              pow(pos.y - uMouse.y * 5.0, 2.0)
            ) * 0.18
          );

        float height =
          wave1
          + wave2
          + wave3
          + radial
          + mouseInfluence;

        height +=
          uScroll * 0.35 *
          sin(pos.x * 0.8);

        pos.z += height;

        vHeight = height;

        gl_Position =
          projectionMatrix *
          modelViewMatrix *
          vec4(pos, 1.0);

      }

    `,

    fragmentShader: `

      uniform float uTime;

      varying vec2 vUv;
      varying float vHeight;

      void main() {

        float edge =
          smoothstep(
            0.0,
            0.5,
            vUv.y
          );

        float wave =
          sin(
            vUv.x * 30.0
            + vUv.y * 15.0
            - uTime * 0.8
          );

        float energy =
          smoothstep(
            0.75,
            1.0,
            wave
          );

        vec3 black =
          vec3(
            0.004,
            0.006,
            0.004
          );

        vec3 green =
          vec3(
            0.55,
            1.0,
            0.0
          );

        float heightGlow =
          smoothstep(
            0.08,
            0.35,
            abs(vHeight)
          );

        vec3 color =
          mix(
            black,
            green,
            energy * 0.55
            + heightGlow * 0.15
          );

        float fade =
          1.0 - smoothstep(
            0.25,
            1.0,
            distance(vUv, vec2(0.5))
          );

        gl_FragColor =
          vec4(
            color,
            fade * 0.72
          );

      }

    `

  });


  const terrain =
    new THREE.Mesh(
      geometry,
      material
    );


  terrain.rotation.x =
    -Math.PI * 0.43;

  terrain.position.y =
    -1.2;

  terrain.position.z =
    -1.2;


  scene.add(terrain);


  /* ==========================================
     GREEN ENERGY STRUCTURES
  ========================================== */

  const energyGeometry =
    new THREE.TorusGeometry(
      2.6,
      0.008,
      8,
      160
    );

  const energyMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xb6ff00,
      transparent: true,
      opacity: 0.18
    });

  const energyRing =
    new THREE.Mesh(
      energyGeometry,
      energyMaterial
    );

  energyRing.rotation.x =
    Math.PI * 0.5;

  energyRing.position.z =
    -2.8;

  energyRing.position.y =
    0.1;

  scene.add(energyRing);


  /* ==========================================
     SECONDARY RING
  ========================================== */

  const ring2 =
    energyRing.clone();

  ring2.scale.setScalar(1.7);

  ring2.material =
    energyMaterial.clone();

  ring2.material.opacity =
    0.07;

  ring2.position.z =
    -4;

  scene.add(ring2);


  /* ==========================================
     MOUSE
  ========================================== */

  const mouse =
    new THREE.Vector2();

  const targetMouse =
    new THREE.Vector2();


  window.addEventListener(
    "pointermove",
    (event) => {

      targetMouse.x =
        (event.clientX / window.innerWidth) * 2 - 1;

      targetMouse.y =
        -(
          (event.clientY / window.innerHeight) * 2 - 1
        );

    }
  );


  /* ==========================================
     SCROLL
  ========================================== */

  let scrollTarget = 0;
  let scrollCurrent = 0;

  window.addEventListener(
    "scroll",
    () => {

      scrollTarget =
        window.scrollY /
        Math.max(
          document.body.scrollHeight - window.innerHeight,
          1
        );

    },
    {
      passive: true
    }
  );


  /* ==========================================
     ANIMATION
  ========================================== */

  const clock =
    new THREE.Clock();


  function animate() {

    requestAnimationFrame(
      animate
    );


    const elapsed =
      clock.getElapsedTime();


    material.uniforms.uTime.value =
      elapsed;


    /* Smooth mouse */

    mouse.lerp(
      targetMouse,
      0.035
    );


    material.uniforms.uMouse.value.copy(
      mouse
    );


    /* Smooth scroll */

    scrollCurrent +=
      (
        scrollTarget -
        scrollCurrent
      ) * 0.035;


    material.uniforms.uScroll.value =
      scrollCurrent;


    /* Terrain movement */

    terrain.rotation.z =
      Math.sin(elapsed * 0.06) * 0.015;


    terrain.position.x =
      mouse.x * 0.15;


    terrain.position.y =
      -1.2 +
      mouse.y * 0.08;


    /* Energy rings */

    energyRing.rotation.z =
      elapsed * 0.045;

    energyRing.rotation.y =
      Math.sin(elapsed * 0.15) * 0.15;


    ring2.rotation.z =
      -elapsed * 0.025;

    ring2.rotation.x =
      Math.PI * 0.5 +
      Math.sin(elapsed * 0.12) * 0.08;


    renderer.render(
      scene,
      camera
    );

  }


  animate();


  /* ==========================================
     RESIZE
  ========================================== */

  window.addEventListener(
    "resize",
    () => {

      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );

      renderer.setPixelRatio(
        Math.min(
          window.devicePixelRatio,
          2
        )
      );

    }
  );

}