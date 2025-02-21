console.log("Carregando Projeto...");

// Configuração da cena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true }); 
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Adicionando luz
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// Carregar textura de maçã e cesta
const appleTexture = new THREE.TextureLoader().load('texturas/food_0006_sphere_600.png'); 
const basketTexture = new THREE.TextureLoader().load('texturas/texture2.jpg');

// Criar cesta retangular com a forma de uma cesta de piquenique
const cestaGeometry = new THREE.BoxGeometry(4, 1, 2); 
const cestaMaterial = new THREE.MeshStandardMaterial({ map: basketTexture });
const cesta = new THREE.Mesh(cestaGeometry, cestaMaterial);
cesta.position.set(0, -1.3, 0); 
scene.add(cesta);

// Controles da cesta
let velocidadeCesta = 0;
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") velocidadeCesta = -0.1;
    if (event.key === "ArrowRight") velocidadeCesta = 0.1;
});
document.addEventListener("keyup", () => velocidadeCesta = 0);

// Atualizar posição da cesta no loop de animação
function atualizarCesta() {
    cesta.position.x += velocidadeCesta;
    if (cesta.position.x > 3) cesta.position.x = 3;
    if (cesta.position.x < -3) cesta.position.x = -3;
}

// Criar contador de maçãs
let macasPegas = 0;

// Criar elemento HTML para exibir o contador
const contadorElemento = document.createElement("div");
contadorElemento.style.position = "absolute";
contadorElemento.style.top = "20px";
contadorElemento.style.left = "20px";
contadorElemento.style.fontSize = "24px";
contadorElemento.style.color = "white";
contadorElemento.style.fontFamily = "Arial, sans-serif";
contadorElemento.innerText = `Maçãs coletadas: ${macasPegas}`;
document.body.appendChild(contadorElemento);

// Atualiza o contador na tela
function atualizarContador() {
    contadorElemento.innerText = `Maçãs coletadas: ${macasPegas}`;
}

// Lista para armazenar as maçãs na cena
const macas = [];

// Criando o sistema de partículas usando SPE
const particleGroup = new SPE.Group({
    texture: {
        value: appleTexture 
    },
    blending: THREE.NormalBlending,
    maxParticleCount: 5
});

scene.add(particleGroup.mesh);

// Modificar a função de criar maçãs para armazená-las
function criarEmissorMaca() {
    const posicaoX = (Math.random() - 0.5) * 6;

    const emitter = new SPE.Emitter({
        maxAge: { value: 7 },
        position: { value: new THREE.Vector3(posicaoX, 8, 0) },
        acceleration: { value: new THREE.Vector3(0, -0.3, 0) },
        velocity: { value: new THREE.Vector3(0, -0.5, 0), spread: new THREE.Vector3(0.1, 0.1, 0.1) },
        size: { value: [1, 0.9] },
        opacity: { value: [1, 1] },
        angle: { value: [0, Math.PI * 2] },
        particleCount: 1
    });

    particleGroup.addEmitter(emitter);
    macas.push({ emitter, posicaoX, posicaoY: 8 });
}

// Criar maçãs automaticamente a cada 4 segundos
setInterval(criarEmissorMaca, 4000);

// Função para verificar se a maçã tocou na cesta
function verificarColisao() {
    macas.forEach((maca, index) => {
        maca.posicaoY -= 0.02; 

        // Calculando a distância entre o centro da maçã e a cesta
        const distanciaX = Math.abs(maca.posicaoX - cesta.position.x);
        const distanciaY = maca.posicaoY + 1.3;

        // Verifica se a maçã está na faixa do eixo X (dentro da largura da cesta)
        if (distanciaX <= 2 && distanciaY <= 1 && maca.posicaoY <= -1) {

            macas.splice(index, 1); 
            macasPegas++; 
            atualizarContador(); 
        }
    });
}




// Loop de animação
function animate() {
    requestAnimationFrame(animate);

    particleGroup.tick(0.016);
    atualizarCesta();
    verificarColisao();

    renderer.render(scene, camera);

}

camera.position.set(0, 3, 7);
animate();
console.log("Simulação de maçãs e cesta iniciada!");
