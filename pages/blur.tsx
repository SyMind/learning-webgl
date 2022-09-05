import {useEffect, useRef} from 'react'
import {mat4} from 'gl-matrix'

const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;

    void main() {
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
    }
`

const fsSource = `
    varying highp vec2 vTextureCoord;

    uniform sampler2D uSampler;

    void main() {
        gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
`

/**
 * 创建指定类型的着色器，上传 source 源码并编译
 */
function loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type)!

    // 发送源码到着色器对象
    gl.shaderSource(shader, source)
  
    // 编译着色器程序
    gl.compileShader(shader)
  
    // 判断编译是否成功
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
    }

    return shader
}

function initShaderProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): WebGLShader | null {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
    if (!vertexShader) {
        return null
    }

    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!fragmentShader) {
        return null
    }
  
    // 创建着色器程序
    const shaderProgram = gl.createProgram()
    if (!shaderProgram) {
        return null
    }

    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)
  
    // 创建失败
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
        return null
    }
  
    return shaderProgram
}

function initBuffers(gl: WebGLRenderingContext) {
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = [
        1.0,  1.0,
        -1.0,  1.0,
        1.0, -1.0,
        -1.0, -1.0,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    const textureCoordBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
    const textureCoordinates = [
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW)

    return {
        position: positionBuffer,
        textureCoord: textureCoordBuffer,
    }
}

function drawScene(gl: WebGLRenderingContext, texture: WebGLTexture) {
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource)

    if (!shaderProgram) {
        return
    }

    const vertexPositionLocation = gl.getAttribLocation(shaderProgram, 'aVertexPosition')
    const projectionMatrixLocation = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix')
    const modelViewMatrixLocation = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clearDepth(1.0)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // 创建透视矩阵
    const fieldOfView = 45 * Math.PI / 180
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
    const projectionMatrix = mat4.create()
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

    const modelViewMatrix = mat4.create()
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0])

    // 告知 WebGL 如何把 position 从缓冲区提取到 vertexPosition 变量中
    const buffers = initBuffers(gl)

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.vertexAttribPointer(vertexPositionLocation, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vertexPositionLocation)

    const textureCoordLocation = gl.getAttribLocation(shaderProgram, "aTextureCoord")
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord)
    gl.vertexAttribPointer(textureCoordLocation, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(textureCoordLocation)

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    const uSamplerLocation = gl.getUniformLocation(shaderProgram, 'uSampler')
    gl.uniform1i(uSamplerLocation, 0);

    gl.useProgram(shaderProgram)

    // 设置着色器的 uniform 变量
    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix)
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function isPowerOf2(value: number): boolean {
    return (value & (value - 1)) === 0
}

function loadTexture(gl: WebGLRenderingContext, url: string): WebGLTexture | null {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    const level = 0
    const internalFormat = gl.RGBA
    const width = 1
    const height = 1
    const border = 0
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE
    const pixel = new Uint8Array([0, 0, 255, 255])
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel)

    const image = new Image()
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image)

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D)
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        }
    }
    image.src = url
    return texture
}

const Blur = () => {
    const canvasEl = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (!canvasEl.current) {
            return
        }
        const gl = canvasEl.current.getContext("webgl")
        if (!gl) {
            alert("无法初始化 WebGL，你的浏览器、操作系统或硬件等可能不支持 WebGL。")
            return
        }
        const texture = loadTexture(gl, "cubetexture.png")
        function render() {
            drawScene(gl!, texture!)
            requestAnimationFrame(render)
        }
        requestAnimationFrame(render)
    }, [])

    return (
        <canvas ref={canvasEl} width="640" height="480">
            你的浏览器似乎不支持或者禁用了 HTML5 <code>&lt;canvas&gt;</code> 元素。
        </canvas>
    )
}

export default Blur
