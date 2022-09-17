import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

type LineProps = {}

const Line: React.FC<LineProps> = ({ }) => {
    const containerEl = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const renderer = new THREE.WebGL1Renderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        if (containerEl.current) {
            containerEl.current.appendChild(renderer.domElement)
        }

        const camera = new THREE.OrthographicCamera()
        camera.position.set(0, 0, 100)
        camera.lookAt(0, 0, 0)

        const scene = new THREE.Scene()

        const geometry = new THREE.PlaneGeometry(2, 2)
        const material = new THREE.ShaderMaterial({
            vertexShader: `
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 0.5, 1.0);
                }
            `,
            fragmentShader: `
                void main() {
                    gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
                }
            `
        })

        const plane = new THREE.Mesh(geometry, material)
        scene.add(plane)

        renderer.render(scene, camera)

        return () => {
            renderer.dispose()
        }
    }, [])
    

    return <div ref={containerEl} />
}

export default Line;
