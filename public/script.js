window.addEventListener('beforeunload', function (e) {
        e.preventDefault();
        e.returnValue = '';
    });
        const esCelular = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (esCelular) {
            document.getElementById('controles').style.display = 'flex';
        }

        const socket = io({ transports: ['websocket', 'polling'] });
        let miPersonaje = null;
        const otrosAvatares = {};
        let x = 0, z = 0;
        let avatarElegido = '👾';
        let miNombre = 'Jugador';
        let alturaPersonaje = -0.5;  // Altura inicial del personaje
        // --- SISTEMA DE RECURSOS Y CONSTRUCCIÓN ---
        let inventario = {
            madera: 0,
            piedra: 0,
            tierra: 0
        };
        let bloquesColocados = [];
        let arboles = [];
        let rocas = [];
        let tierras = [];
socket.on('disconnect', (reason) => {
    console.log('❌ Desconectado por:', reason);
    if (reason === 'io server disconnect') {
        socket.connect();
    }
});

socket.on('connect_error', (error) => {
    console.log('❌ Error de conexión:', error);
    setTimeout(() => {
        socket.connect();
    }, 1000);
});

socket.on('reconnect', (attemptNumber) => {
    console.log(`🔄 Reconectado después de ${attemptNumber} intentos`);
});

socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Intento de reconexión #${attemptNumber}`);
});

socket.on('reconnect_error', (error) => {
    console.log('❌ Error al reconectar:', error);
});

socket.on('reconnect_failed', () => {
    console.log('❌ Falló la reconexión');
});
        document.querySelectorAll('.avatar-opcion').forEach(el => {
            el.addEventListener('click', function() {
                document.querySelectorAll('.avatar-opcion').forEach(a => a.classList.remove('seleccionado'));
                this.classList.add('seleccionado');
                avatarElegido = this.dataset.avatar;
            });
        });

        document.getElementById('btn-ingresar').addEventListener('click', () => {
            const input = document.getElementById('nombre-input');
            miNombre = input.value.trim() || 'Jugador';
            
            document.getElementById('selector').style.display = 'none';
            
            crearMiAvatar(avatarElegido, miNombre);
            socket.emit('seleccionar_avatar', { avatar: avatarElegido, nombre: miNombre });
        });

        document.getElementById('nombre-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('btn-ingresar').click();
        });

socket.on('usuarios_conectados', (cantidad) => {
    document.getElementById('num-usuarios').textContent = cantidad;
});

socket.on('usuarios_existentes', (usuarios) => {
    console.log('📥 Usuarios existentes:', usuarios);
    console.log('🆔 Mi ID es:', socket.id);
    
    usuarios.forEach(u => {
        if (u.id !== socket.id) {
            console.log(`✅ Creando avatar de: ${u.nombre} (${u.id})`);
            crearAvatarOtro(u.id, u.avatar, u.nombre, u.x, u.z);
        } else {
            console.log(`⏭️ Saltando mi propio avatar: ${u.nombre}`);
        }
    });
    
    document.getElementById('num-usuarios').textContent = usuarios.length + 1;
});

socket.on('nuevo_avatar', (data) => {
    console.log('🆕 Nuevo usuario:', data);
    
    if (data.id !== socket.id) {
        crearAvatarOtro(data.id, data.avatar, data.nombre);
        document.getElementById('num-usuarios').textContent = Object.keys(otrosAvatares).length + 1;
    } else {
        console.log('⏭️ Saltando mi propio nuevo avatar');
    }
});

socket.on('movimiento_otro', (data) => {
    if (otrosAvatares[data.id] && data.id !== socket.id) {
        otrosAvatares[data.id].position.x = data.x;
        otrosAvatares[data.id].position.z = data.z;
        if (data.y !== undefined) {
            otrosAvatares[data.id].position.y = data.y;
        }
    }
});

socket.on('usuario_desconectado', (id) => {
    console.log('👋 Desconectado:', id);
    if (otrosAvatares[id]) {
        scene.remove(otrosAvatares[id]);
        delete otrosAvatares[id];
    }
    document.getElementById('num-usuarios').textContent = Object.keys(otrosAvatares).length + 1;
});
       
        
        const chatInput = document.getElementById('chat-input');
        const chatEnviar = document.getElementById('chat-enviar');
        const chatMensajes = document.getElementById('chat-mensajes');

        function agregarMensajeChat(nombre, mensaje, esPropio = false) {
            const div = document.createElement('div');
            div.className = 'mensaje-chat';
            
            const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const nombreColor = esPropio ? '#00ff88' : '#4d96ff';
            
            div.innerHTML = `
                <span class="nombre-chat" style="color: ${nombreColor};">${nombre}</span>
                <span class="texto-chat">: ${mensaje}</span>
                <span class="hora-chat">${hora}</span>
            `;
            
            chatMensajes.appendChild(div);
            chatMensajes.scrollTop = chatMensajes.scrollHeight;
            
            while (chatMensajes.children.length > 50) {
                chatMensajes.removeChild(chatMensajes.firstChild);
            }
        }

        function enviarMensaje() {
            const texto = chatInput.value.trim();
            if (!texto) return;
            
            agregarMensajeChat(miNombre, texto, true);
            socket.emit('mensaje_chat', { nombre: miNombre, mensaje: texto });
            chatInput.value = '';
        }

        chatEnviar.addEventListener('click', enviarMensaje);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') enviarMensaje();
        });

        socket.on('mensaje_chat', (data) => {
            agregarMensajeChat(data.nombre, data.mensaje, false);
        });

        socket.on('bienvenida_chat', (data) => {
            agregarMensajeChat('🟢 Sistema', `${data.nombre} se ha unido al metaverso`, false);
        });

        socket.on('despedida_chat', (data) => {
            agregarMensajeChat('🔴 Sistema', `${data.nombre} ha salido del metaverso`, false);
        });
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        scene.fog = new THREE.Fog(0x87CEEB, 40, 70);

        const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 12, 18);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
        sun.position.set(30, 40, 20);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 80;
        sun.shadow.camera.left = -50;
        sun.shadow.camera.right = 50;
        sun.shadow.camera.top = 50;
        sun.shadow.camera.bottom = -50;
        scene.add(sun);

        const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
        fill.position.set(-20, 20, -20);
        scene.add(fill);

        const groundGeoPrincipal = new THREE.PlaneGeometry(100, 100, 60, 60);
        const groundMatPrincipal = new THREE.MeshStandardMaterial({ 
            color: 0x4a8c3f, 
            roughness: 0.8,
            metalness: 0.0
        });
        const ground = new THREE.Mesh(groundGeoPrincipal, groundMatPrincipal);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        ground.receiveShadow = true;
        scene.add(ground);

       // ============================================
// TERRENO PLANO (SIN MONTAÑAS)
// ============================================
const hillGeo = new THREE.PlaneGeometry(100, 100);
const hillMat = new THREE.MeshStandardMaterial({
    color: 0x5a9c4f,
    roughness: 0.9,
    flatShading: true
});
const hills = new THREE.Mesh(hillGeo, hillMat);
hills.rotation.x = -Math.PI / 2;
hills.position.y = -0.4;
hills.receiveShadow = true;
scene.add(hills);

        const lakeGeo = new THREE.CircleGeometry(8, 20);
        const lakeMat = new THREE.MeshStandardMaterial({
            color: 0x0088cc,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.5
        });
        const lake = new THREE.Mesh(lakeGeo, lakeMat);
        lake.rotation.x = -Math.PI / 2;
        lake.position.set(15, -0.3, 15);
        scene.add(lake);

       

        // ============================================
// MUNDO OSCURO (AGREGADO) - VERSIÓN COMPLETA
// ============================================

