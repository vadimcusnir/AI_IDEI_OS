import { useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { RegistryCard, type RegistryServiceItem } from "./RegistryCard";

interface VirtualServiceListProps {
  services: RegistryServiceItem[];
  onServiceClick: (service: RegistryServiceItem) => void;
}

export function VirtualServiceList({ services, onServiceClick }: VirtualServiceListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: services.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 56, []),
    overscan: 20,
  });

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-220px)] overflow-auto rounded-lg"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            className="absolute top-0 left-0 w-full px-0.5"
            style={{
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <RegistryCard
              service={services[virtualRow.index]}
              onClick={onServiceClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
