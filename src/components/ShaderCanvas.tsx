import { useEffect, useRef } from 'react'
import vertSource from '../shaders/colorCycle.vert?raw'
import fragSource from '../shaders/colorCycle.frag?raw'

function initGL(canvas: HTMLCanvasElement, img: HTMLImageElement) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false })
  if (!gl) return null

  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  gl.viewport(0, 0, canvas.width, canvas.height)

  const vs = gl.createShader(gl.VERTEX_SHADER)!
  gl.shaderSource(vs, vertSource)
  gl.compileShader(vs)

  const fs = gl.createShader(gl.FRAGMENT_SHADER)!
  gl.shaderSource(fs, fragSource)
  gl.compileShader(fs)

  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.useProgram(program)

  // Fullscreen quad
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  // Texture
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0)
  const uTime = gl.getUniformLocation(program, 'uTime')

  return { gl, uTime }
}

export function ShaderCanvas({ imageSrc, className }: { imageSrc: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animId = 0
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageSrc

    img.onload = () => {
      const result = initGL(canvas, img)
      if (!result) return
      const { gl, uTime } = result
      const start = performance.now()

      const render = () => {
        gl.uniform1f(uTime, (performance.now() - start) / 1000)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        animId = requestAnimationFrame(render)
      }
      render()
    }

    return () => { cancelAnimationFrame(animId) }
  }, [imageSrc])

  return <canvas ref={canvasRef} className={className} />
}
