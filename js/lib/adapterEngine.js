'use strict';

var AdapterEngine = { VERSION: '0' };

AdapterEngine.Game = function(width, height, scenesArray, startSceneIndex)
{
	//declare parameter variables
	this.appWidth = width;
	this.appHeight = height;
	this.startScene = startSceneIndex;
	this.scenes = scenesArray;
	
	//declare variables
	this.viewport;
	this.renderer;
	this.controlsHandler;
	this.currentLevel;
	this.controls = new AdapterEngine.ControlsHandler();
	
	/*
	 * init initialises all the variables and prepares the app for play.
	 */
	this.init = function()
	{
		Physijs.scripts.worker = 'js/lib/physijs_worker.js';
		Physijs.scripts.ammo = 'ammo.js';
		
		this.viewport = document.getElementById('viewport');
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(this.appWidth, this.appHeight);
		this.viewport.appendChild(this.renderer.domElement );
		
		this.controlsHandler = new AdapterEngine.ControlsHandler();
		this.controlsHandler.init();
		
		this.setScene(this.startScene);
		this.controls.init();
		
		this.startAnimate();
	}
	
	this.startAnimate = function()
	{
		requestAnimationFrame(this.startAnimate.bind(this));
		if(!this.currentLevel.paused)
		{
			this.currentLevel.preUpdate();
			this.render();
		}
	}
	
	this.render = function()
	{	
		this.renderer.render(this.currentLevel.scene, this.currentLevel.activeCamera);
	}
	
	this.setScene = function(scene)
	{
		document.getElementById('gui').innerHTML = '';
		document.getElementById('loadScreen').innerHTML = '';
		
		
		this.currentLevel = this.scenes[scene];
		this.currentLevel.init();
		this.currentLevel.preload();
	}
}
/*
 * Levels are instances of scenes that the player can play with.
 * They are specific objects with a few specific functions to streamline play.
 */
AdapterEngine.Scene = function(width, height, physics)
{
	var sceneSelf = this;
	//declare parameter variables
	this.cameraWidth = width;
	this.cameraHeight = height;
	this.physics = physics;
	
	//declare variables
	this.scene;
	this.activeCamera;
	this.paused;
	
	this.loadScreen;
	this.loadScreenImage;
	this.loadScreenSource = "img/preloader.png";;
	
	//declare libraries
	this.textureLibrary = new Array();
	this.textures;
	this.imageLibrary = new Array();
	this.images;
	this.objects = new Array();
	
	//unfilled functions
	this.generateScene = function() {}
	this.generateGUI = function() {}
	
	this.preUpdate = function()
	{
		if(!this.paused)
		{
			for(var j = 0; j < this.objects.length; j++)
			{
				sceneSelf.objects[j].update();
			}
			
			sceneSelf.update();	
		}
	}
	this.update = function(){}
	
	this.startScene = function()
	{
		this.loadScreenImage.style.opacity = 0;
		this.paused = false;
	}
	
	this.init = function()
	{
		this.paused = true;
		this.textures = new Array();
		this.images = new Array();
		
		if(!this.physics)
		{
			this.scene = new THREE.Scene();
		}
		else if(this.physics)
		{
			this.scene = new Physijs.Scene();
		}
	}
	
	this.preload = function()
	{
		this.loadScreen = document.getElementById('loadScreen');
		this.loadScreenImage = new Image();
		this.loadScreenImage.src = this.loadScreenSource;
		this.loadScreenImage.onload = function()
		{
			sceneSelf.loadScreen.appendChild(sceneSelf.loadScreenImage);
			sceneSelf.loadTextures(0);
		}
	}
	
	this.generateDefaultScene = function()
	{
		var defaultCamera  = new THREE.PerspectiveCamera(75, this.cameraWidth / this.cameraHeight, 0.1, 1000);
		defaultCamera.position.set(60, 50, 60);
		defaultCamera.lookAt(this.scene.position);
		this.scene.add(defaultCamera);
		this.activeCamera = defaultCamera;
		
		var defaultLight = new THREE.DirectionalLight( 0xFFFFFF );
		defaultLight.position.set(20, 40, 15);
		defaultLight.target.position.copy(this.scene.position);
		defaultLight.castShadow = true;
		defaultLight.shadowCameraLeft = -60;
		defaultLight.shadowCameraTop = -60;
		defaultLight.shadowCameraRight = 60;
		defaultLight.shadowCameraBottom = 60;
		defaultLight.shadowCameraNear = 20;
		defaultLight.shadowCameraFar = 200;
		defaultLight.shadowBias = -.0001
		defaultLight.shadowMapWidth = defaultLight.shadowMapHeight = 2048;
		defaultLight.shadowDarkness = .7;
		this.scene.add(defaultLight);
		
		var defaultBoxMaterial  = AdapterEngine.createLambertMaterial({color: 0x999999});
		var defaultBox  = AdapterEngine.createBoxMesh(50, 50, 50, defaultBoxMaterial, 0);
		defaultBox.receiveShadow = true;
		this.scene.add(defaultBox);
	}
	
	this.loadTextures = function(index)
	{
		if(index >= this.textureLibrary.length)
		{
			this.generateScene();
			this.loadImages(0);
		}
		else
		{
			this.textures[index] = THREE.ImageUtils.loadTexture(this.textureLibrary[index], undefined, function(event)
			{
				sceneSelf.loadTextures(index + 1);
			});
		}
	}
	
	this.loadImages = function(index)
	{
		if(index >= this.imageLibrary.length)
		{
			this.generateGUI();
			this.startScene();
		}
		else
		{			
			this.images[index] = new Image();
			this.images[index].src = this.imageLibrary[index];
			this.images[index].onload = function()
			{
				sceneSelf.loadImages(index + 1);
			}
		}
	}
}

