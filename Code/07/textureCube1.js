var canvas;
var gl;

var numTimesToSubdivide = 5;
var numVertices = 0;

var program;

var pointsArray = [];
var texCoordsArray = [];
var normalsArray = [];

var texture;
var modelView;
var projectionMatrix;

var va = vec4(0.0, 0.0, -1.0, 1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333, 1);

var theta = 0.0;
var phi = 0.0;

var position = [0, 0, 1];
// w a d s
var moveDirection = "";

var texCoord = [];

var thetaLoc;

function configureTexture(image) {
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

function triangle(a, b, c) {
  

  normalsArray.push(a);
  normalsArray.push(b);
  normalsArray.push(c);
  pointsArray.push(a);
  calcTexCoords(a);
  pointsArray.push(b);
  calcTexCoords(b);
  pointsArray.push(c);
  calcTexCoords(c);

  numVertices += 3;
}

function calcTexCoords(position) {
  const f =
    2 *
    Math.sqrt(
      position[0] * position[0] +
        position[1] * position[1] +
        (position[2] + 1) * (position[2] + 1)
    );
  if (f == 0) {
    texCoordsArray.push(vec2(0, 0));
    return;
  }
  const s = position[0] / f + 0.5;
  const t = position[1] / f + 0.5;
  texCoordsArray.push(vec2(s, t));
}

function divideTriangle(a, b, c, count) {
  if (count > 0) {
    var ab = mix(a, b, 0.5);
    var ac = mix(a, c, 0.5);
    var bc = mix(b, c, 0.5);

    ab = normalize(ab, true);
    ac = normalize(ac, true);
    bc = normalize(bc, true);

    divideTriangle(a, ab, ac, count - 1);
    divideTriangle(ab, b, bc, count - 1);
    divideTriangle(bc, c, ac, count - 1);
    divideTriangle(ab, bc, ac, count - 1);
  } else {
    triangle(a, b, c);
  }
}

function tetrahedron(a, b, c, d, n) {
  divideTriangle(a, b, c, n);
  divideTriangle(d, c, b, n);
  divideTriangle(a, d, b, n);
  divideTriangle(a, c, d, n);
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
  tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  var NBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, NBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  var image = document.getElementById("texImage");

  configureTexture(image);

  document.onkeydown = (e) => {
    moveDirection = e.key + "";
  };

  document.onkeyup = (e) => {
    moveDirection = "";
  };

  projectionMatrix = perspective(100, 1, 0.1, 2);

  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projectionMatrix)
  );

  render();
};

var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (moveDirection === "a") {
    position[0] -= 0.01;
  }
  if (moveDirection === "w") {
    position[2] -= 0.01;
  }
  if (moveDirection === "d") {
    position[0] += 0.01;
  }
  if (moveDirection === "s") {
    position[2] += 0.01;
  }
  if (moveDirection === " ") {
    position[1] += 0.01;
  }
  theta +=0.01
  var eye = vec3(
     Math.sin(theta) * Math.cos(phi),
     Math.sin(theta) * Math.sin(phi),
    Math.cos(theta)
  );

  modelView = lookAt(
    eye,
    vec3(0.0,0.0,0.0),
    vec3(0.0, 1.0, 0.0)
  );

  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "modelViewMatrix"),
    false,
    flatten(modelView)
  );
  gl.drawArrays(gl.TRIANGLES, 0, numVertices);
  requestAnimationFrame(render)
};
