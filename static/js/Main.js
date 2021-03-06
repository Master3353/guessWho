var socket;
var tableOfChampions;
var you;
var coverable = false
var picked = false
var guess = false
var guessesLeft = 3;
var init = function () {

	let siteUrl;
	let saveConWss;

	if (HEROKU_URL) {
		siteUrl = HEROKU_URL;
	} else {
		siteUrl = "localhost";
	}

	if (siteUrl != "localhost") {
		saveConWss = "wss";
	} else {
		saveConWss = "ws"
	}

	socket = io(`${saveConWss}://${siteUrl}${siteUrl != "localhost" ? "" : `:${PORT}`}`, {
		transports: ['websocket'],
	});

	socket.on("connect", () => {
		socket.send("hello");
		socket.emit("sendId", socket.id)
		you = socket.id
		console.log(socket.id)
	});
	socket.on("hello", (arg) => {

		if (arg == true) {
			make3D()
		} else {
			document.body.innerHTML = "<h1>Czekanie na 2 graczy</h1>"
		}
	});
	socket.on("data", (table) => {
		tableOfChampions = table
	})
	socket.on("full",()=>{
		document.body.innerHTML = "<h1>Rozgrywka już trwa :)</h1>"
	})
	socket.on("firstRound", () => {
		picked = true
		coverable = true
		alert("zaczynamy giereczke")
		$(endTurn).html("Wyslij wiadomosc do drugiego gracza")
		$(msgFromPlayer).html("")
		$(chancesLeft).html("Pozostałych szans: " + guessesLeft)
	})
	socket.on("getMsg", (smthToAdd) => {
		var textarea = $(msgFromPlayer);
		let temporary = textarea.html()
		temporary += smthToAdd + "\n"
		textarea.html(temporary)
		
		if(textarea.length)
		textarea.scrollTop(textarea[0].scrollHeight - textarea.height());
	})
	socket.on("Win", (id) =>{
		if(socket.id == id){
			document.body.innerHTML = "<h1>WYGRAŁEŚ :)</h1>"
		}else{
			document.body.innerHTML = "<h1>PRZEGRAŁEŚ :(</h1>"
		}
	})
	socket.on("Lose", (id) =>{
		if(socket.id == id){
			
			guessesLeft--
			$(chancesLeft).html("Pozostałych szans: " + guessesLeft)
		}else{
			console.log("to drugi zgadywał")
		}
		if(guessesLeft == 0){
			socket.emit("winOnTry", id)
		}
	})
	socket.on("EndGame",(id)=>{
		if(socket.id == id){
			document.body.innerHTML = "<h1>PRZEGRAŁEŚ :(</h1>"
		}else{
			document.body.innerHTML = "<h1>WYGRAŁEŚ :)</h1>"
		}
	})
	
}

document.addEventListener("DOMContentLoaded", function () {
	init()
});

