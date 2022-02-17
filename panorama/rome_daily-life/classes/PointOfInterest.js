class PointOfInterest
{
    constructor()
    {
        this.geometry = new THREE.SphereGeometry(7.5, 32, 32);
        this.material = new THREE.MeshBasicMaterial({color: 0xFF0000});
        this.poi = new THREE.Mesh(this.geometry, this.material);
        this.material.transparent = 1;
        this.material.opacity = 0.35;
        this.sound = '';
        scene.add(this.poi);
    }
}
