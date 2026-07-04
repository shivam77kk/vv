"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";

interface Graph3DProps {
  data: {
    nodes: any[];
    links: any[];
  };
  onNodeClick: (node: any) => void;
}

export default function Graph3D({ data, onNodeClick }: Graph3DProps) {
  const fgRef = useRef<any>(null);
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWindowSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Use flat, vibrant materials for cartoon effect
  const nodeMaterial = useCallback((node: any) => {
    const colors = ["#FF4D4D", "#FFD93D", "#4D96FF", "#6BCB77", "#9D4EDD"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // MeshToonMaterial for comic style
    return new THREE.MeshToonMaterial({ 
      color: color,
      outlineParameters: {
        thickness: 0.05,
        color: new THREE.Color("#1A1A1A"),
        alpha: 1,
        visible: true,
        keepSize: true
      }
    } as any);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#F7F7F7]">
      <ForceGraph3D
        ref={fgRef}
        width={windowSize.width}
        height={windowSize.height}
        graphData={data}
        nodeId="id"
        nodeLabel="id"
        nodeVal={(node: any) => (node.complexity === 'High' ? 12 : node.complexity === 'Medium' ? 8 : 5)}
        nodeThreeObject={(node: any) => {
          const geometry = new THREE.BoxGeometry(
            node.complexity === 'High' ? 12 : 8,
            node.complexity === 'High' ? 12 : 8,
            node.complexity === 'High' ? 12 : 8
          );
          
          // Edge geometry for thick black borders (cartoon style)
          const edges = new THREE.EdgesGeometry(geometry);
          const line = new THREE.LineSegments(
            edges, 
            new THREE.LineBasicMaterial({ color: 0x1A1A1A, linewidth: 3 })
          );

          const mesh = new THREE.Mesh(geometry, nodeMaterial(node));
          mesh.add(line);
          return mesh;
        }}
        linkColor={() => "#1A1A1A"} // Thick black links
        linkWidth={3}
        backgroundColor="#F7F7F7"
        onNodeClick={(node) => {
          const nx = node.x || 0;
          const ny = node.y || 0;
          const nz = node.z || 0;
          const distance = 40;
          const distRatio = 1 + distance / Math.hypot(nx, ny, nz);

          fgRef.current?.cameraPosition(
            { x: nx * distRatio, y: ny * distRatio, z: nz * distRatio },
            node, // lookAt ({ x, y, z })
            3000  // ms transition duration
          );

          onNodeClick(node);
        }}
        controlType="orbit"
      />
    </div>
  );
}
