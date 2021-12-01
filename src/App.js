import React, { Suspense, useRef, useState, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { ContactShadows, Environment, useGLTF, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { CSG } from "three-csg-ts"
import { HexColorPicker } from "react-colorful"
import { proxy, useSnapshot } from "valtio"
import ReactSlider from "react-slider"

const state = proxy({
  numColumns: 4,
  showWindow: false,
  showSocket: true,
  showLightSwitch: true,
  currentItem: "panel",
  items: {
    wall: "orange",
    panel: "white",
    skirting: "white",
    window: "white",
  },
})

const PanelRectangle = ({ width, height, position, woodWidth = 0.01, woodDepth = 0.005 }) => {
  const snap = useSnapshot(state)

  const material = new THREE.MeshStandardMaterial({ color: snap.items.panel })

  const tbGeometry = new THREE.BoxBufferGeometry(width, woodWidth, woodDepth)
  const top = new THREE.Mesh(tbGeometry, material)
  const bottom = top.clone()
  bottom.rotateZ(Math.PI)

  const lrGeometry = new THREE.BoxBufferGeometry(height, woodWidth, woodDepth)
  const left = new THREE.Mesh(lrGeometry, material)
  const right = left.clone()
  left.rotateZ(Math.PI / 2)
  right.rotateZ((Math.PI * 3) / 2)

  return (
    <group position={position}>
      <primitive object={top} position={[0, height / 2 - woodWidth / 2, woodDepth / 2]} name="panel" />
      <primitive object={bottom} position={[0, -(height / 2 - woodWidth / 2), woodDepth / 2]} name="panel" />
      <primitive object={left} position={[-(width / 2 - woodWidth / 2), 0, woodDepth / 2]} name="panel" />
      <primitive object={right} position={[width / 2 - woodWidth / 2, 0, woodDepth / 2]} name="panel" />
    </group>
  )
}

const Wall = ({ width, height, children, holes = [] }) => {
  const ref = useRef()
  const snap = useSnapshot(state)

  // Cursor showing current color
  const [hovered, hover] = useState(null)
  useEffect(() => {
    const cursor = `<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><g filter="url(#filter0_d)"><path d="M29.5 47C39.165 47 47 39.165 47 29.5S39.165 12 29.5 12 12 19.835 12 29.5 19.835 47 29.5 47z" fill="${snap.items[hovered]}"/></g><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/><text fill="#000" style="white-space:pre" font-family="Inter var, sans-serif" font-size="10" letter-spacing="-.01em"><tspan x="35" y="63">${hovered}</tspan></text></g><defs><clipPath id="clip0"><path fill="#fff" d="M0 0h64v64H0z"/></clipPath><filter id="filter0_d" x="6" y="8" width="47" height="47" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dy="2"/><feGaussianBlur stdDeviation="3"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow"/><feBlend in="SourceGraphic" in2="effect1_dropShadow" result="shape"/></filter></defs></svg>`
    const auto = `<svg width="64" height="64" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="rgba(255, 255, 255, 0.5)" d="M29.5 54C43.031 54 54 43.031 54 29.5S43.031 5 29.5 5 5 15.969 5 29.5 15.969 54 29.5 54z" stroke="#000"/><path d="M2 2l11 2.947L4.947 13 2 2z" fill="#000"/></svg>`
    document.body.style.cursor = `url('data:image/svg+xml;base64,${btoa(hovered ? cursor : auto)}'), auto`
  }, [hovered, snap.items])

  const wallDepth = 0.001

  const material = new THREE.MeshStandardMaterial({ color: snap.items.wall })
  const geometry = new THREE.BoxBufferGeometry(width, height, wallDepth)
  let wall = new THREE.Mesh(geometry, material)

  holes.forEach(([x, y, w, h]) => {
    const mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(w, h, wallDepth * 10))
    mesh.position.add(new THREE.Vector3(x, y, 0))
    mesh.updateMatrix()
    wall = CSG.subtract(wall, mesh)
  })

  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation()
        hover(e.object.name)
      }}
      onPointerOut={(e) => e.intersections.length === 0 && hover(null)}
      onPointerMissed={() => (state.currentItem = null)}
      onClick={(e) => {
        e.stopPropagation()
        state.currentItem = e.object.name
      }}>
      <primitive object={wall} position={[0, 0, 0]} name="wall" />
      <mesh name="skirting" position={[0, height / -2 + 0.05, 0.005]}>
        <boxGeometry args={[width, 0.1, 0.005]} />
        <meshStandardMaterial color={snap.items.skirting} />
      </mesh>
      {children}
    </group>
  )
}