function crearMapaOscuro() {
    const grupo = new THREE.Group();

    // Volcán
    const volcanGeo = new THREE.ConeGeometry(4, 6, 16);
    const volcanMat = new THREE.MeshStandardMaterial({
        color: 0x553322,
        roughness: 0.9,
        metalness: 0.0,
        flatShading: true
    });
    const volcan = new THREE.Mesh(volcanGeo, volcanMat);
    volcan.position.set(-10, -1, 10);
    volcan.castShadow = true;
    volcan.receiveShadow = true;
    grupo.add(volcan);

    // Cráter (rojo brillante)
    const craterGeo = new THREE.CircleGeometry(2.5, 16);
    const craterMat = new THREE.MeshStandardMaterial({
        color: 0xff4400,
        emissive: 0xff2200,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const crater = new THREE.Mesh(craterGeo, craterMat);
    crater.position.set(-10, 2, 10);
    crater.rotation.x = -Math.PI / 2;
    grupo.add(crater);

    // Lava (partículas)
    const lavaGeo = new THREE.BufferGeometry();
    const numLava = 100;
    const lavaPos = new Float32Array(numLava * 3);
    for (let i = 0; i < numLava * 3; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const radio = 0.5 + Math.random() * 1.5;
        lavaPos[i] = Math.cos(angulo) * radio;
        lavaPos[i+1] = Math.random() * 0.3;
        lavaPos[i+2] = Math.sin(angulo) * radio;
    }
    lavaGeo.setAttribute('position', new THREE.BufferAttribute(lavaPos, 3));
    const lavaMat = new THREE.PointsMaterial({
        color: 0xff6600,
        size: 0.15,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const lava = new THREE.Points(lavaGeo, lavaMat);
    lava.position.set(-10, 2.1, 10);
    grupo.add(lava);

    // ============================================
    // ÁRBOLES OSCUROS (MODIFICADOS - AHORA TALABLES)
    // ============================================
    for (let i = 0; i < 15; i++) {
        const x = (Math.random() - 0.5) * 30 - 10;
        const z = (Math.random() - 0.5) * 30 + 10;
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 6 && dist < 20) {
            // Crear un grupo para el árbol completo
            const grupoArbol = new THREE.Group();
            
            // Tronco
            const tronco = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.15, 0.5, 5),
                new THREE.MeshStandardMaterial({ color: 0x332211 })
            );
            tronco.position.y = 0.25;
            grupoArbol.add(tronco);
            
            // Copa
            const copa = new THREE.Mesh(
                new THREE.SphereGeometry(0.3, 5),
                new THREE.MeshStandardMaterial({
                    color: 0x442222,
                    emissive: 0x441111,
                    emissiveIntensity: 0.2
                })
            );
            copa.position.y = 0.6;
            grupoArbol.add(copa);
            
            // Posicionar el grupo
            grupoArbol.position.set(x, -0.5, z);
            
            // Añadir datos para la tala
            grupoArbol.userData = {
                talado: false,
                posX: x,
                posZ: z
            };
            
            // Agregar a la escena y al array de árboles
            scene.add(grupoArbol);
            arboles.push(grupoArbol);
        }
    }

    // Cristales de lava
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 30 - 10;
        const z = (Math.random() - 0.5) * 30 + 10;
        if (Math.sqrt(x*x + z*z) > 4) {
            const cristal = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.1 + Math.random() * 0.2),
                new THREE.MeshStandardMaterial({
                    color: 0xff6633,
                    emissive: 0xff2200,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.8
                })
            );
            cristal.position.set(x, -0.3 + Math.random() * 0.5, z);
            scene.add(cristal);
        }
    }

    // Suelo oscuro
    const sueloOscuroGeo = new THREE.PlaneGeometry(40, 40, 20, 20);
    const sueloOscuroMat = new THREE.MeshStandardMaterial({
        color: 0x332222,
        roughness: 0.9,
        metalness: 0.0
    });
    const sueloOscuro = new THREE.Mesh(sueloOscuroGeo, sueloOscuroMat);
    sueloOscuro.rotation.x = -Math.PI / 2;
    sueloOscuro.position.set(-10, -0.5, 10);
    sueloOscuro.receiveShadow = true;
    scene.add(sueloOscuro);

    return grupo;
}
        const mapaOscuro = crearMapaOscuro();
        mapaOscuro.visible = false; // Oculto al inicio
        scene.add(mapaOscuro);

                function crearArbolGrande(x, z) {
            const grupo = new THREE.Group();
            const tronco = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.35, 0.8, 6),
                new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 })
            );
            tronco.position.y = 0.4;
            tronco.castShadow = true;
            grupo.add(tronco);
            
            const copaMat = new THREE.MeshStandardMaterial({ color: 0x2d8a2d, roughness: 0.8 });
            const copa1 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6), copaMat);
            copa1.position.set(0, 1.0, 0);
            copa1.castShadow = true;
            grupo.add(copa1);
            
            const copa2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6), copaMat);
            copa2.position.set(0.5, 0.8, 0.3);
            copa2.castShadow = true;
            grupo.add(copa2);
            
            const copa3 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6), copaMat);
            copa3.position.set(-0.4, 0.9, -0.3);
            copa3.castShadow = true;
            grupo.add(copa3);
            
            grupo.position.set(x, -0.5, z);
            
            // --- NUEVO: Guardar información del árbol ---
            grupo.userData = {
                talado: false,
                posX: x,
                posZ: z
            };
            
            scene.add(grupo);
            arboles.push(grupo); // Guardar en el array para talar
            return grupo;
        }
        // ============================================
// ELEMENTOS DE CADA MUNDO
// ============================================

let elementosMundo = [];

function limpiarElementosMundo() {
    // Eliminar elementos decorativos
    for (let elem of elementosMundo) {
        scene.remove(elem);
    }
    elementosMundo = [];
    
    // Eliminar TODOS los árboles (incluyendo los del mundo oscuro)
    for (let arbol of arboles) {
        scene.remove(arbol);
    }
    arboles = [];
}
function crearElementosMundoNormal() {
    // Árboles normales (verdes)
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 70;
        const z = (Math.random() - 0.5) * 70;
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 8 && dist < 35) {
            const arbol = crearArbolNormal(x, z);
            elementosMundo.push(arbol);
            arboles.push(arbol);
        }
    }
    // Flores
    for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 4 && dist < 30) {
            const flor = crearFlorMundo(x, z, coloresFlores[Math.floor(Math.random() * coloresFlores.length)]);
            elementosMundo.push(flor);
        }
    }
}

function crearElementosMundoNieve() {
    // Árboles de nieve (blancos)
    for (let i = 0; i < 25; i++) {
        const x = (Math.random() - 0.5) * 70;
        const z = (Math.random() - 0.5) * 70;
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 8 && dist < 35) {
            const arbol = crearArbolNieve(x, z);
            elementosMundo.push(arbol);
            arboles.push(arbol);
        }
    }
    // Montículos de nieve
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 5 && dist < 30) {
            const nieve = crearMonticuloNieve(x, z);
            elementosMundo.push(nieve);
        }
    }
    // Copos de nieve (partículas)
    for (let i = 0; i < 50; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        const y = 2 + Math.random() * 5;
        const copo = crearCopoNieve(x, y, z);
        elementosMundo.push(copo);
    }
}

function crearElementosMundoDesierto() {
    // Árboles secos (sin hojas)
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 70;
        const z = (Math.random() - 0.5) * 70;
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 8 && dist < 35) {
            const arbol = crearArbolSeco(x, z);
            elementosMundo.push(arbol);
            arboles.push(arbol);
        }
    }
    // Cactus
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 5 && dist < 30) {
            const cactus = crearCactus(x, z);
            elementosMundo.push(cactus);
        }
    }
    // Rocas del desierto
    for (let i = 0; i < 25; i++) {
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 5 && dist < 30) {
            const roca = crearRocaDesierto(x, z);
            elementosMundo.push(roca);
        }
    }
}

