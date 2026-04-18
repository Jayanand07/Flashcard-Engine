import React from "react";

interface SkeletonProps {
  w?: string;
  h?: string;
  r?: string;
  className?: string;
}

const Skeleton = ({ w, h, r = "12px", className = "" }: SkeletonProps) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: w || "100%",
        height: h || "20px",
        borderRadius: r,
      }}
    />
  );
};

export default Skeleton;