const Window = (props) => {
  const group = useRef()
  const { nodes, materials, animations } = useGLTF("windows.glb")
  //const { actions } = useAnimations(animations, group)
  const snap = useSnapshot(state)
  return (
    <group ref={group} {...props} dispose={null}>
      <group position={[0, 0, -0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={0.4}>
        <group>
          <mesh
            geometry={nodes.casement_bridged_frame_frame1_0.geometry}
            material={nodes.casement_bridged_frame_frame1_0.material}
            material-color={snap.items.window}
            name="window"
          />
        </group>
        <group rotation={[0, 0, 0]} position={[-1, 0, 0]}>
          <mesh
            geometry={nodes.casement_bridged_panelL_parts_0.geometry}
            material={nodes.casement_bridged_panelL_parts_0.material}
            name="window"
          />
          <mesh
            geometry={nodes.casement_bridged_panelL_frame2_0.geometry}
            material={materials.frame_2}
            material-color={snap.items.window}
            name="window"
          />
          <mesh
            geometry={nodes.casement_bridged_panelL_glass_0.geometry}
            material={nodes.casement_bridged_panelL_glass_0.material}
            name="window"
          />
        </group>
        <group rotation={[0, 0, 0.2]} position={[1, 0, 0]}>
          <mesh
            geometry={nodes.casement_bridged_panelR_parts_0.geometry}
            material={nodes.casement_bridged_panelR_parts_0.material}
            name="window"
          />
          <mesh
            geometry={nodes.casement_bridged_panelR_frame2_0.geometry}
            material={materials.frame_2}
            material-color={snap.items.window}
            name="window"
          />
          <mesh
            geometry={nodes.casement_bridged_panelR_glass_0.geometry}
            material={nodes.casement_bridged_panelR_glass_0.material}
            name="window"
          />
        </group>
      </group>
    </group>
  )
}

const WallSocket = (props) => {
  const { nodes } = useGLTF("socket.glb")
  return (
    <group {...props} dispose={null}>
      <group position={[0, 0, 0.005]} rotation={[0, Math.PI / -2, 0]} scale={0.9}>
        <group position={[0, 0.02, -0.01]} rotation={[0, 0, -0.22]}>
          <mesh geometry={nodes.Object_6.geometry} material={nodes.Object_6.material} name="socket" />
          <mesh geometry={nodes.Object_7.geometry} material={nodes.Object_7.material} name="socket" />
        </group>
        <group position={[0, 0.02, 0.01]} rotation={[0, 0, -0.22]}>
          <mesh geometry={nodes.Object_9.geometry} material={nodes.Object_9.material} name="socket" />
          <mesh geometry={nodes.Object_10.geometry} material={nodes.Object_10.material} name="socket" />
        </group>
        <mesh geometry={nodes.Object_4.geometry} material={nodes.Object_4.material} name="socket" />
      </group>
    </group>
  )
}

const LightSwitch = (props) => {
  const { nodes, materials } = useGLTF("switch.glb")
  return (
    <group {...props} dispose={null}>
      <group position={[-0.03, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0.02}>
        <group position={[1.67, 0.08, 8.33]} rotation={[-Math.PI / 2, 0, 0]}>
          <group position={[0, 0, -0.08]}>
            <mesh geometry={nodes.Box001__Default_0.geometry} material={materials.Default} name="switch" />
          </group>
        </group>
        <group position={[0.4, 0, 8.33]} rotation={[-Math.PI / 2, 0, -2.99]}>
          <mesh geometry={nodes.Cylinder001_Default_2_0.geometry} material={nodes.Cylinder001_Default_2_0.material} name="switch" />
        </group>
        <group position={[2.95, 0, 8.33]} rotation={[-Math.PI / 2, 0, -0.85]}>
          <mesh geometry={nodes.Cylinder002_Default_2_0.geometry} material={nodes.Cylinder002_Default_2_0.material} name="switch" />
        </group>
        <group position={[1.69, 0.12, 8.32]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={nodes.Box003_Default_3_0.geometry} material={materials.Default_3} name="switch" />
        </group>
      </group>
    </group>
  )
}

const Picker = () => {
  const snap = useSnapshot(state)
  return (
    <div>
      <HexColorPicker
        className="picker"
        color={snap.items[snap.currentItem]}
        onChange={(color) => (state.items[snap.currentItem] = color)}
      />
      <h1>{snap.currentItem}</h1>
    </div>
  )
}

const Slider = () => (
  <ReactSlider
    className="slider"
    thumbClassName="slider-thumb"
    trackClassName="slider-track"
    marks
    min={1}
    max={8}
    defaultValue={4}
    renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
    onChange={(mark) => (state.numColumns = mark)}
  />
)

const Options = () => {
  const snap = useSnapshot(state)
  const options = {
    showWindow: "Window?",
    showSocket: "Socket?",
    showLightSwitch: "Light switch?",
  }
  return (
    <div className="options">
      {Object.entries(options).map(([name, text], i) => (
        <div key={i}>
          <input id={name} type="checkbox" checked={snap[name]} onChange={() => (state[name] = !snap[name])} />
          <label htmlFor={name}>{text}</label>
        </div>
      ))}
    </div>
  )
}

const App = () => {
  const snap = useSnapshot(state)

  const numColumns = snap.numColumns
  const wallWidth = 2
  const wallHeight = 2

  const columnGap = 0.1

  const panelOffset = wallHeight * -0.15
  const panelHeight = wallHeight / 6
  const columnWidth = (wallWidth - columnGap * (numColumns + 1)) / numColumns

  const panelRectangles = []
  for (let i = 0; i < numColumns; i++) {
    const x = i * (columnWidth + columnGap) - (wallWidth / 2 - columnWidth / 2 - columnGap)
    panelRectangles.push(
      { width: columnWidth, height: panelHeight * 3.0, position: [x, panelOffset + panelHeight * 2, 0] },
      { width: columnWidth, height: panelHeight * 0.4, position: [x, panelOffset, 0] },
      { width: columnWidth, height: panelHeight * 1.0, position: [x, panelOffset - panelHeight, 0] },
    )
  }

  const wallSocketPosition = [0.8, -0.8, 0]
  const lightSwitchPosition = [-0.8, 0.2, 0]
  const windowPosition = [0, 0.35, 0]
  const windowHoles = snap.showWindow ? [[windowPosition[0], windowPosition[1], 0.8, 1]] : []

  return (
    <>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <spotLight intensity={0.5} angle={0.1} penumbra={1} position={[10, 15, 10]} castShadow />
        <Suspense fallback={null}>
          <Wall width={wallWidth} height={wallHeight} holes={windowHoles}>
            {panelRectangles.map((r, i) => (
              <PanelRectangle key={i} {...r} />
            ))}
            {snap.showWindow && <Window position={windowPosition} />}
            {snap.showSocket && <WallSocket position={wallSocketPosition} />}
            {snap.showLightSwitch && <LightSwitch position={lightSwitchPosition} />}
          </Wall>
          <Environment preset="apartment" />
          <ContactShadows rotation-x={Math.PI / 2} position={[0, -0.8, 0]} opacity={0.25} width={10} height={10} blur={1.5} far={0.8} />
        </Suspense>
        <OrbitControls enableZoom={true} />
      </Canvas>
      <Picker />
      <Slider />
      <Options />
    </>
  )
}

export default App