function crearElementosMundoOscuro() {
    // El mundo oscuro ya tiene sus elementos en crearMapaOscuro()
    // Pero agregamos algunos extras
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 30 - 10;
        const z = (Math.random() - 0.5) * 30 + 10;
        const dist = Math.sqrt(x*x + z*z);
        if (dist > 4 && dist < 15) {
            const cristal = new THREE.Mesh(
                new THREE.OctahedronGeometry(0.1 + Math.random() * 0.2),
                new THREE.MeshStandardMaterial({
                    color: 0xff6633,
                    emissive: 0xff2200,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.8
                })
            );
            cristal.position.set(x, -0.3 + Math.random() * 0.5, z);
            scene.add(cristal);
            elementosMundo.push(cristal);
        }
    }
}

// ============================================
// FUNCIONES DE ÁRBOLES CORREGIDAS
// ============================================

function crearArbolNormal(x, z) {
    const grupo = new THREE.Group();
    const tronco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 })
    );
    tronco.position.y = 0.3;
    tronco.castShadow = true;
    grupo.add(tronco);
    
    const copaMat = new THREE.MeshStandardMaterial({ color: 0x2d8a2d, roughness: 0.8 });
    const copa1 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6), copaMat);
    copa1.position.set(0, 0.8, 0);
    copa1.castShadow = true;
    grupo.add(copa1);
    
    const copa2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6), copaMat);
    copa2.position.set(0.4, 0.6, 0.2);
    copa2.castShadow = true;
    grupo.add(copa2);
    
    const copa3 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6), copaMat);
    copa3.position.set(-0.3, 0.7, -0.2);
    copa3.castShadow = true;
    grupo.add(copa3);
    
    grupo.position.set(x, -0.5, z);
    
    // ✅ AGREGAR userData PARA PODER TALAR
    grupo.userData = {
        talado: false,
        posX: x,
        posZ: z
    };
    
    scene.add(grupo);
    return grupo;
}

function crearArbolNieve(x, z) {
    const grupo = new THREE.Group();
    const tronco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 })
    );
    tronco.position.y = 0.3;
    tronco.castShadow = true;
    grupo.add(tronco);
    
    const copaMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.9 });
    const copa1 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6), copaMat);
    copa1.position.set(0, 0.8, 0);
    copa1.castShadow = true;
    grupo.add(copa1);
    
    const copa2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6), copaMat);
    copa2.position.set(0.4, 0.6, 0.2);
    copa2.castShadow = true;
    grupo.add(copa2);
    
    const copa3 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6), copaMat);
    copa3.position.set(-0.3, 0.7, -0.2);
    copa3.castShadow = true;
    grupo.add(copa3);
    
    grupo.position.set(x, -0.5, z);
    
    // ✅ AGREGAR userData PARA PODER TALAR
    grupo.userData = {
        talado: false,
        posX: x,
        posZ: z
    };
    
    scene.add(grupo);
    return grupo;
}

function crearArbolSeco(x, z) {
    const grupo = new THREE.Group();
    const tronco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 0.8, 6),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 })
    );
    tronco.position.y = 0.4;
    tronco.castShadow = true;
    grupo.add(tronco);
    
    // Ramas secas
    for (let i = 0; i < 3; i++) {
        const rama = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.05, 0.3, 4),
            new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 })
        );
        rama.position.set((i - 1) * 0.25, 0.6 + i * 0.1, 0);
        rama.rotation.z = (i - 1) * 0.5;
        grupo.add(rama);
    }
    
    grupo.position.set(x, -0.5, z);
    
    // ✅ AGREGAR userData PARA PODER TALAR
    grupo.userData = {
        talado: false,
        posX: x,
        posZ: z
    };
    
    scene.add(grupo);
    return grupo;
}

// La función crearMapaOscuro() ya tiene los árboles con userData ✅
function crearCactus(x, z) {
    const grupo = new THREE.Group();
    const cuerpo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 0.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 })
    );
    cuerpo.position.y = 0.3;
    cuerpo.castShadow = true;
    grupo.add(cuerpo);
    
    // Brazos del cactus
    for (let i = -1; i <= 1; i+=2) {
        const brazo = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.08, 0.3, 6),
            new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 })
        );
        brazo.position.set(i * 0.2, 0.4 + Math.random() * 0.2, 0);
        brazo.rotation.z = i * 0.7;
        grupo.add(brazo);
    }
    
    grupo.position.set(x, -0.5, z);
    scene.add(grupo);
    return grupo;
}

function crearMonticuloNieve(x, z) {
    const monticulo = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 6),
        new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.9 })
    );
    monticulo.scale.y = 0.3 + Math.random() * 0.3;
    monticulo.position.set(x, -0.5 + 0.1, z);
    monticulo.castShadow = true;
    scene.add(monticulo);
    return monticulo;
}

function crearCopoNieve(x, y, z) {
    const copo = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + Math.random() * 0.03, 4),
        new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.8 
        })
    );
    copo.position.set(x, y, z);
    scene.add(copo);
    return copo;
}

function crearRocaDesierto(x, z) {
    const roca = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.3),
        new THREE.MeshStandardMaterial({ color: 0xccbbaa, roughness: 0.9 })
    );
    roca.position.set(x, -0.5 + 0.1, z);
    roca.scale.y = 0.5 + Math.random() * 0.5;
    roca.castShadow = true;
    scene.add(roca);
    return roca;
}

