import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Helix({ speed = 0.3 }: { speed?: number | undefined }) {
  const g = useRef<THREE.Group>(null);
  const { a, b, rungs } = useMemo(() => {
    const a: [number, number, number][] = [], b: typeof a = [], rungs: { pos: THREE.Vector3; quat: THREE.Quaternion; len: number }[] = [];
    const N = 40, H = 9;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 5, y = (i / N) * H - H / 2;
      const p1 = new THREE.Vector3(Math.cos(t) * 1.3, y, Math.sin(t) * 1.3);
      const p2 = new THREE.Vector3(Math.cos(t + Math.PI) * 1.3, y, Math.sin(t + Math.PI) * 1.3);
      a.push(p1.toArray() as [number, number, number]); b.push(p2.toArray() as [number, number, number]);
      if (i % 2 === 0) {
        const dir = p2.clone().sub(p1);
        rungs.push({ pos: p1.clone().add(p2).multiplyScalar(0.5), quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()), len: dir.length() });
      }
    }
    return { a, b, rungs };
  }, []);
  useFrame((_, d) => { if (g.current) { g.current.rotation.y += d * speed; } });
  return (
    <group ref={g} rotation={[0, 0, 0.35]}>
      {a.map((p, i) => (
        <mesh key={`a${i}`} position={p}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={1.4} /></mesh>
      ))}
      {b.map((p, i) => (
        <mesh key={`b${i}`} position={p}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color="#06B6D4" emissive="#06B6D4" emissiveIntensity={1.4} /></mesh>
      ))}
      {rungs.map((r, i) => (
        <mesh key={`r${i}`} position={r.pos} quaternion={r.quat}><cylinderGeometry args={[0.03, 0.03, r.len, 8]} /><meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={0.6} transparent opacity={0.7} /></mesh>
      ))}
    </group>
  );
}

export default function Helix3D({ speed }: { speed?: number | undefined }) {
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 50 }} dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={40} color="#a78bfa" />
      <pointLight position={[-5, -3, 3]} intensity={30} color="#22d3ee" />
      <Helix speed={speed} />
    </Canvas>
  );
}
