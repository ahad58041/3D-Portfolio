import * as THREE from "three";
import { GLTF } from "three-stdlib";
import { eyebrowBoneNames, typingBoneNames } from "../../../data/boneData";

const setAnimations = (gltf: GLTF) => {
  let character = gltf.scene;
  let mixer = new THREE.AnimationMixer(character);
  if (gltf.animations && gltf.animations.length > 0) {
    console.log("Available animations:", gltf.animations.map(c => c.name));
    
    // Intelligent fallback: Priority -> Name match -> Longest Duration -> First available
    let introClip = gltf.animations.find(clip => 
      ["introAnimation", "Intro", "Idle", "Sit", "Sitting"].some(name => clip.name.includes(name))
    );

    if (!introClip) {
       // If no named clip found, pick the longest one (likely the main loop)
       introClip = gltf.animations.reduce((prev, current) => {
         return (prev.duration > current.duration) ? prev : current;
       }, gltf.animations[0]);
    }

    if (introClip) {
      // CRITICAL FIX: Stop all other animations (like T-pose) before playing the new one
      mixer.stopAllAction();
      
      console.log("Playing base animation:", introClip.name);
      const introAction = mixer.clipAction(introClip);
      
      // Determine if this is an "Intro" (one-shot) or "Idle" (loop)
      const isIntro = ["intro", "Intro", "wake", "Wake"].some(n => introClip!.name.includes(n));
      const loopMode = isIntro ? THREE.LoopOnce : THREE.LoopRepeat;
      
      introAction.setLoop(loopMode, Infinity);
      introAction.clampWhenFinished = true; 
      introAction.play();
    }

    // const clipNames = ["key1", "key2", "key5", "key6"];
    // clipNames.forEach((name) => {
    //   const clip = THREE.AnimationClip.findByName(gltf.animations, name);
    //   if (clip) {
    //     const action = mixer?.clipAction(clip);
    //     action!.play();
    //     action!.timeScale = 1.2;
    //   }
    // });

    let typingAction: THREE.AnimationAction | null = null;
    typingAction = createBoneAction(gltf, mixer, "typing", typingBoneNames);
    if (typingAction) {
      typingAction.enabled = true;
      typingAction.play();
      typingAction.timeScale = 1.2;
    }
  }

  function startIntro() {
    // Re-evaluate intro clip using same logic
    let introClip = gltf.animations.find(clip => 
      ["introAnimation", "Intro", "Idle", "Sit", "Sitting"].some(name => clip.name.includes(name))
    );

    if (!introClip) {
       introClip = gltf.animations.reduce((prev, current) => {
         return (prev.duration > current.duration) ? prev : current;
       }, gltf.animations[0]);
    }

    if (introClip) {
      const introAction = mixer.clipAction(introClip);
      
      const isIntro = ["intro", "Intro", "wake", "Wake"].some(n => introClip!.name.includes(n));
      const loopMode = isIntro ? THREE.LoopOnce : THREE.LoopRepeat;
      
      introAction.setLoop(loopMode, Infinity);
      introAction.clampWhenFinished = true;

      // Only restart if it's the Intro (waking up) or if nothing is running
      if (isIntro || !introAction.isRunning()) {
          introAction.reset().play();
      }
    }

    // setTimeout(() => {
    //   const blink = gltf.animations.find((clip) => clip.name === "Blink");
    //   if (blink) {
    //     mixer.clipAction(blink).play().fadeIn(0.5);
    //   }
    // }, 2500);
  }
  function hover(gltf: GLTF, hoverDiv: HTMLDivElement) {
    let eyeBrowUpAction = createBoneAction(
      gltf,
      mixer,
      "browup",
      eyebrowBoneNames
    );
    let isHovering = false;
    if (eyeBrowUpAction) {
      eyeBrowUpAction.setLoop(THREE.LoopOnce, 1);
      eyeBrowUpAction.clampWhenFinished = true;
      eyeBrowUpAction.enabled = true;
    }
    const onHoverFace = () => {
      if (eyeBrowUpAction && !isHovering) {
        isHovering = true;
        eyeBrowUpAction.reset();
        eyeBrowUpAction.enabled = true;
        eyeBrowUpAction.setEffectiveWeight(4);
        eyeBrowUpAction.fadeIn(0.5).play();
      }
    };
    const onLeaveFace = () => {
      if (eyeBrowUpAction && isHovering) {
        isHovering = false;
        eyeBrowUpAction.fadeOut(0.6);
      }
    };
    if (!hoverDiv) return;
    hoverDiv.addEventListener("mouseenter", onHoverFace);
    hoverDiv.addEventListener("mouseleave", onLeaveFace);
    return () => {
      hoverDiv.removeEventListener("mouseenter", onHoverFace);
      hoverDiv.removeEventListener("mouseleave", onLeaveFace);
    };
  }
  return { mixer, startIntro, hover };
};

const createBoneAction = (
  gltf: GLTF,
  mixer: THREE.AnimationMixer,
  clip: string,
  boneNames: string[]
): THREE.AnimationAction | null => {
  const AnimationClip = THREE.AnimationClip.findByName(gltf.animations, clip);
  if (!AnimationClip) {
    console.error(`Animation "${clip}" not found in GLTF file.`);
    return null;
  }

  const filteredClip = filterAnimationTracks(AnimationClip, boneNames);

  return mixer.clipAction(filteredClip);
};

const filterAnimationTracks = (
  clip: THREE.AnimationClip,
  boneNames: string[]
): THREE.AnimationClip => {
  const filteredTracks = clip.tracks.filter((track) =>
    boneNames.some((boneName) => track.name.includes(boneName))
  );

  return new THREE.AnimationClip(
    clip.name + "_filtered",
    clip.duration,
    filteredTracks
  );
};

export default setAnimations;