/*
 * ControlsHandler is a tool that handles the input of the game.
 * This allows the player to check which keys are pressed,
 * and gives them a preset set of keys.
 */
AdapterEngine.ControlsHandler = function()
{
	this.keys = {
		UP:		{up: 1, down: 0},
		DOWN:	{up: 1, down: 0},
		LEFT:	{up: 1, down: 0},
		RIGHT:	{up: 1, down: 0},
		SPACE:	{up: 1, down: 0}};
	
	var controlHandlerSelf = this;
	
	this.init = function()
	{
		document.addEventListener("keydown", controlHandlerSelf.keyDownHandler, false);	
		document.addEventListener("keyup", controlHandlerSelf.keyUpHandler, false);
	}
	
	this.keyDownHandler = function(event)
	{
		var keyPressed = String.fromCharCode(event.keyCode);
		if(keyPressed == '&')
		{
			controlHandlerSelf.keys['UP']['up'] = 0;
			controlHandlerSelf.keys['UP']['down'] = 1;
		}
		else if(keyPressed == '(')
		{
			controlHandlerSelf.keys['DOWN']['up'] = 0;
			controlHandlerSelf.keys['DOWN']['down'] = 1;
		}
		else if(keyPressed == '%')
		{
			controlHandlerSelf.keys['LEFT']['up'] = 0;
			controlHandlerSelf.keys['LEFT']['down'] = 1;
		}
		else if(keyPressed == "'")
		{
			controlHandlerSelf.keys['RIGHT']['up'] = 0;
			controlHandlerSelf.keys['RIGHT']['down'] = 1;
		}
		else if(keyPressed == " ")
		{
			controlHandlerSelf.keys['SPACE']['up'] = 0;
			controlHandlerSelf.keys['SPACE']['down'] = 1;
		}
	}
	
	this.keyUpHandler = function(event)
	{
		var keyPressed = String.fromCharCode(event.keyCode);
		if(keyPressed == '&')
		{
			controlHandlerSelf.keys['UP']['up'] = 1;
			controlHandlerSelf.keys['UP']['down'] = 0;
		}
		else if(keyPressed == '(')
		{
			controlHandlerSelf.keys['DOWN']['up'] = 1;
			controlHandlerSelf.keys['DOWN']['down'] = 0;
		}
		else if(keyPressed == '%')
		{
			controlHandlerSelf.keys['LEFT']['up'] = 1;
			controlHandlerSelf.keys['LEFT']['down'] = 0;
		}
		else if(keyPressed == "'")
		{
			controlHandlerSelf.keys['RIGHT']['up'] = 1;
			controlHandlerSelf.keys['RIGHT']['down'] = 0;
		}
		else if(keyPressed == " ")
		{
			controlHandlerSelf.keys['SPACE']['up'] = 1;
			controlHandlerSelf.keys['SPACE']['down'] = 0;
		}
	}
	
	this.isKeyDown = function(key)
	{
		if(controlHandlerSelf.keys[key]['down'] == 1) return true;
		else if(controlHandlerSelf.keys[key]['down'] == 1) return false;
	}
	
	this.isKeyUp = function(key)
	{
		if(controlHandlerSelf.keys[key]['up'] == 1) return true;
		else if(controlHandlerSelf.keys[key]['up'] == 1) return false;
	}
}

AdapterEngine.createPerspectiveCamera = function(fov, aspect, near, far)
{
	return new THREE.PerspectiveCamera(fov, aspect, near, far);
}

AdapterEngine.createBoxMesh = function(x, y, z, material, mass)
{
	if(arguments.length == 4)
	{
		return new THREE.Mesh(new THREE.CubeGeometry(x, y, z), material);
	}
	else if(arguments.length == 5)
	{
		return new Physijs.BoxMesh(new THREE.CubeGeometry(x, y, z), material, mass);
	}
	else
	{
		throw "Box Mesh Creation error! Incorrect number of parameters. A box needs an X, Y, and Z size and a material. Mass for physics is optional."
	}
}

AdapterEngine.createPlaneMesh = function(x, y, material, mass)
{
	if(arguments.length = 3)
	{
		return new THREE.Mesh(new THREE.PlaneGeometry(x, y), material);
	}
	else if(arguments.length == 4)
	{
		return new Physijs.PlaneMesh(new THREE.PlaneGeometry(x, y), material, mass);
	}
	
}

AdapterEngine.createBasicMaterial = function(settings, friction, restitution)
{
	if(arguments.length == 1)
	{
		return new THREE.MeshBasicMaterial(settings);
	}
	else if(arguments.length == 3)
	{
		return new Physijs.createMaterial(new THREE.MeshBasicMaterial(settings), friction, restitution);
	}
	else
	{
		throw "Material Creation error! Incorrect number of parameters. Only settings will output a THREEJS material, adding friction and Restitution will output a Physi material."
	}
}

AdapterEngine.createLambertMaterial = function(settings, friction, restitution)
{
	if(arguments.length == 1)
	{
		return new THREE.MeshLambertMaterial(settings);
	}
	else if(arguments.length == 3)
	{
		return new Physijs.createMaterial(new THREE.MeshLambertMaterial(settings), friction, restitution);
	}
	else
	{
		throw "Material Creation error! Incorrect number of parameters. Only settings will output a THREEJS material, adding friction and Restitution will output a Physi material."
	}
}

AdapterEngine.degreesToRadials = function(value)
{
	var newvalue = value * Math.PI / 180;
	return newvalue;
}
