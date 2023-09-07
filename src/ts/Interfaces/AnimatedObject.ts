export interface AnimatedObject {
  updateAnimation(fElapsedTime:number) : void;
  resetAnimation() : void;
  toggleAnimation() : void;
  pauseAnimation() : void;
  resumeAnimation() : void;
  getAnimationState() : boolean;
}