function crearFlorMundo(x, z, color) {
    const grupo = new THREE.Group();
    const tallo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4),
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
    );
    tallo.position.y = 0.075;
    grupo.add(tallo);
    
    const flor = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6),
        new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.1 })
    );
    flor.position.y = 0.18;
    grupo.add(flor);
    
    grupo.position.set(x, -0.5, z);
    scene.add(grupo);
    return grupo;
}
        // ============================================
        // ROCAS RECOLECTABLES (para obtener piedra)
        // ============================================

        function crearRocaRecolectable(x, z) {
            const grupo = new THREE.Group();
            
            // Roca
            const roca = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.15),
                new THREE.MeshStandardMaterial({ 
                    color: 0x888888, 
                    roughness: 0.9, 
                    metalness: 0.1 
                })
            );
            roca.position.y = 0.1;
            roca.scale.y = 0.6 + Math.random() * 0.4;
            roca.castShadow = true;
            roca.receiveShadow = true;
            grupo.add(roca);
            
            grupo.position.set(x, -0.5, z);
            
            grupo.userData = {
                recolectado: false,
                tipo: 'piedra'
            };
            
            scene.add(grupo);
            return grupo;
        }

        // ============================================
        // TIERRA RECOLECTABLE
        // ============================================

        function crearTierraRecolectable(x, z) {
            const grupo = new THREE.Group();
            
            // Tierra (un montículo)
            const tierra = new THREE.Mesh(
                new THREE.SphereGeometry(0.2 + Math.random() * 0.1, 6),
                new THREE.MeshStandardMaterial({ 
                    color: 0x8B7355, 
                    roughness: 0.9 
                })
            );
            tierra.position.y = 0.1;
            tierra.scale.y = 0.5;
            tierra.castShadow = true;
            tierra.receiveShadow = true;
            grupo.add(tierra);
            
            grupo.position.set(x, -0.5, z);
            
            grupo.userData = {
                recolectado: false,
                tipo: 'tierra'
            };
            
            scene.add(grupo);
            return grupo;
        }
        function crearArbusto(x, z) {
            const grupo = new THREE.Group();
            const arbustoMat = new THREE.MeshStandardMaterial({ color: 0x3a7a3a, roughness: 0.9 });
            for (let i = 0; i < 3; i++) {
                const esfera = new THREE.Mesh(
                    new THREE.SphereGeometry(0.15 + Math.random() * 0.15, 5),
                    arbustoMat
                );
                esfera.position.set((Math.random() - 0.5) * 0.3, 0.1 + Math.random() * 0.1, (Math.random() - 0.5) * 0.3);
                grupo.add(esfera);
            }
            grupo.position.set(x, -0.5, z);
            scene.add(grupo);
        }

 function crearRoca(x, z, escala = 1) {
    const grupo = new THREE.Group();
    
    // Tamaño variable: puede ser desde muy pequeña hasta muy grande
    const tamanio = escala * (0.3 + Math.random() * 0.7); // 0.3 a 1.0 de base
    
    // Crear la roca principal
    const roca = new THREE.Mesh(
        new THREE.DodecahedronGeometry(tamanio * 0.8),
        new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(0.08, 0.02, 0.4 + Math.random() * 0.3),
            roughness: 0.7 + Math.random() * 0.3,
            metalness: 0.05 + Math.random() * 0.15
        })
    );
    roca.position.y = tamanio * 0.4;
    roca.scale.set(
        0.7 + Math.random() * 0.6,
        0.5 + Math.random() * 0.6,
        0.7 + Math.random() * 0.6
    );
    roca.castShadow = true;
    roca.receiveShadow = true;
    roca.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
    grupo.add(roca);
    
    // A veces añadir una roca secundaria (para rocas grandes)
    if (tamanio > 0.5 && Math.random() > 0.6) {
        const roca2 = new THREE.Mesh(
            new THREE.DodecahedronGeometry(tamanio * 0.4),
            new THREE.MeshStandardMaterial({ 
                color: new THREE.Color().setHSL(0.08, 0.02, 0.4 + Math.random() * 0.3),
                roughness: 0.7 + Math.random() * 0.3,
                metalness: 0.05 + Math.random() * 0.15
            })
        );
        roca2.position.set(
            (Math.random() - 0.5) * tamanio * 0.8,
            tamanio * 0.2,
            (Math.random() - 0.5) * tamanio * 0.8
        );
        roca2.scale.set(
            0.5 + Math.random() * 0.5,
            0.4 + Math.random() * 0.5,
            0.5 + Math.random() * 0.5
        );
        roca2.castShadow = true;
        roca2.receiveShadow = true;
        roca2.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        grupo.add(roca2);
    }
    
    // A veces añadir una roca muy pequeña (para rocas grandes)
    if (tamanio > 0.6 && Math.random() > 0.7) {
        const roca3 = new THREE.Mesh(
            new THREE.DodecahedronGeometry(tamanio * 0.2),
            new THREE.MeshStandardMaterial({ 
                color: new THREE.Color().setHSL(0.08, 0.02, 0.4 + Math.random() * 0.3),
                roughness: 0.7 + Math.random() * 0.3,
                metalness: 0.05 + Math.random() * 0.15
            })
        );
        roca3.position.set(
            (Math.random() - 0.5) * tamanio * 1.2,
            tamanio * 0.1,
            (Math.random() - 0.5) * tamanio * 1.2
        );
        roca3.scale.set(
            0.4 + Math.random() * 0.4,
            0.3 + Math.random() * 0.4,
            0.4 + Math.random() * 0.4
        );
        roca3.castShadow = true;
        roca3.receiveShadow = true;
        roca3.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        grupo.add(roca3);
    }
    
    grupo.position.set(x, -0.5, z);
    
    grupo.userData = {
        recolectado: false,
        tipo: 'piedra'
    };
    
    scene.add(grupo);
    rocas.push(grupo);
    return grupo;
}
        function crearFlor(x, z, color) {
            const grupo = new THREE.Group();
            const tallo = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4),
                new THREE.MeshStandardMaterial({ color: 0x228B22 })
            );
            tallo.position.y = 0.075;
            grupo.add(tallo);
            
            const flor = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 6),
                new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.1 })
            );
            flor.position.y = 0.18;
            grupo.add(flor);
            
            grupo.position.set(x, -0.5, z);
            scene.add(grupo);
        }

        const coloresFlores = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xff6bb5, 0xff9f43];

       
        // --- GENERAR ROCAS RECOLECTABLES ---
        for (let i = 0; i < 25; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            const dist = Math.sqrt(x*x + z*z);
            if (dist > 5 && !(Math.abs(x - 15) < 10 && Math.abs(z - 15) < 10)) {
                const roca = crearRocaRecolectable(x, z);
                rocas.push(roca);
            }
        }

        // --- GENERAR TIERRA RECOLECTABLE ---
        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 70;
            const z = (Math.random() - 0.5) * 70;
            const dist = Math.sqrt(x*x + z*z);
            if (dist > 4 && !(Math.abs(x - 15) < 10 && Math.abs(z - 15) < 10)) {
                const tierra = crearTierraRecolectable(x, z);
                tierras.push(tierra);
            }
        }
        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 80;
            const dist = Math.sqrt(x*x + z*z);
            if (dist > 6 && dist < 35) {
                crearArbusto(x, z);
            }
        }

        for (let i = 0; i < 30; i++) {
            const x = (Math.random() - 0.5) * 75;
            const z = (Math.random() - 0.5) * 75;
            const dist = Math.sqrt(x*x + z*z);
            if (dist > 5 && !(Math.abs(x - 15) < 10 && Math.abs(z - 15) < 10)) {
                crearRoca(x, z, 0.5 + Math.random() * 0.8);
            }
        }

        

        function crearCerca(x, z, rotacion = 0) {
            const grupo = new THREE.Group();
            const maderaMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9 });
            for (let i = -2; i <= 2; i++) {
                const poste = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.05, 0.07, 0.5, 4),
                    maderaMat
                );
                poste.position.set(i * 0.6, 0.25, 0);
                poste.castShadow = true;
                grupo.add(poste);
            }
            for (let y = 0; y < 2; y++) {
                const baranda = new THREE.Mesh(
                    new THREE.BoxGeometry(2.5, 0.04, 0.04),
                    maderaMat
                );
                baranda.position.set(0, 0.15 + y * 0.25, 0);
                grupo.add(baranda);
            }
            grupo.position.set(x, -0.5, z);
            grupo.rotation.y = rotacion;
            scene.add(grupo);
        }

        crearCerca(12, 22, 0.5);
        crearCerca(18, 22, -0.5);
        crearCerca(20, 18, 1.5);
        crearCerca(10, 18, -1.5);

        for (let i = 0; i < 20; i++) {
            const t = i / 20;
            const x = -8 + t * 30;
            const z = -8 + t * 30;
            const piedra = new THREE.Mesh(
                new THREE.CircleGeometry(0.15, 5),
                new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 })
            );
            piedra.rotation.x = -Math.PI / 2;
            piedra.position.set(x, -0.45, z);
            scene.add(piedra);
        }
               

        function crearMariposa(x, y, z) {
            const grupo = new THREE.Group();
            
            const cuerpo = new THREE.Mesh(
                new THREE.CylinderGeometry(0.02, 0.02, 0.08, 4),
                new THREE.MeshStandardMaterial({ color: 0x333333 })
            );
            cuerpo.position.y = 0.04;
            grupo.add(cuerpo);
            
            const alaMat = new THREE.MeshStandardMaterial({ 
                color: Math.random() > 0.5 ? 0xff6b6b : 0x4d96ff,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            
            const alaGeo = new THREE.CircleGeometry(0.08, 4);
            
            const alaIzq = new THREE.Mesh(alaGeo, alaMat);
            alaIzq.rotation.x = -0.3;
            alaIzq.rotation.z = -0.5;
            alaIzq.position.set(-0.08, 0.04, 0);
            grupo.add(alaIzq);
            
            const alaDer = new THREE.Mesh(alaGeo, alaMat);
            alaDer.rotation.x = 0.3;
            alaDer.rotation.z = 0.5;
            alaDer.position.set(0.08, 0.04, 0);
            grupo.add(alaDer);
            
            const antenaMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            for (let i = -1; i <= 1; i+=2) {
                const antena = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.005, 0.005, 0.05, 3),
                    antenaMat
                );
                antena.position.set(i * 0.03, 0.1, 0);
                antena.rotation.z = i * 0.3;
                grupo.add(antena);
            }
            
            grupo.userData = {
                velocidad: 0.3 + Math.random() * 0.3,
                radio: 1 + Math.random() * 2,
                angulo: Math.random() * Math.PI * 2,
                centroX: x,
                centroZ: z,
                altura: y,
                aleteo: 0
            };
            
            grupo.position.set(x, y, z);
            scene.add(grupo);
            return grupo;
        }

        function crearPajaro(x, y, z) {
            const grupo = new THREE.Group();
            
            const cuerpo = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 6),
                new THREE.MeshStandardMaterial({ color: 0x222222 })
            );
            cuerpo.scale.set(1.5, 0.8, 1);
            grupo.add(cuerpo);
            
            const alaMat = new THREE.MeshStandardMaterial({ 
                color: 0x444444,
                side: THREE.DoubleSide
            });
            
            const alaGeo = new THREE.CircleGeometry(0.15, 4);
            
            const alaIzq = new THREE.Mesh(alaGeo, alaMat);
            alaIzq.rotation.x = -0.5;
            alaIzq.rotation.z = -0.3;
            alaIzq.position.set(-0.1, 0, 0);
            grupo.add(alaIzq);
            
            const alaDer = new THREE.Mesh(alaGeo, alaMat);
            alaDer.rotation.x = 0.5;
            alaDer.rotation.z = 0.3;
            alaDer.position.set(0.1, 0, 0);
            grupo.add(alaDer);
            
            const cola = new THREE.Mesh(
                new THREE.CircleGeometry(0.06, 4),
                new THREE.MeshStandardMaterial({ color: 0x444444, side: THREE.DoubleSide })
            );
            cola.rotation.x = 0.5;
            cola.position.set(0, 0, -0.12);
            grupo.add(cola);
            
            grupo.userData = {
                velocidad: 0.5 + Math.random() * 0.5,
                radio: 5 + Math.random() * 8,
                angulo: Math.random() * Math.PI * 2,
                centroX: x,
                centroZ: z,
                alturaBase: y,
                aleteo: 0
            };
            
            grupo.position.set(x, y, z);
            scene.add(grupo);
            return grupo;
        }

        function crearConejo(x, z) {
            const grupo = new THREE.Group();
            
            const cuerpo = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 6),
                new THREE.MeshStandardMaterial({ color: 0x8B8B7A })
            );
            cuerpo.scale.set(1.2, 0.8, 1);
            cuerpo.position.y = 0.1;
            grupo.add(cuerpo);
            
            const cabeza = new THREE.Mesh(
                new THREE.SphereGeometry(0.08, 6),
                new THREE.MeshStandardMaterial({ color: 0x9B9B8A })
            );
            cabeza.position.set(0.12, 0.15, 0);
            grupo.add(cabeza);
            
            const orejaMat = new THREE.MeshStandardMaterial({ color: 0x9B9B8A });
            for (let i = -1; i <= 1; i+=2) {
                const oreja = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.015, 0.02, 0.15, 4),
                    orejaMat
                );
                oreja.position.set(0.1 + i * 0.04, 0.25, 0);
                oreja.rotation.z = i * 0.2;
                grupo.add(oreja);
            }
            
            const pataMat = new THREE.MeshStandardMaterial({ color: 0x7B7B6A });
            for (let i = -1; i <= 1; i+=2) {
                const pata = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.03, 0.08, 4),
                    pataMat
                );
                pata.position.set(i * 0.06, 0.04, -0.08);
                grupo.add(pata);
            }
            
            const cola = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 5),
                new THREE.MeshStandardMaterial({ color: 0xFFFFFF })
            );
            cola.position.set(0, 0.06, -0.14);
            grupo.add(cola);
            
            grupo.userData = {
                velocidad: 0.2 + Math.random() * 0.3,
                direccion: Math.random() * Math.PI * 2,
                tiempo: 0,
                estado: 'buscando', // 'buscando', 'saltando', 'comiendo'
                zonaX: x,
                zonaZ: z,
                radio: 2 + Math.random() * 3
            };
            
            grupo.position.set(x, -0.4, z);
            scene.add(grupo);
            return grupo;
        }

        const mariposas = [];
        const pajaros = [];
        const conejos = [];

        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 60;
            const z = (Math.random() - 0.5) * 60;
            const dist = Math.sqrt(x*x + z*z);
            if (dist > 5) {
                const y = 0.5 + Math.random() * 0.5;
                mariposas.push(crearMariposa(x, y, z));
            }
        }

        for (let i = 0; i < 8; i++) {
            const x = (Math.random() - 0.5) * 70;
            const z = (Math.random() - 0.5) * 70;
            const dist = Math.sqrt(x*x + z*z);
            if (dist > 8) {
                const y = 4 + Math.random() * 4;
                pajaros.push(crearPajaro(x, y, z));
            }
        }

        for (let i = 0; i < 10; i++) {
            const x = (Math.random() - 0.5) * 50;
            const z = (Math.random() - 0.5) * 50;
            const dist = Math.sqrt(x*x + z*z);
            if (dist > 6 && dist < 30) {
                conejos.push(crearConejo(x, z));
            }
        }

        function animarAnimales(time) {
            const tiempo = time / 1000;
            
            mariposas.forEach(mariposa => {
                const data = mariposa.userData;
                data.angulo += 0.01 * data.velocidad;
                
                mariposa.position.x = data.centroX + Math.cos(data.angulo) * data.radio;
                mariposa.position.z = data.centroZ + Math.sin(data.angulo) * data.radio;
                mariposa.position.y = data.altura + Math.sin(data.angulo * 2) * 0.2;
                
                mariposa.rotation.y = -data.angulo;
                
                data.aleteo += 0.1;
                const alas = mariposa.children.filter(c => c.geometry && c.geometry.type === 'CircleGeometry');
                alas.forEach((ala, i) => {
                    const factor = i === 0 ? 1 : -1;
                    ala.rotation.x = Math.sin(data.aleteo) * 0.5 * factor;
                });
            });
            
            pajaros.forEach(pajaro => {
                const data = pajaro.userData;
                data.angulo += 0.005 * data.velocidad;
                
                pajaro.position.x = data.centroX + Math.cos(data.angulo) * data.radio;
                pajaro.position.z = data.centroZ + Math.sin(data.angulo) * data.radio * 0.7;
                pajaro.position.y = data.alturaBase + Math.sin(data.angulo * 1.5) * 0.5;
                
                pajaro.rotation.y = -data.angulo + Math.PI / 2;
                
                data.aleteo += 0.15;
                const alas = pajaro.children.filter(c => c.geometry && c.geometry.type === 'CircleGeometry');
                alas.forEach((ala, i) => {
                    const factor = i === 0 ? 1 : -1;
                    ala.rotation.x = Math.sin(data.aleteo) * 0.8 * factor;
                });
            });
            
            conejos.forEach(conejo => {
                const data = conejo.userData;
                data.tiempo += 0.01;
                
                if (Math.random() < 0.005) {
                    data.direccion += (Math.random() - 0.5) * 2;
                }
                
                const dx = Math.cos(data.direccion) * data.velocidad * 0.02;
                const dz = Math.sin(data.direccion) * data.velocidad * 0.02;
                
                let newX = conejo.position.x + dx;
                let newZ = conejo.position.z + dz;
                
                const distDesdeCentro = Math.sqrt(
                    Math.pow(newX - data.zonaX, 2) + 
                    Math.pow(newZ - data.zonaZ, 2)
                );
                if (distDesdeCentro > data.radio) {
                    data.direccion += Math.PI / 2;
                }
                
                conejo.position.x = newX;
                conejo.position.z = newZ;
                
                conejo.rotation.y = -data.direccion;
                
                const salto = Math.abs(Math.sin(data.tiempo * 3)) * 0.08;
                conejo.position.y = -0.4 + salto;
                
                const estiramiento = 1 + Math.sin(data.tiempo * 3) * 0.05;
                conejo.scale.y = estiramiento;
                conejo.scale.x = 1 / estiramiento;
            });
        }
       function crearMiAvatar(emoji, nombre) {
    if (miPersonaje) scene.remove(miPersonaje);
    
    const grupo = new THREE.Group();
    
   
    
    // Cuerpo
    const cuerpo = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.8, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: 0x004466 })
    );
    cuerpo.position.y = 0.4;
    grupo.add(cuerpo);

    // Cabeza
    const cabeza = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 6),
        new THREE.MeshStandardMaterial({ color: 0xffccaa })
    );
    cabeza.position.y = 0.9;
    grupo.add(cabeza);

    // Emoji (sprite)
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
    sprite.position.set(0, 1.5, 0);
    sprite.scale.set(0.7, 0.7, 1);
    grupo.add(sprite);

   
    const nombreCanvas = document.createElement('canvas');
    nombreCanvas.width = 256;
    nombreCanvas.height = 64;
    const ctx2 = nombreCanvas.getContext('2d');
    ctx2.fillStyle = 'rgba(0,0,0,0.7)';
    ctx2.fillRect(10, 10, 236, 44);
    ctx2.font = 'bold 26px Arial';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillStyle = '#ffffff';
    ctx2.fillText(nombre, 128, 36);
    const nombreTex = new THREE.CanvasTexture(nombreCanvas);
    const nombreSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nombreTex, depthTest: false, transparent: true }));
    nombreSprite.position.set(0, 2.1, 0);
    nombreSprite.scale.set(1.6, 0.4, 1);
    grupo.add(nombreSprite);

    grupo.position.set(x, -0.5, z);
    scene.add(grupo);
    miPersonaje = grupo;
    
    console.log('✅ Avatar creado con cubo de prueba ROJO');
    console.log('📌 Posición inicial:', grupo.position.y);
}
        function crearAvatarOtro(id, emoji, nombre, xPos = 0, zPos = 0) {
            if (otrosAvatares[id]) {
                scene.remove(otrosAvatares[id]);
                delete otrosAvatares[id];
            }
            
            const grupo = new THREE.Group();
            
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.font = '80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji || '👾', 64, 64);
            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true }));
            sprite.scale.set(1.2, 1.2, 1);
            sprite.position.set(0, 0.6, 0);
            grupo.add(sprite);

            const cuerpo = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 0.4, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x4488ff, roughness: 0.5 })
            );
            cuerpo.position.y = 0.2;
            grupo.add(cuerpo);

            const nombreCanvas = document.createElement('canvas');
            nombreCanvas.width = 300;
            nombreCanvas.height = 70;
            const ctx2 = nombreCanvas.getContext('2d');
            ctx2.fillStyle = 'rgba(0,0,0,0.8)';
            ctx2.fillRect(10, 10, 280, 50);
            ctx2.font = 'bold 28px Arial';
            ctx2.textAlign = 'center';
            ctx2.textBaseline = 'middle';
            ctx2.fillStyle = '#ffffff';
            ctx2.fillText(nombre || 'Jugador', 155, 40);
            
            const nombreTex = new THREE.CanvasTexture(nombreCanvas);
            const nombreSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nombreTex, depthTest: false, transparent: true }));
            nombreSprite.position.y = 1.8;
            nombreSprite.scale.set(1.8, 0.42, 1);
            grupo.add(nombreSprite);

            grupo.position.set(xPos || 0, -0.5, zPos || 0);
            scene.add(grupo);
            otrosAvatares[id] = grupo;
            
            console.log(`✅ Avatar creado: ${nombre} con ${emoji}`);
        }

      const teclas = { w: false, a: false, s: false, d: false };


