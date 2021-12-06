import React, { Suspense, useState } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { ContactShadows, Environment, useGLTF, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { CSG } from "three-csg-ts"
import { useGesture } from "react-use-gesture"
import { useControls } from "leva"
import { proxy, useSnapshot } from "valtio"

const state = proxy({
  dragging: false,
})

const PanelRectangle = ({ width, height, position, color = "white", woodWidth = 0.01, woodDepth = 0.005 }) => {
  const material = new THREE.MeshStandardMaterial({ color: color })

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

const Wall = ({ children, color, width, height, depth = 0.001, holes = [] }) => {
  const material = new THREE.MeshStandardMaterial({ color: color })
  const geometry = new THREE.BoxBufferGeometry(width, height, depth)
  let wall = new THREE.Mesh(geometry, material)

  holes.forEach(([x, y, w, h]) => {
    const mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(w, h, depth * 10))
    mesh.position.add(new THREE.Vector3(x, y, 0))
    mesh.updateMatrix()
    wall = CSG.subtract(wall, mesh)
  })

  return (
    <group>
      <primitive object={wall} position={[0, 0, 0]} name="wall" />
      {children}
    </group>
  )
}

const SkirtingBoard = ({ width, height, color, ...props }) => (
  <mesh name="skirting" position={[0, height / -2 + 0.05, 0.005]} {...props}>
    <boxGeometry args={[width, 0.1, 0.005]} />
    <meshStandardMaterial color={color} />
  </mesh>
)

const Window = ({ color, ...props }) => {
  const { nodes, materials } = useGLTF("windows.glb")
  return (
    <group dispose={null} {...props}>
      <group position={[0, 0, -0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={0.4}>
        <group>
          <mesh
            geometry={nodes.casement_bridged_frame_frame1_0.geometry}
            material={nodes.casement_bridged_frame_frame1_0.material}
            material-color={color}
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
            material-color={color}
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
            material-color={color}
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
    <group dispose={null} {...props}>
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
    <group dispose={null} {...props}>
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

const Draggable = ({ children, position: p = [0, 0, 0], ...props }) => {
  const [position, setPosition] = useState(p)
  const { size, viewport } = useThree()
  const aspect = size.width / viewport.width // TODO: Calc aspect properly (e.g. with zoom)
  const bind = useGesture({
    onDrag: ({ offset: [x, y] }) => {
      const [, , z] = position
      setPosition([x / aspect, -y / aspect, z])
    },
    onDragStart: () => (state.dragging = true),
    onDragEnd: () => (state.dragging = false),
  })
  return (
    <group position={position} {...bind()} dispose={null} {...props}>
      {children}
    </group>
  )
}

const App = () => {
  const snap = useSnapshot(state)

  const { width: wallWidth, height: wallHeight, colour: wallColor } = useControls("Wall", {
    width: 2,
    height: 2,
    colour: "#ff7f00",
  })

  const { columns: panelColumnCount, gap: columnGap, width: panelWoodWidth, depth: panelWoodDepth, colour: panelColor } = useControls(
    "Panels",
    {
      type: { options: ["Traditional", "Shaker", "Shiplap Horizontal"] },
      height: { options: ["Full Height", "Half Height", "3/4 Height"] },
      columns: { value: 4, min: 1, max: 10, step: 1 },
      gap: 0.1,
      width: 0.01,
      depth: 0.005,
      colour: "#fff",
    },
  )

  const panelOffset = wallHeight * -0.15
  const panelHeight = wallHeight / 6
  const columnWidth = (wallWidth - columnGap * (panelColumnCount + 1)) / panelColumnCount

  const panelRectangles = []
  for (let i = 0; i < panelColumnCount; i++) {
    const x = i * (columnWidth + columnGap) - (wallWidth / 2 - columnWidth / 2 - columnGap)
    panelRectangles.push(
      { width: columnWidth, height: panelHeight * 3.0, position: [x, panelOffset + panelHeight * 2, 0] },
      { width: columnWidth, height: panelHeight * 0.4, position: [x, panelOffset, 0] },
      { width: columnWidth, height: panelHeight * 1.0, position: [x, panelOffset - panelHeight, 0] },
    )
  }

  const { "skirting board": showSkirting, "light switch": lightSwitchCount, "plug socket": socketCount } = useControls("Features", {
    "light switch": { value: 0, min: 0, max: 4, step: 1 },
    "plug socket": { value: 0, min: 0, max: 4, step: 1 },
    "skirting board": true,
    "dado rail": false,
    fireplace: false,
  })

  const { show: showWindow, position: windowPosition, colour: windowColor } = useControls("Window", {
    show: false,
    type: { options: ["Casement Bridged", "Folding", "Glider"] },
    colour: "#fff",
    position: [0, 0.35, 0],
  })
  const windowHoles = showWindow ? [[windowPosition[0], windowPosition[1], 0.8, 1]] : []

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.7} />
      <spotLight intensity={0.5} angle={0.1} penumbra={1} position={[10, 15, 10]} castShadow />
      <Suspense fallback={null}>
        <Wall width={wallWidth} height={wallHeight} color={wallColor} holes={windowHoles}>
          {showSkirting && <SkirtingBoard width={wallWidth} height={wallHeight} colour="white" />}
          {showWindow && (
            <Draggable>
              <Window position={windowPosition} color={windowColor} />
            </Draggable>
          )}
          {[...Array(socketCount)].map((_, i) => (
            <Draggable key={i}>
              <WallSocket />
            </Draggable>
          ))}
          {[...Array(lightSwitchCount)].map((_, i) => (
            <Draggable key={i}>
              <LightSwitch />
            </Draggable>
          ))}
          {panelRectangles.map((r, i) => (
            <PanelRectangle key={i} woodWidth={panelWoodWidth} woodDepth={panelWoodDepth} color={panelColor} {...r} />
          ))}
        </Wall>
      </Suspense>
      <Suspense fallback={null}>
        <Environment preset="apartment" />
        <ContactShadows rotation-x={Math.PI / 2} position={[0, -0.8, 0]} opacity={0.25} width={10} height={10} blur={1.5} far={0.8} />
        <OrbitControls enabled={!snap.dragging} />
      </Suspense>
    </Canvas>
  )
}

export default App