var make3D = function () {
	console.log("robi sie 3d")
	document.body.innerHTML = '<div id="root"></div>' + '<div id="navigation"><button id="endTurn">Potwierdz wybór swojej postaci</button><input type="text" id="textToSend" /><div id="gameInfo"></div><textarea disabled id="msgFromPlayer" name="msg" rows="4" cols="50"></textarea><button id="guess">Zgadnij postac</button><div id="chancesLeft"></div></div > '
	var scene = new Scene();


	var renderer = new Renderer();

	$("#root").append(renderer.domElement);
	var raycaster = new THREE.Raycaster();
	var mouseVector = new THREE.Vector2()

	let model;

	var camera = new Camera(renderer);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	camera.position.set(0, 19, 100)
	const loadingManager = new THREE.LoadingManager(function () {

		model.traverse(function (child) {


			if (child.name == "Kostka.001") {
				child.material.color = hexToRgbTreeJs('#54e39e')
			}
			if (child.name == "Prostokąt") {
				child.material.color = hexToRgbTreeJs('#f9ff52')
			}

		})
		model.position.set(15, -23, -10)
		scene.add(model);

	});

	const loader = new THREE.ColladaLoader(loadingManager);
	loader.load('../models/plansza8.dae', function (collada) {

		model = collada.scene;

	});

	const makeCubes = function () {
		let geometry = new THREE.BoxGeometry(10, 10, 3);

		for (let i = 0; i < 5; i++) {
			let y = 24 - (i * 11.5)
			for (let j = 0; j < 5; j++) {
				let x = -28 + (j * 14)
				let id = (i * 5 + j)
				let material = new THREE.MeshBasicMaterial({
					map: new THREE.TextureLoader().load(tableOfChampions[id].icon),
					transparent: false,
				})
				let cube = new THREE.Mesh(geometry, material);
				cube.picLink = tableOfChampions[id].icon
				cube.name = tableOfChampions[id].name
				cube.temp = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
				cube.position.set(x, y, 0)
				scene.add(cube);
			}
		}
	}
	makeCubes()
	let yourChamp = ""
	let yourChampName = ""


	let pickChamp = function (link, name, whole) {
		if (picked == false) {
			yourChamp = link
			yourChampName = name
			console.log(name)
			$(gameInfo).html('Twój champion to: </br>' + '<img src="' + yourChamp + '"></img>')
			//console.log({ you, yourChamp })
		}
		if (coverable == true && guess == false) {

			let tmp = whole.material
			whole.material = whole.temp
			whole.temp = tmp

		}

	}
	let clickButton = function () {
		if (picked == false && $(gameInfo).html() != "") {
			picked = true
			socket.emit('pick', yourChampName)

		}
		if (picked == true && coverable == true) {
			let dataToSend = $(textToSend).val()
			if(dataToSend != ""){
				let id = socket.id
				socket.emit("wiadomosc", dataToSend)
			}
			$(textToSend).val("")
		}
	}
	$(endTurn).click(clickButton)
	
	let guessButton = function (){
		console.log("klikamy")
		if (guess == false) {
			console.log("siema na true")
			coverable = false
			guess = true
			$('#guess').html("Wybierz postac do zgadniecia")
		}else if(guess == true){
			
			console.log("siema na false")
			coverable = true
			guess = false
			let nameGuessed = $('#guess').html().split(" ")
			let id = socket.id
			console.log("Co wysyłamy: ")
			console.log(nameGuessed[nameGuessed.length - 1])
			console.log(id)
			socket.emit("Guess", nameGuessed[nameGuessed.length - 1], id)
			$('#guess').html("Zgadnij postac")
		}
	}
	let getName = function (klik){
		console.log(klik)
	}
	$('#guess').click(guessButton)
	$(document).mousedown(function (event) {
		mouseVector.x = (event.clientX / $(window).width()) * 2 - 1;
		mouseVector.y = -(event.clientY / $(window).height()) * 2 + 1;
		raycaster.setFromCamera(mouseVector, camera);
		var intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length > 0) {

			console.log(intersects[0].object)
			pickChamp(intersects[0].object.picLink, intersects[0].object.name, intersects[0].object)
			if(guess == true && coverable == false){
				getName(intersects[0].object.name)
				$('#guess').html("Wybrany champion: "+intersects[0].object.name)
			}
		}
		
	})

	let cameraLeft = false;
	let cameraRight = false;
	$(document).keydown(function (event) {

		var keyCode = event.which;

		switch (keyCode) {
			case 37:
				cameraLeft = true
				break;
			case 39:
				cameraRight = true
				break;
		}
	}
	)
	$(document).keyup(function (event) {

		var keyCode = event.which;
		switch (keyCode) {
			case 37:
				cameraLeft = false;
				break;
			case 39:
				cameraRight = false;
				break;
		}
	}
	)
	let angle = 0
	var lastRenderTime = Date.now()
	function render() {
		requestAnimationFrame(render);
		var renderTime = Date.now()
		var delta = (renderTime - lastRenderTime) / 1000
		lastRenderTime = renderTime
		if (cameraRight == true) {
			camera.position.z = 100 * Math.cos(angle);
			camera.position.x = 100 * Math.sin(angle);
			angle += delta
			camera.lookAt(scene.position)
		}
		if (cameraLeft == true) {
			camera.position.z = 100 * Math.cos(angle);
			camera.position.x = 100 * Math.sin(angle);
			angle -= delta
			camera.lookAt(scene.position)
		}
		renderer.render(scene, camera);
	}
	render();
	camera.lookAt(scene.position);
}
const hexToRgbTreeJs = (hex) => {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

	return result ? {
		r: parseInt(result[1], 16) / 255,
		g: parseInt(result[2], 16) / 255,
		b: parseInt(result[3], 16) / 255
	} : null;
}