let mundoActual = 'normal';
let tiempoCambioMundo = 0;
const intervaloCambioMundo = 60; 

const mundos = {
    normal: {
        nombre: 'Mundo Normal',
        fondo: 0x87CEEB,
        fog: 0x87CEEB,
        colorLuz: 0xffeedd,
        colorAmbiente: 0x404060,
        icono: '🌿'
    },
    oscuro: {
        nombre: 'Mundo Oscuro',
        fondo: 0x1a0a0a,
        fog: 0x1a0a0a,
        colorLuz: 0xff6633,
        colorAmbiente: 0x221111,
        icono: '🌋'
    },
    nieve: {
        nombre: 'Mundo de Nieve',
        fondo: 0xadd8e6,
        fog: 0xadd8e6,
        colorLuz: 0xccddff,
        colorAmbiente: 0x446688,
        icono: '❄️'
    },
    desierto: {
        nombre: 'Mundo Desierto',
        fondo: 0xf4a460,
        fog: 0xf4a460,
        colorLuz: 0xffdd88,
        colorAmbiente: 0x886633,
        icono: '🏜️'
    }
};

function cambiarMundo(nuevoMundo) {
    if (nuevoMundo === mundoActual) return;
    
    const mundo = mundos[nuevoMundo];
    mundoActual = nuevoMundo;
    
    limpiarElementosMundo();
    
    scene.background = new THREE.Color(mundo.fondo);
    scene.fog = new THREE.Fog(mundo.fog, 15, 30);
    sun.color.setHex(mundo.colorLuz);
    ambient.color.setHex(mundo.colorAmbiente);
    
    
    if (nuevoMundo === 'normal') {
        groundMatPrincipal.color.setHex(0x4a8c3f); 
        hillMat.color.setHex(0x5a9c4f);           
        mapaOscuro.visible = false;
        crearElementosMundoNormal();
    } else if (nuevoMundo === 'nieve') {
        groundMatPrincipal.color.setHex(0xccccdd); 
        hillMat.color.setHex(0xccccdd);            
        mapaOscuro.visible = false;
        crearElementosMundoNieve();
    } else if (nuevoMundo === 'desierto') {
        groundMatPrincipal.color.setHex(0xeeddbb); 
        hillMat.color.setHex(0xeeddbb);            
        mapaOscuro.visible = false;
        crearElementosMundoDesierto();
    } else if (nuevoMundo === 'oscuro') {
        groundMatPrincipal.color.setHex(0x443333); 
        hillMat.color.setHex(0x443333);            
        mapaOscuro.visible = true;
        crearElementosMundoOscuro();
    }
    
    groundMatPrincipal.needsUpdate = true;
    hillMat.needsUpdate = true;
    
    agregarMensajeChat('🌍 Sistema', `¡Bienvenido al ${mundo.nombre}! ${mundo.icono}`, false);
}

