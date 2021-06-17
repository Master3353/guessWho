class Camera extends THREE.PerspectiveCamera {
    constructor(renderer) {
        super(45,
            window.innerWidth / window.innerHeight,
            0.1,
            10000)

        this.renderer = renderer;
        this.updateSize();

        window.addEventListener('resize', () => this.updateSize(), false);
    }

    updateSize() {

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.aspect = window.innerWidth / window.innerHeight;
        this.updateProjectionMatrix();
    }
}