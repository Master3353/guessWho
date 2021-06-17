class Renderer extends THREE.WebGLRenderer {
    constructor() {
        super()

        this.setClearColor(0x123456);
        this.setSize(window.innerWidth, window.innerHeight);
    }
}