function cambiarMundoAleatorio() {
    const nombresMundos = Object.keys(mundos);
    let mundosDisponibles = nombresMundos.filter(m => m !== mundoActual);
    let nuevoMundo = mundosDisponibles[Math.floor(Math.random() * mundosDisponibles.length)];
    cambiarMundo(nuevoMundo);
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'W') teclas.w = true;
    if (e.key === 'a' || e.key === 'A') teclas.a = true;
    if (e.key === 's' || e.key === 'S') teclas.s = true;
    if (e.key === 'd' || e.key === 'D') teclas.d = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'W') teclas.w = false;
    if (e.key === 'a' || e.key === 'A') teclas.a = false;
    if (e.key === 's' || e.key === 'S') teclas.s = false;
    if (e.key === 'd' || e.key === 'D') teclas.d = false;
});

        function setupBoton(id, tecla) {
            const btn = document.getElementById(id);
            if (!btn) return;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); teclas[tecla] = true; });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); teclas[tecla] = false; });
            btn.addEventListener('touchcancel', (e) => { teclas[tecla] = false; });
            btn.addEventListener('mousedown', () => teclas[tecla] = true);
            btn.addEventListener('mouseup', () => teclas[tecla] = false);
            btn.addEventListener('mouseleave', () => teclas[tecla] = false);
        }

        setupBoton('btn-arriba', 'w');
        setupBoton('btn-abajo', 's');
        setupBoton('btn-izquierda', 'a');
        setupBoton('btn-derecha', 'd');

        const velocidad = 0.12;
        let lastTime = 0;

      

