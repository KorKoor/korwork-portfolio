import React, { useCallback } from 'react';
import { Player } from './Player';
import { RoomSprite } from './RoomProps';

interface RoomProps {
  onInteractDesk: () => void;
}

const FLOOR_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];
const WALL_ROTATION: [number, number, number] = [0, 0, 0];

export const Room: React.FC<RoomProps> = React.memo(({ onInteractDesk }) => {
  const interactDesk = useCallback(() => onInteractDesk(), [onInteractDesk]);

  return (
    <group>
      {/* ============================================================
          ISOMETRIC ROOM FOUNDATION
          Everything is deliberately chunky and layered so the room
          reads like a pixel-art diorama instead of flat primitives.
      ============================================================ */}
      <mesh position={[0, -0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[11.2, 0.42, 11.2]} />
        <meshStandardMaterial color="#06070c" roughness={1} />
      </mesh>
      <mesh position={[0, -0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.55, 0.18, 10.55]} />
        <meshStandardMaterial color="#15121b" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.10, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.08, 0.12, 10.08]} />
        <meshStandardMaterial color="#292531" roughness={0.94} />
      </mesh>

      {/* Floor plank relief. */}
      {[-4.25, -3.05, -1.85, -0.65, 0.55, 1.75, 2.95, 4.15].map((z) => (
        <mesh key={`plank-${z}`} position={[0, 0.18, z]} receiveShadow>
          <boxGeometry args={[9.72, 0.035, 0.055]} />
          <meshStandardMaterial color="#4a3d4b" roughness={0.9} />
        </mesh>
      ))}

      {/* Raised central rug: several layers for visible relief. */}
      <mesh position={[-0.25, 0.22, 1.20]} castShadow receiveShadow>
        <boxGeometry args={[7.35, 0.12, 4.85]} />
        <meshStandardMaterial color="#17151f" roughness={1} />
      </mesh>
      <mesh position={[-0.25, 0.29, 1.20]} receiveShadow>
        <boxGeometry args={[7.08, 0.045, 4.58]} />
        <meshStandardMaterial color="#302a3d" roughness={1} />
      </mesh>
      <mesh position={[-0.25, 0.325, 1.20]}>
        <boxGeometry args={[6.92, 0.018, 4.42]} />
        <meshStandardMaterial color="#383248" roughness={1} />
      </mesh>
      <mesh position={[-0.25, 0.35, -1.00]}>
        <boxGeometry args={[6.94, 0.035, 0.065]} />
        <meshStandardMaterial color="#61576c" roughness={0.86} />
      </mesh>
      <mesh position={[-0.25, 0.35, 3.40]}>
        <boxGeometry args={[6.94, 0.035, 0.065]} />
        <meshStandardMaterial color="#61576c" roughness={0.86} />
      </mesh>
      <mesh position={[-3.72, 0.35, 1.20]}>
        <boxGeometry args={[0.065, 0.035, 4.8]} />
        <meshStandardMaterial color="#61576c" roughness={0.86} />
      </mesh>
      <mesh position={[3.22, 0.35, 1.20]}>
        <boxGeometry args={[0.065, 0.035, 4.8]} />
        <meshStandardMaterial color="#61576c" roughness={0.86} />
      </mesh>

      {/* Isometric neon perimeter. */}
      <mesh position={[0, 0.25, -4.67]}>
        <boxGeometry args={[9.45, 0.035, 0.055]} />
        <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={2.1} toneMapped={false} />
      </mesh>
      <mesh position={[-4.67, 0.25, 0]}>
        <boxGeometry args={[0.055, 0.035, 9.45]} />
        <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={1.7} toneMapped={false} />
      </mesh>

      {/* ============================================================
          WALLS / CHUNKY PIXEL-ART TRIM
      ============================================================ */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <boxGeometry args={[10, 5, 0.20]} />
        <meshStandardMaterial color="#0c1424" roughness={0.99} />
      </mesh>
      <mesh position={[-5, 2.5, 0]} receiveShadow>
        <boxGeometry args={[0.20, 5, 10]} />
        <meshStandardMaterial color="#111b30" roughness={0.99} />
      </mesh>
      <mesh position={[0, 4.86, -4.88]} castShadow>
        <boxGeometry args={[10.0, 0.18, 0.28]} />
        <meshStandardMaterial color="#070a12" roughness={0.92} />
      </mesh>
      <mesh position={[-4.88, 4.86, 0]} castShadow>
        <boxGeometry args={[0.28, 0.18, 10.0]} />
        <meshStandardMaterial color="#070a12" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.55, -4.84]} receiveShadow>
        <boxGeometry args={[9.72, 0.72, 0.16]} />
        <meshStandardMaterial color="#080c16" roughness={0.96} />
      </mesh>
      <mesh position={[0, 0.88, -4.73]}>
        <boxGeometry args={[9.52, 0.075, 0.08]} />
        <meshStandardMaterial color="#34415d" roughness={0.78} />
      </mesh>
      <mesh position={[-4.84, 0.55, 0]} receiveShadow>
        <boxGeometry args={[0.16, 0.72, 9.72]} />
        <meshStandardMaterial color="#080c16" roughness={0.96} />
      </mesh>

      {/* ============================================================
          WALL PROPS — each one belongs to a real room zone
      ============================================================ */}
      {/* Bed wall: inspiration board + small prints. */}
      <RoomSprite
        position={[-2.55, 3.38, -4.70]}
        crop={{ x: 351, y: 22, width: 384, height: 302 }}
        height={1.72}
        rotation={WALL_ROTATION}
        depthOffset={0.025}
      />

      {/* Desk wall: window, poster and hanging plant. */}
      <RoomSprite
        position={[0.10, 3.45, -4.69]}
        crop={{ x: 880, y: 28, width: 244, height: 278 }}
        height={1.82}
        rotation={WALL_ROTATION}
        depthOffset={0.027}
      />
      <RoomSprite
        position={[2.30, 3.50, -4.68]}
        crop={{ x: 1150, y: 15, width: 143, height: 196 }}
        height={1.42}
        rotation={WALL_ROTATION}
        depthOffset={0.029}
      />
      <RoomSprite
        position={[3.35, 3.02, -4.67]}
        crop={{ x: 744, y: 11, width: 114, height: 296 }}
        height={1.72}
        rotation={WALL_ROTATION}
        depthOffset={0.031}
      />
      <RoomSprite
        position={[4.22, 2.58, -4.66]}
        crop={{ x: 1424, y: 16, width: 102, height: 311 }}
        height={2.05}
        rotation={WALL_ROTATION}
        depthOffset={0.033}
      />

      {/* ============================================================
          BED ZONE — horizontal sprite + chunky isometric frame
      ============================================================ */}
      <group position={[-2.20, 0, -2.18]}>
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.82, 0.34, 3.36]} />
          <meshStandardMaterial color="#0b0a11" roughness={1} />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.58, 0.20, 3.12]} />
          <meshStandardMaterial color="#3b2725" roughness={0.86} />
        </mesh>
        <mesh position={[0, 0.49, 0]} receiveShadow>
          <boxGeometry args={[3.34, 0.08, 2.91]} />
          <meshStandardMaterial color="#69452f" roughness={0.78} />
        </mesh>

        {/* Headboard sits exactly against the back wall and follows the same depth language as the desk. */}
        <mesh position={[0, 0.94, -1.48]} castShadow receiveShadow>
          <boxGeometry args={[3.50, 1.08, 0.22]} />
          <meshStandardMaterial color="#422a28" roughness={0.88} />
        </mesh>
        <mesh position={[0, 1.46, -1.55]} castShadow>
          <boxGeometry args={[3.68, 0.18, 0.32]} />
          <meshStandardMaterial color="#7d5539" roughness={0.73} />
        </mesh>
        <mesh position={[0, 1.32, -1.68]}>
          <boxGeometry args={[3.28, 0.045, 0.025]} />
          <meshStandardMaterial color="#ad7548" roughness={0.72} />
        </mesh>

        {/* Real pixel-art bed. Never billboarded: it remains a floor sprite. */}
        <RoomSprite
          position={[0, 0.56, 0.02]}
          crop={{ x: 4, y: 569, width: 418, height: 371 }}
          height={2.72}
          rotation={FLOOR_ROTATION}
          depthOffset={0.06}
        />

        {/* Tiny props from the atlas placed where a player would naturally expect them. */}
        <RoomSprite
          position={[-1.10, 0.64, 0.55]}
          crop={{ x: 688, y: 785, width: 132, height: 111 }}
          height={0.42}
          rotation={FLOOR_ROTATION}
          depthOffset={0.065}
        />
      </group>

      {/* Bedside table: a real piece of furniture, not a floating box. */}
      <group position={[-0.15, 0, -3.55]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.76, 0.72]} />
          <meshStandardMaterial color="#3b2623" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.83, 0]} castShadow>
          <boxGeometry args={[1.00, 0.12, 0.80]} />
          <meshStandardMaterial color="#795039" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.55, 0.37]}>
          <boxGeometry args={[0.58, 0.22, 0.025]} />
          <meshStandardMaterial color="#261a1a" roughness={0.84} />
        </mesh>
        <mesh position={[0, 0.57, 0.39]}>
          <boxGeometry args={[0.12, 0.035, 0.025]} />
          <meshStandardMaterial color="#a1724b" />
        </mesh>
        <mesh position={[0, 1.08, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.22, 8]} />
          <meshStandardMaterial color="#15121a" />
        </mesh>
        <mesh position={[0, 1.25, 0]}>
          <coneGeometry args={[0.22, 0.24, 8]} />
          <meshStandardMaterial color="#d28b43" emissive="#ff9f43" emissiveIntensity={0.35} />
        </mesh>
        <pointLight position={[0, 1.26, 0.08]} intensity={0.40} color="#ffb15a" distance={2.4} decay={2} />
      </group>

      {/* ============================================================
          DESK ZONE — large workstation with pixel-art props on top
      ============================================================ */}
      <group position={[1.95, 0, -3.55]} onClick={interactDesk}>
        {/* Two solid drawer pedestals. */}
        <mesh position={[-1.72, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.78, 0.86]} />
          <meshStandardMaterial color="#291a18" roughness={0.94} />
        </mesh>
        <mesh position={[1.72, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.82, 0.78, 0.86]} />
          <meshStandardMaterial color="#291a18" roughness={0.94} />
        </mesh>

        {/* Drawer faces give the silhouette little pixel-art highlights. */}
        {[-1.72, 1.72].map((x) => (
          <React.Fragment key={`drawer-${x}`}>
            <mesh position={[x, 0.56, -0.45]}>
              <boxGeometry args={[0.60, 0.19, 0.025]} />
              <meshStandardMaterial color="#4c3024" roughness={0.82} />
            </mesh>
            <mesh position={[x, 0.30, -0.45]}>
              <boxGeometry args={[0.60, 0.19, 0.025]} />
              <meshStandardMaterial color="#4c3024" roughness={0.82} />
            </mesh>
            <mesh position={[x, 0.56, -0.47]}>
              <boxGeometry args={[0.10, 0.025, 0.02]} />
              <meshStandardMaterial color="#a4754d" />
            </mesh>
            <mesh position={[x, 0.30, -0.47]}>
              <boxGeometry args={[0.10, 0.025, 0.02]} />
              <meshStandardMaterial color="#a4754d" />
            </mesh>
          </React.Fragment>
        ))}

        {/* Thick tabletop + front fascia + rear rail. */}
        <mesh position={[0, 0.96, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.18, 0.20, 1.12]} />
          <meshStandardMaterial color="#70492f" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.83, -0.54]}>
          <boxGeometry args={[4.82, 0.12, 0.10]} />
          <meshStandardMaterial color="#925e39" roughness={0.74} />
        </mesh>
        <mesh position={[0, 1.08, 0.43]}>
          <boxGeometry args={[4.82, 0.07, 0.07]} />
          <meshStandardMaterial color="#9c6942" roughness={0.76} />
        </mesh>
        <mesh position={[-2.16, 0.34, 0]} castShadow>
          <boxGeometry args={[0.18, 0.68, 0.80]} />
          <meshStandardMaterial color="#231614" roughness={0.96} />
        </mesh>
        <mesh position={[2.16, 0.34, 0]} castShadow>
          <boxGeometry args={[0.18, 0.68, 0.80]} />
          <meshStandardMaterial color="#231614" roughness={0.96} />
        </mesh>
        <mesh position={[0, 0.16, -0.42]}>
          <boxGeometry args={[4.25, 0.05, 0.035]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>

        {/* Desktop items: screen, keyboard, mouse, phone, camera and cup from atlas. */}
        <RoomSprite
          position={[-1.58, 1.43, -0.06]}
          crop={{ x: 220, y: 359, width: 263, height: 212 }}
          height={1.04}
          depthOffset={0.06}
        />
        <RoomSprite
          position={[0.02, 1.57, -0.06]}
          crop={{ x: 394, y: 345, width: 264, height: 195 }}
          height={1.20}
          depthOffset={0.065}
        />
        <RoomSprite
          position={[1.45, 1.57, -0.05]}
          crop={{ x: 662, y: 335, width: 135, height: 220 }}
          height={1.18}
          depthOffset={0.07}
        />
        <RoomSprite
          position={[2.25, 1.25, 0.22]}
          crop={{ x: 799, y: 318, width: 166, height: 244 }}
          height={1.08}
          depthOffset={0.075}
        />
        <RoomSprite
          position={[0.75, 1.15, 0.38]}
          crop={{ x: 431, y: 558, width: 340, height: 92 }}
          height={0.34}
          depthOffset={0.08}
        />
        <RoomSprite
          position={[1.55, 1.18, 0.34]}
          crop={{ x: 685, y: 565, width: 106, height: 92 }}
          height={0.34}
          depthOffset={0.082}
        />
        <RoomSprite
          position={[-0.90, 1.17, 0.38]}
          crop={{ x: 792, y: 557, width: 105, height: 108 }}
          height={0.30}
          depthOffset={0.084}
        />
      </group>

      {/* Hanging plant directly above the workstation corner. */}
      <RoomSprite
        position={[3.18, 2.10, -4.63]}
        crop={{ x: 744, y: 11, width: 114, height: 296 }}
        height={1.62}
        depthOffset={0.08}
      />

      {/* ============================================================
          DESK CHAIR — chunky silhouette with seat, back and wheels
      ============================================================ */}
      <group position={[1.55, 0.30, -2.15]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.70, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.12, 0.18, 1.02]} />
          <meshStandardMaterial color="#20202a" roughness={0.84} />
        </mesh>
        <mesh position={[0, 1.28, 0.34]} castShadow receiveShadow>
          <boxGeometry args={[1.05, 1.10, 0.20]} />
          <meshStandardMaterial color="#171821" roughness={0.86} />
        </mesh>
        <mesh position={[0, 1.20, 0.20]}>
          <boxGeometry args={[0.58, 0.66, 0.045]} />
          <meshStandardMaterial color="#2d3140" roughness={0.82} />
        </mesh>
        <mesh position={[-0.62, 0.86, 0]} castShadow>
          <boxGeometry args={[0.14, 0.12, 0.68]} />
          <meshStandardMaterial color="#11131b" />
        </mesh>
        <mesh position={[0.62, 0.86, 0]} castShadow>
          <boxGeometry args={[0.14, 0.12, 0.68]} />
          <meshStandardMaterial color="#11131b" />
        </mesh>
        <mesh position={[0, 0.43, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.42, 8]} />
          <meshStandardMaterial color="#101119" metalness={0.5} roughness={0.6} />
        </mesh>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.20, 0]} castShadow>
            <boxGeometry args={[0.72, 0.08, 0.10]} />
            <meshStandardMaterial color="#11131b" />
          </mesh>
        ))}
      </group>

      {/* ============================================================
          SOFA ZONE — front-left lounge area
      ============================================================ */}
      <group position={[-3.10, 0, 1.95]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.75, 0.72, 1.38]} />
          <meshStandardMaterial color="#20202d" roughness={0.94} />
        </mesh>
        <mesh position={[0, 1.05, -0.47]} castShadow receiveShadow>
          <boxGeometry args={[2.78, 1.12, 0.24]} />
          <meshStandardMaterial color="#171722" roughness={0.96} />
        </mesh>
        <mesh position={[-1.18, 0.83, 0]} castShadow>
          <boxGeometry args={[0.26, 0.90, 1.45]} />
          <meshStandardMaterial color="#191923" roughness={0.94} />
        </mesh>
        <mesh position={[1.18, 0.83, 0]} castShadow>
          <boxGeometry args={[0.26, 0.90, 1.45]} />
          <meshStandardMaterial color="#191923" roughness={0.94} />
        </mesh>
        <mesh position={[-0.65, 0.83, 0.15]} castShadow>
          <boxGeometry args={[1.05, 0.30, 0.92]} />
          <meshStandardMaterial color="#303044" roughness={0.90} />
        </mesh>
        <mesh position={[0.65, 0.83, 0.15]} castShadow>
          <boxGeometry args={[1.05, 0.30, 0.92]} />
          <meshStandardMaterial color="#303044" roughness={0.90} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[2.55, 0.10, 1.22]} />
          <meshStandardMaterial color="#101018" />
        </mesh>

        {/* Cat + comfort props belong to the sofa rather than the floor. */}
        <RoomSprite
          position={[0.25, 1.22, -0.56]}
          crop={{ x: 686, y: 780, width: 140, height: 120 }}
          height={0.54}
          rotation={WALL_ROTATION}
          depthOffset={0.09}
        />
      </group>

      {/* ============================================================
          COFFEE TABLE — props are grouped around a readable focal point
      ============================================================ */}
      <group position={[-0.95, 0, 1.45]}>
        <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.42, 0.16, 1.38]} />
          <meshStandardMaterial color="#5d3928" roughness={0.80} />
        </mesh>
        <mesh position={[0, 0.39, 0]}>
          <boxGeometry args={[2.18, 0.06, 1.16]} />
          <meshStandardMaterial color="#7a4b31" roughness={0.78} />
        </mesh>
        {[
          [-0.92, 0.20, -0.47],
          [0.92, 0.20, -0.47],
          [-0.92, 0.20, 0.47],
          [0.92, 0.20, 0.47],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <boxGeometry args={[0.14, 0.40, 0.14]} />
            <meshStandardMaterial color="#38231e" roughness={0.90} />
          </mesh>
        ))}

        <RoomSprite
          position={[-0.52, 0.64, -0.12]}
          crop={{ x: 670, y: 650, width: 110, height: 94 }}
          height={0.34}
          rotation={FLOOR_ROTATION}
          depthOffset={0.10}
        />
        <RoomSprite
          position={[0.35, 0.65, 0.10]}
          crop={{ x: 786, y: 650, width: 120, height: 104 }}
          height={0.34}
          rotation={FLOOR_ROTATION}
          depthOffset={0.102}
        />
        <RoomSprite
          position={[0.82, 0.64, -0.32]}
          crop={{ x: 910, y: 675, width: 100, height: 92 }}
          height={0.28}
          rotation={FLOOR_ROTATION}
          depthOffset={0.104}
        />
      </group>

      {/* ============================================================
          STORAGE / MEDIA CORNER — books, camera, small collectibles
      ============================================================ */
      <group position={[3.65, 0, 1.55]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.22, 1.36, 0.68]} />
          <meshStandardMaterial color="#251918" roughness={0.94} />
        </mesh>
        {[-0.42, 0, 0.42].map((y, i) => (
          <mesh key={i} position={[0, 0.34 + y, -0.36]}>
            <boxGeometry args={[0.88, 0.055, 0.025]} />
            <meshStandardMaterial color="#76513c" roughness={0.76} />
          </mesh>
        ))}
        <mesh position={[0, 1.46, 0]}>
          <boxGeometry args={[1.38, 0.10, 0.78]} />
          <meshStandardMaterial color="#6f4930" roughness={0.78} />
        </mesh>

        <RoomSprite
          position={[-0.30, 1.55, -0.40]}
          crop={{ x: 1115, y: 314, width: 225, height: 145 }}
          height={0.55}
          depthOffset={0.10}
        />
        <RoomSprite
          position={[0.30, 1.55, -0.40]}
          crop={{ x: 1335, y: 316, width: 160, height: 145 }}
          height={0.48}
          depthOffset={0.102}
        />
      </group>

      {/* Floor decor: skateboards / backpack zone. */}
      <RoomSprite
        position={[-4.00, 0.43, 0.10]}
        crop={{ x: 24, y: 394, width: 188, height: 420 }}
        height={1.45}
        rotation={FLOOR_ROTATION}
        depthOffset={0.03}
      />
      <RoomSprite
        position={[-3.55, 0.45, 0.55]}
        crop={{ x: 222, y: 646, width: 245, height: 292 }}
        height={0.90}
        rotation={FLOOR_ROTATION}
        depthOffset={0.032}
      />

      {/* ============================================================
          PLAYER / INTERACTION
      ============================================================ */}
      <Player onInteractDesk={interactDesk} />
    </group>
  );
});

Room.displayName = 'Room';
