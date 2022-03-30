class PointOfInterest
{
    constructor()
    {
        this.geometry = new THREE.SphereGeometry(7.5, 10, 7);
        this.material = new THREE.MeshBasicMaterial({color: 0xFFFFFF, wireframe: true});
        this.poi = new THREE.Mesh(this.geometry, this.material);
        this.material.transparent = 1;
        this.material.opacity = 1;
        this.sound = '';
        scene.add(this.poi);
    }
}