function loop(time) {
    const delta = Math.min((time - lastTime) / 16.67, 2);
    lastTime = time;
    
    animarAnimales(time);  
    
    let dx = 0, dz = 0;
    if (teclas.w) dz -= velocidad * delta;
    if (teclas.s) dz += velocidad * delta;
    if (teclas.a) dx -= velocidad * delta;
    if (teclas.d) dx += velocidad * delta;
    
    if (dx !== 0 && dz !== 0) {
        dx *= 0.707;
        dz *= 0.707;
    }
    
    x += dx;
    z += dz;

    const limite = 45;
    x = Math.max(-limite, Math.min(limite, x));
    z = Math.max(-limite, Math.min(limite, z));

    if (miPersonaje) {
  
    
    
    let alturaBloqueDebajo = -0.5; 
    const radioDeteccion = 0.4; 
    
    
    for (let b of bloquesColocados) {
        const distX = Math.abs(b.position.x - x);
        const distZ = Math.abs(b.position.z - z);
        if (distX < radioDeteccion && distZ < radioDeteccion) {
            const alturaSuperior = b.position.y + 0.5;
            if (alturaSuperior > alturaBloqueDebajo) {
                alturaBloqueDebajo = alturaSuperior;
            }
        }
    }
    
    
    if (alturaPersonaje > alturaBloqueDebajo) {
        alturaPersonaje += (alturaBloqueDebajo - alturaPersonaje) * 0.15;
        if (Math.abs(alturaPersonaje - alturaBloqueDebajo) < 0.01) {
            alturaPersonaje = alturaBloqueDebajo;
        }
    } else {
        alturaPersonaje = alturaBloqueDebajo;
    }
    
    
    miPersonaje.position.x = x;
    miPersonaje.position.z = z;
    miPersonaje.position.y = alturaPersonaje;
    socket.emit('movimiento', { x: x, z: z, y: alturaPersonaje });
}

    tiempoCambioMundo += delta / 60;
    if (tiempoCambioMundo >= intervaloCambioMundo) {
        tiempoCambioMundo = 0;
        cambiarMundoAleatorio();
    }                    

    camera.position.x += (x - camera.position.x) * 0.08;
    camera.position.z += (z + 12 - camera.position.z) * 0.08;
    camera.position.y += (8 - camera.position.y) * 0.08;
    camera.lookAt(x, 0, z);

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}  

requestAnimationFrame(loop);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
             

        function actualizarInventario() {
            document.getElementById('madera-cantidad').textContent = inventario.madera;
            document.getElementById('piedra-cantidad').textContent = inventario.piedra;
            document.getElementById('tierra-cantidad').textContent = inventario.tierra;
        }

        actualizarInventario();
  
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();


   

        let materialSeleccionado = 'madera';

        const indicadorMaterial = document.createElement('div');
        indicadorMaterial.id = 'indicador-material';
    indicadorMaterial.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px 15px;
    border-radius: 10px;
    font-family: Arial, sans-serif;
    font-size: 16px;
    z-index: 1000;
    border: 2px solid #00ff88;
    pointer-events: none;
`;
        document.body.appendChild(indicadorMaterial);

        function actualizarIndicadorMaterial() {
            const nombres = {
                madera: '🪵 Madera',
                piedra: '🪨 Piedra',
                tierra: '🟫 Tierra'
            };
            const colores = {
                madera: '#8B5A2B',
                piedra: '#888888',
                tierra: '#8B7355'
            };
            indicadorMaterial.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span>🔨 Material:</span>
                    <span style="color: ${colores[materialSeleccionado]}; font-weight: bold; font-size: 18px;">
                        ${nombres[materialSeleccionado]}
                    </span>
                    <span style="font-size:12px; color:#aaa; margin-left:5px;">
                        (${inventario[materialSeleccionado]})
                    </span>
                </div>
            `;
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === '1') {
                materialSeleccionado = 'madera';
                agregarMensajeChat('🪵 Sistema', 'Material seleccionado: Madera', false);
                actualizarIndicadorMaterial();
            } else if (e.key === '2') {
                materialSeleccionado = 'piedra';
                agregarMensajeChat('🪨 Sistema', 'Material seleccionado: Piedra', false);
                actualizarIndicadorMaterial();
            } else if (e.key === '3') {
                materialSeleccionado = 'tierra';
                agregarMensajeChat('🟫 Sistema', 'Material seleccionado: Tierra', false);
                actualizarIndicadorMaterial();
            }
        });

        actualizarIndicadorMaterial();

        renderer.domElement.addEventListener('click', (event) => {
            if (event.button !== 0) return;
            
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            
            const intersectsArbol = raycaster.intersectObjects(arboles, true);
            if (intersectsArbol.length > 0) {
                let objeto = intersectsArbol[0].object;
                let arbolEncontrado = null;
                while (objeto.parent) {
                    if (objeto.parent.userData && objeto.parent.userData.talado !== undefined) {
                        arbolEncontrado = objeto.parent;
                        break;
                    }
                    objeto = objeto.parent;
                }
                if (arbolEncontrado && !arbolEncontrado.userData.talado) {
                    arbolEncontrado.visible = false;
                    arbolEncontrado.userData.talado = true;
                    const maderaObtenida = 2 + Math.floor(Math.random() * 4);
                    inventario.madera += maderaObtenida;
                    actualizarInventario();
                    agregarMensajeChat('🌲 Sistema', `¡Has talado un árbol! +${maderaObtenida} madera`, false);
                    setTimeout(() => {
                        arbolEncontrado.visible = true;
                        arbolEncontrado.userData.talado = false;
                    }, 10000);
                    return;
                }
            }
            
            const intersectsRoca = raycaster.intersectObjects(rocas, true);
            if (intersectsRoca.length > 0) {
                let objeto = intersectsRoca[0].object;
                let rocaEncontrada = null;
                while (objeto.parent) {
                    if (objeto.parent.userData && objeto.parent.userData.tipo === 'piedra') {
                        rocaEncontrada = objeto.parent;
                        break;
                    }
                    objeto = objeto.parent;
                }
                if (rocaEncontrada && !rocaEncontrada.userData.recolectado) {
                    rocaEncontrada.visible = false;
                    rocaEncontrada.userData.recolectado = true;
                    const piedraObtenida = 1 + Math.floor(Math.random() * 3);
                    inventario.piedra += piedraObtenida;
                    actualizarInventario();
                    agregarMensajeChat('🪨 Sistema', `¡Has recolectado piedra! +${piedraObtenida}`, false);
                    setTimeout(() => {
                        rocaEncontrada.visible = true;
                        rocaEncontrada.userData.recolectado = false;
                    }, 8000);
                    return;
                }
            }
            
            const intersectsTierra = raycaster.intersectObjects(tierras, true);
            if (intersectsTierra.length > 0) {
                let objeto = intersectsTierra[0].object;
                let tierraEncontrada = null;
                while (objeto.parent) {
                    if (objeto.parent.userData && objeto.parent.userData.tipo === 'tierra') {
                        tierraEncontrada = objeto.parent;
                        break;
                    }
                    objeto = objeto.parent;
                }
                if (tierraEncontrada && !tierraEncontrada.userData.recolectado) {
                    tierraEncontrada.visible = false;
                    tierraEncontrada.userData.recolectado = true;
                    const tierraObtenida = 1 + Math.floor(Math.random() * 2);
                    inventario.tierra += tierraObtenida;
                    actualizarInventario();
                    agregarMensajeChat('🟫 Sistema', `¡Has recolectado tierra! +${tierraObtenida}`, false);
                    setTimeout(() => {
                        tierraEncontrada.visible = true;
                        tierraEncontrada.userData.recolectado = false;
                    }, 8000);
                    return;
                }
            }
        });
renderer.domElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    
    let cantidad = inventario[materialSeleccionado];
    if (cantidad < 1) {
        agregarMensajeChat('❌ Sistema', `No tienes ${materialSeleccionado} para construir`, false);
        return;
    }
    
    const colores = {
        madera: 0x8B5A2B,
        piedra: 0x888888,
        tierra: 0x8B7355
    };
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const raycasterSuelo = new THREE.Raycaster();
    raycasterSuelo.setFromCamera(mouse, camera);
    

const intersects = raycasterSuelo.intersectObjects([ground, hills], true);
    
    if (intersects.length > 0) {
        const punto = intersects[0].point;
        
        const bloqueX = Math.round(punto.x / 0.5) * 0.5;
        const bloqueZ = Math.round(punto.z / 0.5) * 0.5;
        
        const distAlJugador = Math.sqrt(
            Math.pow(bloqueX - x, 2) + 
            Math.pow(bloqueZ - z, 2)
        );
        if (distAlJugador < 1.5) {
            agregarMensajeChat('⚠️ Sistema', 'Demasiado cerca para construir', false);
            return;
        }
        

        
        
        let bloqueY = 0.3; // Altura base (suelo)
        let alturaMaxima = -999;
        
        for (let b of bloquesColocados) {
            if (Math.abs(b.position.x - bloqueX) < 0.1 && Math.abs(b.position.z - bloqueZ) < 0.1) {
                if (b.position.y > alturaMaxima) {
                    alturaMaxima = b.position.y;
                }
            }
        }
        
        if (alturaMaxima > -999) {
            bloqueY = alturaMaxima + 0.5;
        }
        
        let bloqueExistente = false;
        for (let b of bloquesColocados) {
            if (Math.abs(b.position.x - bloqueX) < 0.1 && 
                Math.abs(b.position.z - bloqueZ) < 0.1 && 
                Math.abs(b.position.y - bloqueY) < 0.1) {
                bloqueExistente = true;
                break;
            }
        }
        if (bloqueExistente) {
            agregarMensajeChat('⚠️ Sistema', 'Ya hay un bloque ahí', false);
            return;
        }
        
        const bloque = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ 
                color: colores[materialSeleccionado], 
                roughness: 0.9
            })
        );
        bloque.position.set(bloqueX, bloqueY, bloqueZ);
        bloque.castShadow = true;
        bloque.receiveShadow = true;
        scene.add(bloque);
        
        bloquesColocados.push(bloque);
        inventario[materialSeleccionado]--;
        actualizarInventario();
        
        const nombres = {
            madera: '🪵 Madera',
            piedra: '🪨 Piedra',
            tierra: '🟫 Tierra'
        };
        agregarMensajeChat('🧱 Sistema', `¡Has colocado un bloque de ${nombres[materialSeleccionado]}!`, false);
    } else {
        agregarMensajeChat('❌ Sistema', 'Apunta al suelo para construir', false);
    }
});
renderer.domElement.addEventListener('mousedown', (event) => {
    if (event.button !== 1) return;
    
    event.preventDefault();
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(bloquesColocados);
    
    if (intersects.length > 0) {
        const bloque = intersects[0].object;
        
        const distAlJugador = Math.sqrt(
            Math.pow(bloque.position.x - x, 2) + 
            Math.pow(bloque.position.z - z, 2)
        );
        if (distAlJugador > 8) {
            agregarMensajeChat('⚠️ Sistema', 'Demasiado lejos para eliminar', false);
            return;
        }
        
        scene.remove(bloque);
        const index = bloquesColocados.indexOf(bloque);
        if (index > -1) {
            bloquesColocados.splice(index, 1);
        }
        
        const material = bloque.material.color.getHex();
        let materialNombre = 'madera';
        if (material === 0x888888) materialNombre = 'piedra';
        else if (material === 0x8B7355) materialNombre = 'tierra';
        else materialNombre = 'madera';
        
        inventario[materialNombre] += 1;
        actualizarInventario();
        
        agregarMensajeChat('🗑️ Sistema', `¡Has eliminado un bloque de ${materialNombre}! +1 recurso`, false);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'e' || e.key === 'E') {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        mouse.x = (centerX / window.innerWidth) * 2 - 1;
        mouse.y = -(centerY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(bloquesColocados);
        
        if (intersects.length > 0) {
            const bloque = intersects[0].object;
            
            const distAlJugador = Math.sqrt(
                Math.pow(bloque.position.x - x, 2) + 
                Math.pow(bloque.position.z - z, 2)
            );
            if (distAlJugador > 8) {
                agregarMensajeChat('⚠️ Sistema', 'Demasiado lejos para eliminar', false);
                return;
            }
            
            scene.remove(bloque);
            const index = bloquesColocados.indexOf(bloque);
            if (index > -1) {
                bloquesColocados.splice(index, 1);
            }
            
            const material = bloque.material.color.getHex();
            let materialNombre = 'madera';
            if (material === 0x888888) materialNombre = 'piedra';
            else if (material === 0x8B7355) materialNombre = 'tierra';
            
            inventario[materialNombre] += 1;
            actualizarInventario();
            
            agregarMensajeChat('🗑️ Sistema', `¡Has eliminado un bloque de ${materialNombre}! +1 recurso`, false);
        }
    }
});
        console.log('🚀 Metaverso iniciado');
        console.log('📱 Modo celular:', esCelular);

console.log('🌍 Creando mundo normal...');
crearElementosMundoNormal();
console.log(`🌲 Árboles creados: ${arboles.length}`);

setTimeout(() => {
    agregarMensajeChat('🌍 Sistema', '¡Metaverso iniciado! Talar árboles con click izquierdo 🪓', false);
    agregarMensajeChat('🌲 Sistema', `Hay ${arboles.length} árboles en el mundo`, false);
}, 500);

console.log('🔧 Comandos de depuración:');
console.log('  - arboles.length (ver cantidad de árboles)');
console.log('  - cambiarMundo("normal") (cambiar a mundo normal)');
console.log('  - crearElementosMundoNormal() (forzar creación de árboles)');

if (esCelular) {
    console.log('📱 Modo móvil activado - Configurando chat modal');
    
    const chatContainer = document.getElementById('chat-container');
    const chatToggle = document.getElementById('mobile-chat-toggle');
    const cerrarChat = document.getElementById('cerrar-chat-mobile');
    const btnSalto = document.getElementById('btn-salto-mobile');
    const badge = document.getElementById('chat-badge');
    
    if (chatContainer) {
        chatContainer.classList.remove('abierto');
    }
    
    if (chatToggle) {
        chatToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (chatContainer) {
                chatContainer.classList.toggle('abierto');
            }
            this.style.display = 'none';
            if (badge) {
                badge.classList.remove('visible');
                badge.textContent = '0';
            }
        });
    }
    
    if (cerrarChat) {
        cerrarChat.addEventListener('click', function() {
            if (chatContainer) {
                chatContainer.classList.remove('abierto');
            }
            if (chatToggle) {
                chatToggle.style.display = 'flex';
            }
        });
    }
    
    document.addEventListener('click', function(e) {
        if (chatContainer && chatContainer.classList.contains('abierto')) {
            if (!chatContainer.contains(e.target) && e.target !== chatToggle) {
                chatContainer.classList.remove('abierto');
                if (chatToggle) {
                    chatToggle.style.display = 'flex';
                }
            }
        }
    });
    
  
    
    let mensajesNoLeidos = 0;
    const funcionOriginalAgregar = agregarMensajeChat;
    
    agregarMensajeChat = function(nombre, mensaje, esPropio = false) {
        // Llamar a la función original
        funcionOriginalAgregar(nombre, mensaje, esPropio);
        
        if (chatContainer && !chatContainer.classList.contains('abierto') && !esPropio) {
            mensajesNoLeidos++;
            if (badge) {
                badge.textContent = mensajesNoLeidos;
                badge.classList.add('visible');
            }
        }
    };
    
    const numUsuariosHeader = document.getElementById('num-usuarios-header');
    if (numUsuariosHeader) {
        const originalActualizar = document.getElementById('num-usuarios');
        if (originalActualizar) {
            const observer = new MutationObserver(function() {
                numUsuariosHeader.textContent = originalActualizar.textContent;
            });
            observer.observe(originalActualizar, { childList: true, characterData: true });
        }
    }
    
    console.log('✅ Modo móvil configurado correctamente');
}
